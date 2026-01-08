import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  consultantName: string;
  inviteToken: string;
  consultantEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, consultantName, inviteToken, consultantEmail }: InviteEmailRequest = await req.json();

    console.log(`Sending invite email to ${email} from ${consultantName}`);

    // Build registration URL with invite token
    const baseUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://app.centralinteligente.com";
    const registrationUrl = `${baseUrl}/?invite=${inviteToken}`;

    const emailResponse = await resend.emails.send({
      from: "Central Inteligente <onboarding@resend.dev>",
      to: [email],
      subject: `${consultantName} convidou você para a Central Inteligente`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - Central Inteligente</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 520px; width: 100%; border-collapse: collapse;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="font-size: 28px; font-weight: 700; color: #8b5cf6; letter-spacing: -0.5px;">
                ⚡ Central Inteligente
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.2);">
              
              <!-- Greeting -->
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Você foi convidado!
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 16px; color: #a1a1aa; line-height: 1.6;">
                <strong style="color: #8b5cf6;">${consultantName}</strong> convidou você para acessar a plataforma Central Inteligente e começar a acompanhar os resultados do seu negócio.
              </p>
              
              <!-- Features -->
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #8b5cf6;">
                  O que você terá acesso:
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #d4d4d8; line-height: 1.8;">
                  <li>Dashboard completo de vendas</li>
                  <li>Acompanhamento de metas por vendedor</li>
                  <li>Pipeline de leads e oportunidades</li>
                  <li>Rituais de gestão (RMR, PGV, FIV)</li>
                  <li>Insights com Inteligência Artificial</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${registrationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);">
                      Criar Minha Conta →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Token info -->
              <p style="margin: 24px 0 0; font-size: 12px; color: #71717a; text-align: center;">
                Ou copie o link: <span style="color: #8b5cf6;">${registrationUrl}</span>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #52525b;">
                Este convite expira em 7 dias.
              </p>
              <p style="margin: 0; font-size: 12px; color: #3f3f46;">
                © ${new Date().getFullYear()} Central Inteligente. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
