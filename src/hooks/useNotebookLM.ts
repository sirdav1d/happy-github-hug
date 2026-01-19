import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotebookLMConfig {
  projectId: string | null;
  location: string;
  hasServiceAccount: boolean;
  connectedAt: string | null;
}

export interface NotebookLMArtifacts {
  notebookId: string | null;
  audioUrl: string | null;
  briefingUrl: string | null;
  faqJson: Array<{ question: string; answer: string }> | null;
  generatedAt: string | null;
}

interface RMRDataForNotebookLM {
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

interface UseNotebookLMReturn {
  config: NotebookLMConfig | null;
  isLoading: boolean;
  isConfigured: boolean;
  isGenerating: boolean;
  generationProgress: string | null;
  saveCredentials: (projectId: string, location: string, serviceAccountJson: string) => Promise<boolean>;
  validateCredentials: () => Promise<{ valid: boolean; message: string }>;
  disconnectNotebookLM: () => Promise<boolean>;
  generatePremiumKit: (rmrData: RMRDataForNotebookLM) => Promise<{
    success: boolean;
    audioUrl?: string;
    hasBriefing?: boolean;
    hasFaq?: boolean;
  }>;
  refreshConfig: () => Promise<void>;
}

export function useNotebookLM(): UseNotebookLMReturn {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<NotebookLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user?.id) {
      setConfig(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notebooklm_gcp_project_id, notebooklm_gcp_location, notebooklm_service_account_json, notebooklm_connected_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setConfig({
        projectId: data?.notebooklm_gcp_project_id || null,
        location: data?.notebooklm_gcp_location || 'us-central1',
        hasServiceAccount: !!data?.notebooklm_service_account_json,
        connectedAt: data?.notebooklm_connected_at || null,
      });
    } catch (error) {
      console.error('Error fetching NotebookLM config:', error);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveCredentials = useCallback(async (
    projectId: string,
    location: string,
    serviceAccountJson: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Validate JSON format
      try {
        const parsed = JSON.parse(serviceAccountJson);
        if (!parsed.client_email || !parsed.private_key) {
          toast({
            title: "JSON inválido",
            description: "O Service Account JSON deve conter 'client_email' e 'private_key'",
            variant: "destructive",
          });
          return false;
        }
      } catch {
        toast({
          title: "JSON inválido",
          description: "O formato do Service Account JSON está incorreto",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          notebooklm_gcp_project_id: projectId,
          notebooklm_gcp_location: location,
          notebooklm_service_account_json: serviceAccountJson,
          notebooklm_connected_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchConfig();
      await refreshProfile();

      toast({
        title: "NotebookLM conectado!",
        description: "Suas credenciais do Google Cloud foram salvas.",
      });

      return true;
    } catch (error) {
      console.error('Error saving NotebookLM credentials:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as credenciais.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, fetchConfig, refreshProfile, toast]);

  const validateCredentials = useCallback(async (): Promise<{ valid: boolean; message: string }> => {
    if (!user?.id) {
      return { valid: false, message: "Usuário não autenticado" };
    }

    try {
      const { data, error } = await supabase.functions.invoke('notebooklm-bridge', {
        body: { action: 'validate' },
      });

      if (error) throw error;

      if (data?.success) {
        return { valid: true, message: "Credenciais válidas!" };
      } else {
        return { valid: false, message: data?.error || "Credenciais inválidas" };
      }
    } catch (error: any) {
      console.error('Error validating credentials:', error);
      return { 
        valid: false, 
        message: error?.message || "Erro ao validar credenciais" 
      };
    }
  }, [user?.id]);

  const disconnectNotebookLM = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notebooklm_gcp_project_id: null,
          notebooklm_gcp_location: 'us-central1',
          notebooklm_service_account_json: null,
          notebooklm_connected_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchConfig();
      await refreshProfile();

      toast({
        title: "NotebookLM desconectado",
        description: "Suas credenciais foram removidas.",
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting NotebookLM:', error);
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível remover as credenciais.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, fetchConfig, refreshProfile, toast]);

  const generatePremiumKit = useCallback(async (rmrData: RMRDataForNotebookLM): Promise<{
    success: boolean;
    audioUrl?: string;
    hasBriefing?: boolean;
    hasFaq?: boolean;
  }> => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar o Kit Premium.",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsGenerating(true);
    setGenerationProgress("Iniciando geração do Kit Premium...");

    try {
      setGenerationProgress("Criando notebook no NotebookLM...");
      
      const { data, error } = await supabase.functions.invoke('notebooklm-bridge', {
        body: { 
          action: 'generate',
          rmrData,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Falha ao gerar Kit Premium");
      }

      setGenerationProgress("Kit Premium gerado com sucesso!");

      toast({
        title: "Kit Premium gerado! 🎉",
        description: `Podcast ${data.audioUrl ? "disponível" : "em processamento"}. ${data.hasFaq ? `${data.faqCount} FAQs criadas.` : ""}`,
      });

      return {
        success: true,
        audioUrl: data.audioUrl,
        hasBriefing: data.hasBriefing,
        hasFaq: data.hasFaq,
      };
    } catch (error: any) {
      console.error('Error generating premium kit:', error);
      
      toast({
        title: "Erro na geração",
        description: error?.message || "Não foi possível gerar o Kit Premium.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [user?.id, toast]);

  const isConfigured = !!(config?.projectId && config?.hasServiceAccount);

  return {
    config,
    isLoading,
    isConfigured,
    isGenerating,
    generationProgress,
    saveCredentials,
    validateCredentials,
    disconnectNotebookLM,
    generatePremiumKit,
    refreshConfig: fetchConfig,
  };
}
