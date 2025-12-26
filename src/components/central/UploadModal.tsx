import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadConfig } from "@/types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (data: any, config: UploadConfig) => void;
  onFileProcess: (file: File, config: UploadConfig) => Promise<{ success: boolean; data?: any; error?: string }>;
  isProcessing: boolean;
}

interface PreviewData {
  fileName: string;
  sheetsFound: string[];
  rowCount: number;
  data: any;
}

const monthOptions = [
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

const currentYear = new Date().getFullYear();
const yearOptions = [
  currentYear - 3,
  currentYear - 2,
  currentYear - 1,
  currentYear,
  currentYear + 1,
];

const UploadModal = ({ isOpen, onClose, onUploadSuccess, onFileProcess, isProcessing }: UploadModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  
  // Configurações de upload
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [replaceAllData, setReplaceAllData] = useState(false);
  const [step, setStep] = useState<"config" | "upload" | "preview">("config");

  const acceptedFormats = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setUploadStatus("idle");
    setIsDragging(false);
    setStep("config");
    setReplaceAllData(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024;

    if (!acceptedFormats.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Formato não suportado. Use arquivos .xlsx, .xls ou .csv");
      return false;
    }

    if (file.size > maxSize) {
      setError("Arquivo muito grande. O limite é 5MB.");
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    setUploadStatus("processing");

    try {
      const config: UploadConfig = {
        selectedMonth,
        selectedYear,
        replaceAllData,
      };

      const result = await onFileProcess(file, config);
      
      if (result.success && result.data) {
        setPreview({
          fileName: file.name,
          sheetsFound: result.data.sheetsFound || [],
          rowCount: result.data.rowCount || 0,
          data: result.data,
        });
        setUploadStatus("idle");
        setStep("preview");
      } else {
        setError(result.error || "Erro ao processar arquivo");
        setUploadStatus("error");
      }
    } catch (err) {
      setError("Erro ao processar arquivo");
      setUploadStatus("error");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [selectedMonth, selectedYear, replaceAllData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!preview?.data) return;

    setUploadStatus("processing");

    try {
      const config: UploadConfig = {
        selectedMonth,
        selectedYear,
        replaceAllData,
      };
      
      onUploadSuccess(preview.data, config);
      setUploadStatus("success");
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao salvar dados");
      setUploadStatus("error");
    }
  };

  const handleProceedToUpload = () => {
    setStep("upload");
  };

  const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const selectedTabPreview = `${monthAbbr[selectedMonth - 1]}-${String(selectedYear).slice(-2)}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload de Planilha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Configuração */}
          {step === "config" && (
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">Período de Corte</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione o mês de referência. Os dados serão importados até este período.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month-select">Mês</Label>
                    <Select
                      value={String(selectedMonth)}
                      onValueChange={(v) => setSelectedMonth(parseInt(v))}
                    >
                      <SelectTrigger id="month-select">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year-select">Ano</Label>
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                      <SelectTrigger id="year-select">
                        <SelectValue placeholder="Selecione o ano" />
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

                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Aba de referência:</span>{" "}
                    <span className="text-primary font-mono">{selectedTabPreview}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                <Checkbox
                  id="replace-data"
                  checked={replaceAllData}
                  onCheckedChange={(checked) => setReplaceAllData(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="replace-data" className="font-medium cursor-pointer">
                    Substituir todos os dados anteriores
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Se desmarcado, os novos dados serão mesclados com os existentes.
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={handleProceedToUpload}>
                Continuar para Upload
              </Button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && !preview && uploadStatus !== "success" && (
            <>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Período: <strong>{monthOptions[selectedMonth - 1].label}/{selectedYear}</strong>
                  {replaceAllData && <span className="text-destructive ml-2">(substituir dados)</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => setStep("config")}
                >
                  Alterar
                </Button>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  isProcessing && "pointer-events-none opacity-50"
                )}
                onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />

                {isProcessing || uploadStatus === "processing" ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Processando arquivo...</p>
                  </div>
                ) : (
                  <>
                    <Upload className={cn(
                      "h-12 w-12 mx-auto mb-4 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                    <p className="text-foreground font-medium mb-1">
                      Arraste sua planilha aqui
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: .xlsx, .xls, .csv (máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={() => {
                  setError(null);
                  setSelectedFile(null);
                  setUploadStatus("idle");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Preview */}
          {step === "preview" && preview && uploadStatus !== "success" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Período: <strong>{monthOptions[selectedMonth - 1].label}/{selectedYear}</strong>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{preview.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.sheetsFound.length} aba(s) • {preview.rowCount} registros
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setStep("upload");
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview.data?.team?.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Equipe detectada ({preview.data.team.length} vendedores):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.data.team.slice(0, 6).map((member: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                      >
                        {member.name}
                      </span>
                    ))}
                    {preview.data.team.length > 6 && (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                        +{preview.data.team.length - 6} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              {preview.data?.yearsAvailable?.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Anos disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.data.yearsAvailable.map((year: number) => (
                      <span
                        key={year}
                        className="px-2 py-1 text-xs bg-secondary/50 text-secondary-foreground rounded"
                      >
                        {year}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {replaceAllData && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    ⚠️ Todos os dados anteriores serão substituídos
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setStep("upload");
                  }}
                  disabled={isProcessing || uploadStatus === "processing"}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmUpload}
                  disabled={isProcessing || uploadStatus === "processing"}
                >
                  {uploadStatus === "processing" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar Upload"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === "success" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-foreground">Upload concluído!</p>
              <p className="text-sm text-muted-foreground">
                Os dados foram importados com sucesso.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
