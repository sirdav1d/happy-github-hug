import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSalespeople, CreateSalespersonInput } from './useSalespeople';
import { useGoalRules } from './useGoalRules';
import { toast } from 'sonner';
import { Salesperson as LegacySalesperson } from '@/types';

interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

interface MigrationStatus {
  totalLegacy: number;
  migratedCount: number;
  pendingCount: number;
  needsMigration: boolean;
  isLoading: boolean;
}

export function useSalespeopleMigration() {
  const { user } = useAuth();
  const { salespeople, createSalesperson, isLoading: isSalespeopleLoading } = useSalespeople();
  const { goalRules, createGoalRule, ensureDefaultRule } = useGoalRules();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    totalLegacy: 0,
    migratedCount: 0,
    pendingCount: 0,
    needsMigration: false,
    isLoading: true,
  });

  // Check if migration is needed by looking at legacy team data
  const checkMigrationNeeded = useCallback(async (): Promise<LegacySalesperson[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('team')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking migration:', error);
        return [];
      }

      const legacyTeam = (data?.team as unknown as LegacySalesperson[]) || [];
      return legacyTeam.filter(t => !t.isPlaceholder && t.active);
    } catch (error) {
      console.error('Error checking migration:', error);
      return [];
    }
  }, [user?.id]);

  // Get legacy salespeople that haven't been migrated yet
  const getUnmigratedSalespeople = useCallback(async (): Promise<LegacySalesperson[]> => {
    const legacyTeam = await checkMigrationNeeded();
    
    // Filter out those already migrated (by legacy_id or name match)
    return legacyTeam.filter(legacy => {
      const alreadyMigrated = salespeople.some(
        s => s.legacy_id === legacy.id || s.name.toLowerCase() === legacy.name.toLowerCase()
      );
      return !alreadyMigrated;
    });
  }, [checkMigrationNeeded, salespeople]);

  // Migrate a single salesperson
  const migrateSalesperson = async (legacy: LegacySalesperson): Promise<boolean> => {
    try {
      // Ensure default goal rule exists
      if (goalRules.length === 0) {
        await ensureDefaultRule();
      }

      const defaultRule = goalRules.find(r => r.is_default);

      const input: CreateSalespersonInput = {
        name: legacy.name,
        legacy_id: legacy.id,
        hire_date: new Date().toISOString().split('T')[0], // Default to today if unknown
        status: legacy.active ? 'active' : 'inactive',
        avatar_url: legacy.avatar || undefined,
        goal_rule_id: defaultRule?.id,
        goal_override_value: legacy.monthlyGoal > 0 ? legacy.monthlyGoal : undefined,
      };

      await createSalesperson(input);
      return true;
    } catch (error) {
      console.error(`Error migrating ${legacy.name}:`, error);
      return false;
    }
  };

  // Run full migration
  const runMigration = async (): Promise<MigrationResult> => {
    if (!user?.id) {
      return { migrated: 0, skipped: 0, errors: ['Usuário não autenticado'] };
    }

    setIsMigrating(true);
    const result: MigrationResult = { migrated: 0, skipped: 0, errors: [] };

    try {
      // Ensure default goal rule exists first
      if (goalRules.length === 0) {
        await ensureDefaultRule();
      }

      const unmigratedList = await getUnmigratedSalespeople();

      if (unmigratedList.length === 0) {
        toast.info('Nenhum vendedor para migrar');
        return result;
      }

      for (const legacy of unmigratedList) {
        const success = await migrateSalesperson(legacy);
        if (success) {
          result.migrated++;
        } else {
          result.errors.push(`Falha ao migrar: ${legacy.name}`);
        }
      }

      setMigrationResult(result);

      if (result.migrated > 0) {
        toast.success(`${result.migrated} vendedor(es) migrado(s) com sucesso!`);
      }

      // Refresh status
      await refreshMigrationStatus();

      return result;
    } catch (error) {
      console.error('Migration error:', error);
      result.errors.push('Erro geral na migração');
      return result;
    } finally {
      setIsMigrating(false);
    }
  };

  // Refresh migration status
  const refreshMigrationStatus = useCallback(async () => {
    if (!user?.id || isSalespeopleLoading) return;

    setMigrationStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const legacyTeam = await checkMigrationNeeded();
      
      // Filter out those already migrated
      const unmigrated = legacyTeam.filter(legacy => {
        const alreadyMigrated = salespeople.some(
          s => s.legacy_id === legacy.id || s.name.toLowerCase() === legacy.name.toLowerCase()
        );
        return !alreadyMigrated;
      });

      setMigrationStatus({
        totalLegacy: legacyTeam.length,
        migratedCount: salespeople.length,
        pendingCount: unmigrated.length,
        needsMigration: unmigrated.length > 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error refreshing migration status:', error);
      setMigrationStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id, isSalespeopleLoading, checkMigrationNeeded, salespeople]);

  // Auto-refresh status when salespeople or user changes
  useEffect(() => {
    if (user?.id && !isSalespeopleLoading) {
      refreshMigrationStatus();
    }
  }, [user?.id, isSalespeopleLoading, salespeople.length, refreshMigrationStatus]);

  return {
    isMigrating,
    migrationResult,
    migrationStatus,
    runMigration,
    refreshMigrationStatus,
    getUnmigratedSalespeople,
    checkMigrationNeeded,
  };
}
