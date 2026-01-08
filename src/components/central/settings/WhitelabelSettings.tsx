import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, RotateCcw, Check, Sparkles, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useWhitelabel, { COLOR_PRESETS } from '@/hooks/useWhitelabel';

interface WhitelabelSettingsProps {
  onSave?: () => void;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function WhitelabelSettings({ onSave }: WhitelabelSettingsProps) {
  const { toast } = useToast();
  const { settings, isLoading, saveSettings, resetToDefaults, uploadLogo, removeLogo } = useWhitelabel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [systemName, setSystemName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customPrimary, setCustomPrimary] = useState('');
  const [customAccent, setCustomAccent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (settings) {
      setSystemName(settings.systemName);
      setCustomPrimary(settings.primaryColor);
      setCustomAccent(settings.accentColor);
      
      // Find matching preset
      const presetIndex = COLOR_PRESETS.findIndex(
        p => p.primary === settings.primaryColor && p.accent === settings.accentColor
      );
      setSelectedPreset(presetIndex >= 0 ? presetIndex : null);
    }
  }, [settings]);

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    const preset = COLOR_PRESETS[index];
    setCustomPrimary(preset.primary);
    setCustomAccent(preset.accent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preset = selectedPreset !== null ? COLOR_PRESETS[selectedPreset] : null;
      
      const success = await saveSettings({
        systemName,
        primaryColor: customPrimary,
        accentColor: customAccent,
        sidebarColor: preset?.sidebar || settings?.sidebarColor,
      });

      if (success) {
        toast({
          title: 'Personalização salva!',
          description: 'As cores e nome do sistema foram atualizados.',
        });
        onSave?.();
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const success = await resetToDefaults();
      if (success) {
        setSelectedPreset(0);
        setSystemName('Central Inteligente');
        setCustomPrimary(COLOR_PRESETS[0].primary);
        setCustomAccent(COLOR_PRESETS[0].accent);
        toast({
          title: 'Configurações restauradas',
          description: 'As cores padrão foram aplicadas.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Tipo inválido',
        description: 'Use PNG, JPG, SVG ou WEBP.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const url = await uploadLogo(file);
      if (url) {
        toast({ title: 'Logo atualizada!', description: 'Sua logomarca foi carregada com sucesso.' });
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      toast({ title: 'Erro no upload', description: 'Não foi possível carregar a imagem.', variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsUploadingLogo(true);
    try {
      const success = await removeLogo();
      if (success) {
        toast({ title: 'Logo removida', description: 'O ícone padrão será exibido.' });
      }
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Preview color conversion (HSL to hex for display)
  const hslToPreviewStyle = (hsl: string) => {
    return { backgroundColor: `hsl(${hsl})` };
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">White-label</CardTitle>
          </div>
          <CardDescription>
            Personalize o nome e as cores do sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logomarca</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-16 h-16 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              {/* Upload area */}
              <div className="flex-1">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  {isUploadingLogo ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arraste ou clique para enviar
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        PNG, JPG, SVG ou WEBP • Máx 2MB
                      </p>
                    </>
                  )}
                </div>

                {settings?.logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                    className="mt-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* System Name */}
          <div className="space-y-2">
            <Label htmlFor="systemName">Nome do Sistema</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Central Inteligente"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá no título da página e no logo
            </p>
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label>Tema de Cores</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(index)}
                  className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPreset === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={hslToPreviewStyle(preset.primary)}
                    />
                    <div
                      className="w-5 h-5 rounded-full"
                      style={hslToPreviewStyle(preset.accent)}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                  
                  {selectedPreset === index && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={hslToPreviewStyle(customPrimary)}
                >
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: `hsl(${customPrimary})` }}>
                    {systemName || 'Central Inteligente'}
                  </p>
                  <p className="text-xs text-muted-foreground">Mentorship Intelligence</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
                  style={hslToPreviewStyle(customPrimary)}
                >
                  Botão Primário
                </div>
                <div
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(${customAccent} / 0.2)`,
                    color: `hsl(${customAccent})`,
                  }}
                >
                  Botão Secundário
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Salvando...' : 'Salvar Personalização'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
