import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, User, Building, Palette, Bell, Shield, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardData, AppSettings } from "@/types";

interface SettingsViewProps {
  data: DashboardData;
  onSaveSettings?: (settings: AppSettings) => void;
}

const SettingsView = ({ data, onSaveSettings }: SettingsViewProps) => {
  const { user, userProfile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AppSettings>(
    data.appSettings || { aggressiveMode: false, considerVacation: false }
  );
  const [companyName, setCompanyName] = useState(data.companyName);
  const [segment, setSegment] = useState(data.businessSegment);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveSettings) {
        await onSaveSettings(settings);
      }
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const segments = [
    "Varejo",
    "Atacado",
    "E-commerce",
    "Serviços",
    "Indústria",
    "Tecnologia",
    "Saúde",
    "Educação",
    "Alimentação",
    "Outro",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-3 rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências e configurações da central
          </p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Perfil</CardTitle>
            </div>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Conta</Label>
                <Input
                  id="role"
                  value={userProfile?.role === "consultant" ? "Consultor" : "Empresário"}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Company Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Empresa</CardTitle>
            </div>
            <CardDescription>Informações do seu negócio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((seg) => (
                      <SelectItem key={seg} value={seg}>
                        {seg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Preferências</CardTitle>
            </div>
            <CardDescription>Personalize o comportamento da central</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="aggressive-mode">Modo Agressivo</Label>
                <p className="text-sm text-muted-foreground">
                  Metas mais desafiadoras e alertas mais frequentes
                </p>
              </div>
              <Switch
                id="aggressive-mode"
                checked={settings.aggressiveMode}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, aggressiveMode: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vacation-mode">Considerar Férias</Label>
                <p className="text-sm text-muted-foreground">
                  Ajusta cálculos considerando períodos de férias da equipe
                </p>
              </div>
              <Switch
                id="vacation-mode"
                checked={settings.considerVacation}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, considerVacation: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button
          variant="destructive"
          onClick={signOut}
          className="flex-1 sm:flex-none"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SettingsView;
