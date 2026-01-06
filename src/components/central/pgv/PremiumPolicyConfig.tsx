import { useState } from "react";
import { Plus, Trash2, Save, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PolicyTier } from "@/hooks/usePremiumPolicy";

interface PremiumPolicyConfigProps {
  tiers: PolicyTier[];
  onSave: (tiers: PolicyTier[]) => void;
  isLoading?: boolean;
}

const PremiumPolicyConfig = ({ tiers, onSave, isLoading }: PremiumPolicyConfigProps) => {
  const [open, setOpen] = useState(false);
  const [editableTiers, setEditableTiers] = useState<PolicyTier[]>(tiers);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setEditableTiers([...tiers]);
    }
    setOpen(isOpen);
  };

  const addTier = () => {
    setEditableTiers([
      ...editableTiers,
      { minPercent: 0, maxPercent: null, reward: "", description: "" },
    ]);
  };

  const removeTier = (index: number) => {
    setEditableTiers(editableTiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof PolicyTier, value: string | number | null) => {
    const updated = [...editableTiers];
    updated[index] = { ...updated[index], [field]: value };
    setEditableTiers(updated);
  };

  const handleSave = () => {
    // Sort tiers by minPercent descending
    const sorted = [...editableTiers].sort((a, b) => b.minPercent - a.minPercent);
    onSave(sorted);
    setOpen(false);
  };

  const getTierColor = (minPercent: number) => {
    if (minPercent >= 100) return "border-emerald-500/30 bg-emerald-500/5";
    if (minPercent >= 80) return "border-amber-500/30 bg-amber-500/5";
    return "border-muted bg-muted/20";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Award className="h-4 w-4" />
          Configurar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-500" />
            Configurar Política de Premiação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Configure as faixas de premiação para sua equipe. Cada faixa define uma recompensa 
            baseada no percentual de atingimento da meta.
          </p>

          <div className="space-y-3">
            {editableTiers.map((tier, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getTierColor(tier.minPercent)} space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Faixa {index + 1}
                  </span>
                  {editableTiers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTier(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">% Mínimo</Label>
                    <Input
                      type="number"
                      value={tier.minPercent}
                      onChange={(e) => updateTier(index, "minPercent", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">% Máximo (vazio = sem limite)</Label>
                    <Input
                      type="number"
                      value={tier.maxPercent ?? ""}
                      onChange={(e) => updateTier(index, "maxPercent", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Sem limite"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Recompensa</Label>
                  <Input
                    value={tier.reward}
                    onChange={(e) => updateTier(index, "reward", e.target.value)}
                    placeholder="Ex: Comissão de 5% + Bônus R$500"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Descrição adicional</Label>
                  <Input
                    value={tier.description}
                    onChange={(e) => updateTier(index, "description", e.target.value)}
                    placeholder="Ex: Superação total da meta"
                    className="h-9"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addTier}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Adicionar Faixa
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Política
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPolicyConfig;
