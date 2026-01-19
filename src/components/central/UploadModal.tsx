import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Calendar, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadConfig } from "@/types";
import { generateEmptyTemplate, generateNormalizedSpreadsheet, downloadBlob, analyzeProcessedData, DataAnalysis } from "@/lib/templateGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Configurações de upload
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [replaceAllData, setReplaceAllData] = useState(false);
  const [step, setStep] = useState<"config" | "upload" | "preview">("config");

  // Análise dos dados processados
  const dataAnalysis = useMemo<DataAnalysis | null>(() => {
    if (!preview?.data) return null;
    return analyzeProcessedData({
      historicalData: preview.data.historicalData,
      currentYearData: preview.data.currentYearData,
      team: preview.data.team,
      kpis: preview.data.kpis,
      yearsAvailable: preview.data.yearsAvailable,
      selectedMonth: preview.data.selectedMonth,
    });
  }, [preview?.data]);

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
    setDetailsOpen(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const blob = generateEmptyTemplate();
    downloadBlob(blob, "template_historico.xlsx");
  };

  const handleDownloadNormalized = () => {
    if (!preview?.data) return;
    const blob = generateNormalizedSpreadsheet({
      historicalData: preview.data.historicalData,
      currentYearData: preview.data.currentYearData,
      team: preview.data.team,
      kpis: preview.data.kpis,
      yearsAvailable: preview.data.yearsAvailable,
      selectedMonth: preview.data.selectedMonth,
    });
    const monthName = monthOptions[selectedMonth - 1]?.label || "";
    downloadBlob(blob, `dados_normalizados_${monthName}_${selectedYear}.xlsx`);
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
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload de Planilha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Step 1: Configuração */}
          {step === "config" && (
            <div className="space-y-6">
              {/* Botão de Download do Template */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">Precisa de um modelo?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Baixe nossa planilha modelo com a estrutura correta para facilitar a importação.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Baixar Template
                    </Button>
                  </div>
                </div>
              </div>

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
                      <SelectContent className="max-h-60 overflow-y-auto">
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

              {/* Análise detalhada dos dados */}
              {dataAnalysis && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground">Dados detectados por ano:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dataAnalysis.yearsWithData.map(({ year, months, totalRevenue }) => (
                      <div 
                        key={year} 
                        className={cn(
                          "p-2 rounded border",
                          months === 12 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-amber-500/10 border-amber-500/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={cn(
                            "h-3.5 w-3.5",
                            months === 12 ? "text-green-500" : "text-amber-500"
                          )} />
                          <span className="font-medium text-sm">{year}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {months} {months === 1 ? "mês" : "meses"} • R$ {(totalRevenue / 1000).toFixed(0)}k
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Warnings */}
                  {dataAnalysis.warnings.length > 0 && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                      <p className="text-xs font-medium text-amber-600 mb-1">⚠️ Avisos:</p>
                      {dataAnalysis.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-amber-600/80">• {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {preview.data?.team?.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
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

                  {/* Alerta de nomes duplicados */}
                  {dataAnalysis?.potentialDuplicateNames && dataAnalysis.potentialDuplicateNames.length > 0 && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded mt-2">
                      <p className="text-xs font-medium text-amber-600 mb-1">
                        ⚠️ Possíveis nomes duplicados:
                      </p>
                      {dataAnalysis.potentialDuplicateNames.slice(0, 3).map((dup, idx) => (
                        <p key={idx} className="text-xs text-amber-600/80">
                          • "{dup.name1}" ↔ "{dup.name2}"
                        </p>
                      ))}
                      {dataAnalysis.potentialDuplicateNames.length > 3 && (
                        <p className="text-xs text-amber-600/80">
                          e mais {dataAnalysis.potentialDuplicateNames.length - 3}...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Semanas detectadas */}
                  {dataAnalysis?.weeksDetectedPerMonth && dataAnalysis.weeksDetectedPerMonth.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Semanas com dados:</span>
                      {dataAnalysis.weeksDetectedPerMonth.map((w, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-primary/10 rounded">
                          {w.month}/{w.year}: {w.weeks} semanas
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Destaque: Baixar dados normalizados - FORA do collapsible */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Conferir dados antes de importar?</p>
                    <p className="text-xs text-muted-foreground">Baixe a planilha normalizada para revisar ou ajustar</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0"
                    onClick={handleDownloadNormalized}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar
                  </Button>
                </div>
              </div>

              {/* Collapsible com detalhes técnicos */}
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs">Ver detalhes técnicos</span>
                    {detailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de meses com dados:</span>
                      <span className="font-medium">{dataAnalysis?.totalMonthsWithData || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendedores ativos:</span>
                      <span className="font-medium">{dataAnalysis?.activeTeamCount || 0} de {dataAnalysis?.teamCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Abas encontradas:</span>
                      <span className="font-medium">{preview.sheetsFound.slice(0, 3).join(", ")}{preview.sheetsFound.length > 3 ? "..." : ""}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
