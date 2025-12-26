import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  onFileProcess: (file: File) => Promise<{ success: boolean; data?: any; error?: string }>;
  isProcessing: boolean;
}

interface PreviewData {
  fileName: string;
  sheetsFound: string[];
  rowCount: number;
  data: any;
}

const UploadModal = ({ isOpen, onClose, onUploadSuccess, onFileProcess, isProcessing }: UploadModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const acceptedFormats = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setUploadStatus("idle");
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB

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
      const result = await onFileProcess(file);
      
      if (result.success && result.data) {
        setPreview({
          fileName: file.name,
          sheetsFound: result.data.sheetsFound || [],
          rowCount: result.data.rowCount || 0,
          data: result.data,
        });
        setUploadStatus("idle");
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
  }, []);

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
      // The data is already processed, just trigger the success callback
      onUploadSuccess();
      setUploadStatus("success");
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao salvar dados");
      setUploadStatus("error");
    }
  };

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
          {/* Drag and Drop Zone */}
          {!preview && uploadStatus !== "success" && (
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

              {isProcessing ? (
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
          {preview && uploadStatus !== "success" && (
            <div className="space-y-3">
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
                  onClick={resetState}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview.sheetsFound.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Abas encontradas:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.sheetsFound.map((sheet, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                      >
                        {sheet}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmUpload}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
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
