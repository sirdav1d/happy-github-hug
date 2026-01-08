import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  maxStudents: number;
  priceMonthly: number;
  features: string[];
  isActive: boolean;
}

interface UseSubscriptionPlanReturn {
  currentPlan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  studentCount: number;
  canAddStudent: boolean;
  remainingSlots: number;
  isLoading: boolean;
  checkLimit: () => Promise<{ allowed: boolean; message?: string }>;
}

export default function useSubscriptionPlan(): UseSubscriptionPlanReturn {
  const { user, userProfile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Fetch all active plans
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('max_students', { ascending: true });

      if (plansError) throw plansError;

      const formattedPlans: SubscriptionPlan[] = (plans || []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        maxStudents: p.max_students,
        priceMonthly: Number(p.price_monthly),
        features: (p.features as string[]) || [],
        isActive: p.is_active,
      }));

      setAllPlans(formattedPlans);

      // Get user's current plan from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan_id, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Find current plan or default to Starter
      if (profile?.plan_id) {
        const plan = formattedPlans.find(p => p.id === profile.plan_id);
        setCurrentPlan(plan || formattedPlans[0] || null);
      } else {
        // Default to Starter plan
        const starterPlan = formattedPlans.find(p => p.slug === 'starter');
        setCurrentPlan(starterPlan || formattedPlans[0] || null);
      }

      // Count current students (invites created by this user)
      const { count, error: countError } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      if (countError) throw countError;

      setStudentCount(count || 0);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canAddStudent = currentPlan 
    ? studentCount < currentPlan.maxStudents 
    : false;

  const remainingSlots = currentPlan 
    ? Math.max(0, currentPlan.maxStudents - studentCount) 
    : 0;

  const checkLimit = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!currentPlan) {
      return { allowed: false, message: 'Plano não encontrado' };
    }

    if (studentCount >= currentPlan.maxStudents) {
      return { 
        allowed: false, 
        message: `Você atingiu o limite de ${currentPlan.maxStudents} alunos do plano ${currentPlan.name}. Faça upgrade para adicionar mais.` 
      };
    }

    return { allowed: true };
  }, [currentPlan, studentCount]);

  return {
    currentPlan,
    allPlans,
    studentCount,
    canAddStudent,
    remainingSlots,
    isLoading,
    checkLimit,
  };
}
