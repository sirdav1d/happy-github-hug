import { motion } from 'framer-motion';
import { Users, AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSalespeopleMigration } from '@/hooks/useSalespeopleMigration';

interface MigrationBannerProps {
  onComplete?: () => void;
  className?: string;
}

export function SalespeopleMigrationBanner({ onComplete, className }: MigrationBannerProps) {
  const { isMigrating, runMigration, migrationStatus, refreshMigrationStatus } = useSalespeopleMigration();

  const handleMigrate = async () => {
    const result = await runMigration();
    if (result.migrated > 0) {
      onComplete?.();
    }
  };

  // Don't show if loading or no migration needed
  if (migrationStatus.isLoading) {
    return null;
  }

  if (!migrationStatus.needsMigration) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">
          Migração de Vendedores Pendente
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            Encontramos <strong>{migrationStatus.pendingCount}</strong> vendedor(es) no formato antigo 
            que precisam ser migrados para o novo sistema de gestão de metas.
          </p>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Migrar Agora
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                {migrationStatus.migratedCount} migrado(s)
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                {migrationStatus.pendingCount} pendente(s)
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// Compact version for sidebars or headers
export function MigrationStatusBadge() {
  const { migrationStatus } = useSalespeopleMigration();

  if (migrationStatus.isLoading || !migrationStatus.needsMigration) {
    return null;
  }

  return (
    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 animate-pulse">
      <Users className="h-3 w-3 mr-1" />
      {migrationStatus.pendingCount} para migrar
    </Badge>
  );
}
