import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're a consultant
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and is a consultant
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is consultant
    const { data: profile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "consultant") {
      console.error("Profile error or not consultant:", profileError);
      return new Response(
        JSON.stringify({ error: "Apenas consultores podem gerenciar usuários de teste" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, password } = await req.json();
    console.log(`Action: ${action}, Email: ${email}`);

    // CREATE TEST USER
    if (action === "create") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Usuário com este email já existe" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile to be consultant (trigger already creates profile as business_owner)
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role: "consultant" })
        .eq("id", authData.user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        // Try to cleanup
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar perfil: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the test user creation in test_users_log
      const { error: logError } = await supabaseAdmin
        .from("test_users_log")
        .insert({
          created_by: user.id,
          test_user_id: authData.user.id,
          test_user_email: email,
        });

      if (logError) {
        console.error("Error logging test user creation:", logError);
        // Non-critical, continue anyway
      }

      console.log(`Test user created successfully: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Usuário de teste criado com sucesso",
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: "consultant",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE TEST USER
    if (action === "delete") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent self-deletion
      if (email === user.email) {
        return new Response(
          JSON.stringify({ error: "Não é possível deletar o próprio usuário" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call the database function to delete all user data
      const { data: deleteResult, error: deleteError } = await supabaseUser.rpc(
        "delete_user_and_all_data",
        { target_email: email }
      );

      if (deleteError) {
        console.error("Error deleting user data:", deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Now delete from auth.users using admin client
      const targetUserId = deleteResult.deleted_user_id;
      if (targetUserId) {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (authDeleteError) {
          console.error("Error deleting auth user:", authDeleteError);
          // Data already deleted, just log the error
        }
      }

      // Delete from test_users_log
      const { error: logDeleteError } = await supabaseAdmin
        .from("test_users_log")
        .delete()
        .eq("test_user_email", email);

      if (logDeleteError) {
        console.error("Error deleting test user log:", logDeleteError);
        // Non-critical, continue anyway
      }

      console.log(`Test user deleted successfully: ${email}`, deleteResult);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Usuário de teste deletado com sucesso",
          details: deleteResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use 'create' ou 'delete'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: `Erro inesperado: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
