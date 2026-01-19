import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
}

interface GammaSlideData {
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
  video?: {
    title: string;
    url: string;
  };
  team: TeamMember[];
  companyName?: string;
  rmrId: string;
}

interface GammaResult {
  success: boolean;
  generationId: string;
  gammaUrl: string;
  pptxUrl: string;
}

export function useGammaSlides() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");

  // Fetch user's Gamma API key from profile
  const { data: gammaApiKey, isLoading: isLoadingKey } = useQuery({
    queryKey: ["gamma-api-key", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("gamma_api_key")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("[Gamma] Error fetching API key:", error);
        return null;
      }
      
      return data?.gamma_api_key || null;
    },
    enabled: !!user?.id,
  });

  const hasGammaConfigured = !!gammaApiKey;

  // Save Gamma API key
  const saveApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ gamma_api_key: apiKey })
        .eq("id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamma-api-key", user?.id] });
      toast.success("API Key do Gamma salva com sucesso!");
    },
    onError: (error) => {
      console.error("[Gamma] Error saving API key:", error);
      toast.error("Erro ao salvar API Key");
    },
  });

  // Validate Gamma API key
  const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-gamma-key", {
        headers: {
          "x-gamma-api-key": apiKey,
        },
      });

      if (error) {
        console.error("[Gamma] Validation error:", error);
        return { valid: false, error: error.message };
      }

      return data as { valid: boolean; error?: string };
    } catch (error) {
      console.error("[Gamma] Validation exception:", error);
      return { valid: false, error: "Erro ao validar API Key" };
    }
  };

  // Generate slides using Gamma
  const generateGammaSlides = async (data: GammaSlideData): Promise<GammaResult | null> => {
    if (!gammaApiKey) {
      toast.error("Configure sua API Key do Gamma nas Configurações");
      return null;
    }

    setIsGenerating(true);
    setGenerationProgress("Enviando dados para o Gamma...");

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-gamma-slides", {
        headers: {
          "x-gamma-api-key": gammaApiKey,
        },
        body: {
          rmrData: {
            month: data.month,
            year: data.year,
            theme: data.theme,
            highlight: data.highlight,
            previousMonth: data.previousMonth,
            goal: data.goal,
            strategies: data.strategies,
            video: data.video,
            team: data.team,
            companyName: data.companyName,
          },
        },
      });

      if (error) {
        console.error("[Gamma] Generation error:", error);
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar apresentação");
      }

      setGenerationProgress("Apresentação gerada com sucesso!");

      // Update RMR with Gamma URLs
      const { error: updateError } = await supabase
        .from("rmr_meetings")
        .update({
          gamma_generation_id: result.generationId,
          gamma_url: result.gammaUrl,
          gamma_pptx_url: result.pptxUrl,
        })
        .eq("id", data.rmrId);

      if (updateError) {
        console.error("[Gamma] Error updating RMR:", updateError);
      }

      queryClient.invalidateQueries({ queryKey: ["rmr-meetings"] });

      toast.success("Apresentação Gamma gerada com sucesso!", {
        description: "Clique para abrir no Gamma ou baixar o PPTX",
      });

      return result as GammaResult;
    } catch (error) {
      console.error("[Gamma] Error:", error);
      toast.error("Erro ao gerar apresentação", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  // Remove Gamma API key
  const removeApiKey = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from("profiles")
      .update({ gamma_api_key: null })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao remover API Key");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["gamma-api-key", user?.id] });
    toast.success("API Key removida");
  };

  return {
    hasGammaConfigured,
    isLoadingKey,
    gammaApiKey,
    isGenerating,
    generationProgress,
    generateGammaSlides,
    validateApiKey,
    saveApiKey: saveApiKeyMutation.mutate,
    isSavingKey: saveApiKeyMutation.isPending,
    removeApiKey,
  };
}
