import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PolicyTier {
  minPercent: number;
  maxPercent: number | null;
  reward: string;
  description: string;
}

export interface PremiumPolicy {
  id: string;
  user_id: string;
  name: string;
  tiers: PolicyTier[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyInput {
  name: string;
  tiers: PolicyTier[];
  is_active?: boolean;
}

export const usePremiumPolicy = () => {
  const queryClient = useQueryClient();

  // Fetch active premium policy for current user
  const { data: policy, isLoading } = useQuery({
    queryKey: ["premium-policy"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("premium_policies")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching premium policy:", error);
        return null;
      }

      if (!data) return null;

      // Parse tiers from JSONB
      return {
        ...data,
        tiers: (data.tiers as unknown as PolicyTier[]) || [],
      } as PremiumPolicy;
    },
  });

  // Upsert policy mutation
  const upsertPolicyMutation = useMutation({
    mutationFn: async (input: CreatePolicyInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // First, deactivate existing policies if this one is active
      if (input.is_active !== false) {
        await supabase
          .from("premium_policies")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }

      // Check if user already has a policy
      const { data: existing } = await supabase
        .from("premium_policies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const tiersJson = JSON.parse(JSON.stringify(input.tiers));

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("premium_policies")
          .update({
            name: input.name,
            tiers: tiersJson,
            is_active: input.is_active ?? true,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("premium_policies")
          .insert({
            user_id: user.id,
            name: input.name,
            tiers: tiersJson,
            is_active: input.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium-policy"] });
      toast.success("Política de premiação salva!");
    },
    onError: (error) => {
      console.error("Error saving premium policy:", error);
      toast.error("Erro ao salvar política de premiação");
    },
  });

  // Default tiers to use when no policy exists
  const defaultTiers: PolicyTier[] = [
    { minPercent: 100, maxPercent: null, reward: "Premiação Integral", description: "+ Bônus por superação" },
    { minPercent: 80, maxPercent: 99, reward: "Premiação Proporcional", description: "Baseada no % atingido" },
    { minPercent: 0, maxPercent: 79, reward: "Sem Premiação", description: "Foco em melhoria" },
  ];

  return {
    policy,
    isLoading,
    tiers: policy?.tiers || defaultTiers,
    upsertPolicy: upsertPolicyMutation.mutate,
    isUpdating: upsertPolicyMutation.isPending,
  };
};
