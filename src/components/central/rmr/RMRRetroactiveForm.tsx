import { useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Star, Sparkles, Target, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Salesperson } from "@/types";
import { useRMR, CreateRMRInput } from "@/hooks/useRMR";

interface RMRRetroactiveFormProps {
  team: Salesperson[];
  previousMonthRevenue: number;
  previousMonthGoal: number;
  onClose: () => void;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const SUGGESTED_THEMES = [
  "Superar limites: o impossível é apenas questão de tempo",
  "Juntos somos mais fortes: a força do time",
  "Cada venda é uma conquista: celebre cada passo",
  "Foco no cliente: entender para atender",
  "Resiliência: transformar desafios em oportunidades",
];

const RMRRetroactiveForm = ({ 
  team, 
  previousMonthRevenue, 
  previousMonthGoal, 
  onClose 
}: RMRRetroactiveFormProps) => {
  const currentDate = new Date();
  const previousMonth = currentDate.getMonth(); // 0-indexed, Janeiro = 0
  const previousYear = previousMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
  const defaultMonth = previousMonth === 0 ? 12 : previousMonth;

  const [formData, setFormData] = useState({
    month: defaultMonth,
    year: previousYear,
    highlightedEmployeeId: "",
    highlightedEmployeeName: "",
    highlightReason: "",
    motivationalTheme: "",
    monthlyGoal: previousMonthGoal,
    previousRevenue: previousMonthRevenue,
    strategies: [] as string[],
    notes: "",
  });
  const [newStrategy, setNewStrategy] = useState("");

  const { createRMR, isCreating } = useRMR();
  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      setFormData({
        ...formData,
        strategies: [...formData.strategies, newStrategy.trim()],
      });
      setNewStrategy("");
    }
  };

  const handleRemoveStrategy = (index: number) => {
    setFormData({
      ...formData,
      strategies: formData.strategies.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    const input: CreateRMRInput = {
      date: new Date(formData.year, formData.month - 1, 1).toISOString().split('T')[0],
      month: formData.month,
      year: formData.year,
      monthly_goal: formData.monthlyGoal,
      previous_month_revenue: formData.previousRevenue,
      motivational_theme: formData.motivationalTheme,
      strategies: formData.strategies,
      notes: formData.notes,
      highlighted_employee_id: formData.highlightedEmployeeId,
      highlighted_employee_name: formData.highlightedEmployeeName,
      highlight_reason: formData.highlightReason,
      status: 'completed',
    };

    createRMR(input, {
      onSuccess: () => onClose(),
    });
  };

  // Generate year options (current year and 2 previous)
  const yearOptions = [
    currentDate.getFullYear(),
    currentDate.getFullYear() - 1,
    currentDate.getFullYear() - 2,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Registrar RMR Anterior
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Registre os dados de uma RMR que já aconteceu para manter o histórico completo
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Month/Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês da Reunião</Label>
              <Select
                value={String(formData.month)}
                onValueChange={(value) => setFormData({ ...formData, month: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={String(formData.year)}
                onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Revenue and Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faturamento do Mês</Label>
              <Input
                type="number"
                value={formData.previousRevenue}
                onChange={(e) => setFormData({ ...formData, previousRevenue: Number(e.target.value) })}
                placeholder="Ex: 150000"
              />
              <p className="text-xs text-muted-foreground">
                Valor realizado: {formatCurrency(formData.previousRevenue)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Meta Definida</Label>
              <Input
                type="number"
                value={formData.monthlyGoal}
                onChange={(e) => setFormData({ ...formData, monthlyGoal: Number(e.target.value) })}
                placeholder="Ex: 200000"
              />
              <p className="text-xs text-muted-foreground">
                Meta: {formatCurrency(formData.monthlyGoal)}
              </p>
            </div>
          </div>

          {/* Highlighted Employee */}
          <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <Label className="font-semibold">Colaborador Destaque</Label>
            </div>
            <Select
              value={formData.highlightedEmployeeId}
              onValueChange={(value) => {
                const person = activeTeam.find(p => String(p.id) === value);
                setFormData({
                  ...formData,
                  highlightedEmployeeId: value,
                  highlightedEmployeeName: person?.name || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um colaborador..." />
              </SelectTrigger>
              <SelectContent>
                {activeTeam.map((person) => (
                  <SelectItem key={String(person.id)} value={String(person.id)}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{person.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(person.totalRevenue)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Motivo do reconhecimento..."
              value={formData.highlightReason}
              onChange={(e) => setFormData({ ...formData, highlightReason: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {/* Motivational Theme */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <Label className="font-semibold">Tema Motivacional</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_THEMES.map((theme, idx) => (
                <Badge
                  key={idx}
                  variant={formData.motivationalTheme === theme ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFormData({ ...formData, motivationalTheme: theme })}
                >
                  {theme.substring(0, 30)}...
                </Badge>
              ))}
            </div>
            <Textarea
              placeholder="Ou escreva seu próprio tema..."
              value={formData.motivationalTheme}
              onChange={(e) => setFormData({ ...formData, motivationalTheme: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {/* Strategies */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              <Label className="font-semibold">Estratégias Definidas</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar estratégia..."
                value={newStrategy}
                onChange={(e) => setNewStrategy(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStrategy()}
              />
              <Button variant="outline" onClick={handleAddStrategy}>
                Adicionar
              </Button>
            </div>
            {formData.strategies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.strategies.map((strategy, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveStrategy(idx)}
                  >
                    {strategy} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Label className="font-semibold">Observações</Label>
            </div>
            <Textarea
              placeholder="Anotações gerais sobre a reunião..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            onClick={handleSave}
            disabled={isCreating}
          >
            <Save className="h-4 w-4" />
            {isCreating ? "Salvando..." : "Registrar RMR"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default RMRRetroactiveForm;
