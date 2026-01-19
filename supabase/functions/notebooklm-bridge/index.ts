import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RMRData {
  rmrId: string;
  month: number;
  year: number;
  theme: string;
  highlight: {
    name: string;
    reason: string;
  };
  previousMonth: {
    revenue: number;
    goal: number;
  };
  goal: number;
  strategies: string[];
  team: Array<{
    id: string;
    name: string;
    revenue: number;
    goal: number;
  }>;
  companyName?: string;
}

interface NotebookLMCredentials {
  projectId: string;
  location: string;
  serviceAccountJson: string;
}

// Get access token from service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Create JWT header and payload
    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    };

    // Encode header and payload
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import the private key and sign
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = serviceAccount.private_key
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s/g, "");
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${unsignedToken}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error: unknown) {
    console.error("Error getting access token:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to authenticate with Google Cloud: ${message}`);
  }
}

// Format RMR data as a structured document for NotebookLM
function formatRMRContent(data: RMRData): string {
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const monthName = monthNames[data.month - 1];
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  
  const content = `
# Reunião Mensal de Resultados (RMR) - ${monthName} ${data.year}
${data.companyName ? `## Empresa: ${data.companyName}` : ""}

## Tema Motivacional
${data.theme || "Não definido"}

## Destaque do Mês
**Colaborador:** ${data.highlight.name || "Não definido"}
**Motivo:** ${data.highlight.reason || "Não especificado"}

## Resultados do Mês Anterior
- **Faturamento:** ${formatCurrency(data.previousMonth.revenue)}
- **Meta:** ${formatCurrency(data.previousMonth.goal)}
- **Atingimento:** ${data.previousMonth.goal > 0 ? ((data.previousMonth.revenue / data.previousMonth.goal) * 100).toFixed(1) : 0}%

## Meta do Mês Atual
**Meta:** ${formatCurrency(data.goal)}

## Estratégias do Mês
${data.strategies.length > 0 ? data.strategies.map((s, i) => `${i + 1}. ${s}`).join("\n") : "Nenhuma estratégia definida"}

## Equipe de Vendas
| Vendedor | Faturamento | Meta | Atingimento |
|----------|-------------|------|-------------|
${data.team.map(p => {
  const atingimento = p.goal > 0 ? ((p.revenue / p.goal) * 100).toFixed(1) : 0;
  return `| ${p.name} | ${formatCurrency(p.revenue)} | ${formatCurrency(p.goal)} | ${atingimento}% |`;
}).join("\n")}

## Análise Geral
O time possui ${data.team.length} vendedores ativos.
Faturamento total da equipe: ${formatCurrency(data.team.reduce((sum, p) => sum + p.revenue, 0))}
Meta total da equipe: ${formatCurrency(data.team.reduce((sum, p) => sum + p.goal, 0))}
`;

  return content;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, rmrData } = await req.json();

    // Get user's NotebookLM credentials from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("notebooklm_gcp_project_id, notebooklm_gcp_location, notebooklm_service_account_json")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to get user profile");
    }

    if (!profile.notebooklm_gcp_project_id || !profile.notebooklm_service_account_json) {
      throw new Error("NotebookLM not configured. Please add your Google Cloud credentials in Settings.");
    }

    const credentials: NotebookLMCredentials = {
      projectId: profile.notebooklm_gcp_project_id,
      location: profile.notebooklm_gcp_location || "us-central1",
      serviceAccountJson: profile.notebooklm_service_account_json,
    };

    // Get access token
    const accessToken = await getAccessToken(credentials.serviceAccountJson);

    if (action === "validate") {
      // Just validate credentials by getting token
      return new Response(
        JSON.stringify({ success: true, message: "Credentials validated successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "generate") {
      if (!rmrData) {
        throw new Error("Missing RMR data");
      }

      const data = rmrData as RMRData;
      const content = formatRMRContent(data);
      const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      // Discovery Engine API endpoint for NotebookLM Enterprise
      const baseUrl = `https://discoveryengine.googleapis.com/v1alpha`;
      const parent = `projects/${credentials.projectId}/locations/${credentials.location}`;

      // Step 1: Create a Notebook
      console.log("Creating notebook...");
      const createNotebookResponse = await fetch(
        `${baseUrl}/${parent}/notebooks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: `RMR - ${monthNames[data.month - 1]} ${data.year}`,
          }),
        }
      );

      if (!createNotebookResponse.ok) {
        const errorText = await createNotebookResponse.text();
        console.error("Create notebook error:", errorText);
        
        // Check if it's a quota or permission error
        if (createNotebookResponse.status === 403) {
          throw new Error("Permissão negada. Verifique se a API Discovery Engine está habilitada e se o Service Account tem as permissões corretas.");
        }
        if (createNotebookResponse.status === 429) {
          throw new Error("Limite de requisições atingido. Tente novamente em alguns minutos.");
        }
        
        throw new Error(`Failed to create notebook: ${errorText}`);
      }

      const notebook = await createNotebookResponse.json();
      const notebookId = notebook.name?.split("/").pop() || notebook.name;
      console.log("Notebook created:", notebookId);

      // Step 2: Add source content
      console.log("Adding source content...");
      const addSourceResponse = await fetch(
        `${baseUrl}/${notebook.name}/sources`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inlineContent: {
              content: content,
              mimeType: "text/markdown",
            },
            displayName: `Dados RMR ${monthNames[data.month - 1]} ${data.year}`,
          }),
        }
      );

      if (!addSourceResponse.ok) {
        const errorText = await addSourceResponse.text();
        console.error("Add source error:", errorText);
        throw new Error(`Failed to add source: ${errorText}`);
      }

      console.log("Source added successfully");

      // Step 3: Generate Audio Overview
      console.log("Generating audio overview...");
      const generateAudioResponse = await fetch(
        `${baseUrl}/${notebook.name}:generateAudioOverview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            languageCode: "pt-BR",
            voiceConfig: {
              // Use natural voices if available
              audioEncoding: "MP3",
            },
          }),
        }
      );

      let audioUrl = null;
      if (generateAudioResponse.ok) {
        const audioResult = await generateAudioResponse.json();
        console.log("Audio generation started:", audioResult);
        
        // The response might be an operation that needs polling
        if (audioResult.name && audioResult.done === false) {
          // Poll for completion (max 5 minutes)
          const operationName = audioResult.name;
          let attempts = 0;
          const maxAttempts = 60;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            const statusResponse = await fetch(
              `${baseUrl}/${operationName}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            
            if (statusResponse.ok) {
              const status = await statusResponse.json();
              if (status.done) {
                if (status.response?.audioUri) {
                  audioUrl = status.response.audioUri;
                } else if (status.response?.audio?.uri) {
                  audioUrl = status.response.audio.uri;
                }
                break;
              }
            }
            attempts++;
          }
        } else if (audioResult.audioUri || audioResult.audio?.uri) {
          audioUrl = audioResult.audioUri || audioResult.audio?.uri;
        }
      } else {
        console.warn("Audio generation not available or failed, continuing without audio");
      }

      // Step 4: Generate Briefing Document
      console.log("Generating briefing document...");
      let briefingContent = null;
      const generateBriefingResponse = await fetch(
        `${baseUrl}/${notebook.name}:generateBriefingDocument`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (generateBriefingResponse.ok) {
        const briefingResult = await generateBriefingResponse.json();
        briefingContent = briefingResult.content || briefingResult.document?.content;
      } else {
        console.warn("Briefing generation not available, continuing without briefing");
      }

      // Step 5: Generate FAQ
      console.log("Generating FAQ...");
      let faqItems = null;
      const generateFaqResponse = await fetch(
        `${baseUrl}/${notebook.name}:generateFaq`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maxQuestions: 10,
          }),
        }
      );

      if (generateFaqResponse.ok) {
        const faqResult = await generateFaqResponse.json();
        faqItems = faqResult.questions || faqResult.faq?.questions;
      } else {
        console.warn("FAQ generation not available, continuing without FAQ");
      }

      // Update RMR with results
      const { error: updateError } = await supabase
        .from("rmr_meetings")
        .update({
          notebooklm_notebook_id: notebookId,
          notebooklm_audio_url: audioUrl,
          notebooklm_briefing_url: briefingContent ? `data:text/plain;base64,${btoa(briefingContent)}` : null,
          notebooklm_faq_json: faqItems,
          notebooklm_generated_at: new Date().toISOString(),
        })
        .eq("id", data.rmrId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update RMR:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          notebookId,
          audioUrl,
          hasBriefing: !!briefingContent,
          hasFaq: !!faqItems,
          faqCount: faqItems?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    console.error("NotebookLM bridge error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: errorMessage === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
