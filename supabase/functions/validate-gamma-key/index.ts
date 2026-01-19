import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gamma-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gammaApiKey = req.headers.get("x-gamma-api-key");
    
    if (!gammaApiKey) {
      return new Response(
        JSON.stringify({ valid: false, error: "API key is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[Gamma Validate] Testing API key...");

    // Try to fetch user info or themes to validate the key
    const response = await fetch("https://api.gamma.app/v1/user", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${gammaApiKey}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("[Gamma Validate] Key is valid, user:", userData.email || userData.id);
      
      return new Response(
        JSON.stringify({ 
          valid: true, 
          user: {
            email: userData.email,
            plan: userData.plan || userData.subscription?.plan,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If /user endpoint fails, try /themes as fallback
    const themesResponse = await fetch("https://api.gamma.app/v1/themes", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${gammaApiKey}`,
      },
    });

    if (themesResponse.ok) {
      console.log("[Gamma Validate] Key is valid (themes endpoint)");
      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorText = await response.text();
    console.log("[Gamma Validate] Key is invalid:", errorText);
    
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: response.status === 401 
          ? "API key inválida ou expirada" 
          : `Erro ao validar: ${response.status}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[Gamma Validate] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro de conexão";
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
