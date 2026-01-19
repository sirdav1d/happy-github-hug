import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, Brain, Sparkles, AlertCircle, RotateCcw, FileText, FileAudio, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DISCScores, ValuesScores } from '@/types/behavioral';

interface BehavioralConversationProps {
  salespersonId: string;
  salespersonName: string;
  onComplete: (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    aiSummary: string;
    transcription: string;
  }) => void;
  onCancel: () => void;
}

type ProcessingState = 'idle' | 'processing' | 'complete' | 'error';
type InputMethod = 'audio' | 'manual';

export function BehavioralConversation({ 
  salespersonId, 
  salespersonName, 
  onComplete, 
  onCancel 
}: BehavioralConversationProps) {
  const [inputMethod, setInputMethod] = useState<InputMethod>('audio');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [manualTranscription, setManualTranscription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    aiSummary: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/ogg'];
    const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1])) || 
                        file.name.match(/\.(mp3|wav|webm|m4a|ogg|mp4)$/i);
    
    if (!isValidType) {
      toast.error('Formato não suportado. Use MP3, WAV, WebM, M4A ou OGG.');
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 25MB.');
      return;
    }
    
    setSelectedFile(file);
    setErrorMessage('');
  };

  const processAudioFile = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo de áudio');
      return;
    }
    
    setProcessingState('processing');
    setErrorMessage('');
    
    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      const { data, error } = await supabase.functions.invoke('analyze-behavioral-audio', {
        body: {
          audioBase64: base64,
          mimeType: selectedFile.type || 'audio/mpeg',
          salespersonName,
          salespersonId,
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erro na análise');
      }
      
      setTranscription(data.transcription);
      setAnalysisResult({
        discScores: data.discScores,
        valuesScores: data.valuesScores,
        aiSummary: data.aiSummary,
      });
      
      setProcessingState('complete');
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar áudio');
      setProcessingState('error');
    }
  };

  const processManualTranscription = async () => {
    if (!manualTranscription.trim() || manualTranscription.length < 100) {
      toast.error('A transcrição deve ter pelo menos 100 caracteres');
      return;
    }
    
    setProcessingState('processing');
    setErrorMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-behavioral-audio', {
        body: {
          manualTranscription: manualTranscription.trim(),
          salespersonName,
          salespersonId,
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erro na análise');
      }
      
      setTranscription(data.transcription);
      setAnalysisResult({
        discScores: data.discScores,
        valuesScores: data.valuesScores,
        aiSummary: data.aiSummary,
      });
      
      setProcessingState('complete');
      
    } catch (error) {
      console.error('Error processing transcription:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar transcrição');
      setProcessingState('error');
    }
  };

  const handleConfirm = () => {
    if (analysisResult && transcription) {
      onComplete({
        ...analysisResult,
        transcription,
      });
    }
  };

  const reset = () => {
    setProcessingState('idle');
    setSelectedFile(null);
    setTranscription('');
    setManualTranscription('');
    setAnalysisResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Análise por Conversa</h2>
        </div>
        <p className="text-muted-foreground">
          Perfil de: <span className="font-medium text-foreground">{salespersonName}</span>
        </p>
      </div>

      {/* Method Selection */}
      {processingState === 'idle' && (
        <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as InputMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audio" className="gap-2">
              <FileAudio className="w-4 h-4" />
              Upload de Áudio
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="w-4 h-4" />
              Transcrição Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="mt-4">
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Como funciona:</p>
                    <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Faça upload de uma gravação de conversa com o vendedor</li>
                      <li>A IA transcreverá e analisará automaticamente</li>
                      <li>Formatos aceitos: MP3, WAV, M4A, WebM (máx. 25MB)</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Transcrição Manual:</p>
                    <p className="text-muted-foreground">
                      Cole ou digite a transcrição de uma conversa já realizada. 
                      A IA analisará o texto e extrairá o perfil comportamental.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Audio Upload Interface */}
      <AnimatePresence mode="wait">
        {processingState === 'idle' && inputMethod === 'audio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Badge variant="secondary">Clique para trocar</Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Clique para selecionar um arquivo de áudio</p>
                  <p className="text-xs text-muted-foreground">MP3, WAV, M4A, WebM • Máximo 25MB</p>
                </div>
              )}
            </div>
            
            {selectedFile && (
              <Button 
                onClick={processAudioFile}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analisar com IA
              </Button>
            )}
          </motion.div>
        )}

        {processingState === 'idle' && inputMethod === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Textarea
              placeholder="Cole aqui a transcrição da conversa com o vendedor. Quanto mais detalhada, melhor será a análise comportamental...

Exemplo de conteúdo útil:
- Como o vendedor descreve seu estilo de trabalho
- Como lida com objeções e desafios
- O que o motiva e frustra
- Como se relaciona com colegas e clientes"
              value={manualTranscription}
              onChange={(e) => setManualTranscription(e.target.value)}
              rows={12}
              className="text-sm"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{manualTranscription.length} caracteres</span>
              <span className={manualTranscription.length >= 100 ? 'text-emerald-500' : 'text-amber-500'}>
                Mínimo: 100 caracteres
              </span>
            </div>
            <Button 
              onClick={processManualTranscription}
              disabled={manualTranscription.length < 100}
              className="w-full"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analisar com IA
            </Button>
          </motion.div>
        )}

        {processingState === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary"
              />
              <Brain className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">Analisando conversa...</p>
              <p className="text-sm text-muted-foreground">
                Transcrevendo e identificando padrões comportamentais
              </p>
            </div>
          </motion.div>
        )}

        {processingState === 'complete' && analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
              <span className="text-lg font-medium">Análise Concluída!</span>
            </div>
            
            {/* DISC Preview */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Perfil DISC Identificado
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(analysisResult.discScores).map(([key, value]) => {
                    const label = {
                      d_natural: 'D',
                      i_natural: 'I',
                      s_natural: 'S',
                      c_natural: 'C',
                    }[key];
                    if (!label) return null;
                    const colors = {
                      D: 'bg-red-500',
                      I: 'bg-yellow-500',
                      S: 'bg-green-500',
                      C: 'bg-blue-500',
                    };
                    return (
                      <div key={key} className="text-center">
                        <div className={`w-12 h-12 mx-auto rounded-full ${colors[label]} text-white flex items-center justify-center text-lg font-bold`}>
                          {label}
                        </div>
                        <div className="mt-2 text-sm font-medium">{value}%</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* AI Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Resumo da IA
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {analysisResult.aiSummary}
                </p>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Análise
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvar Perfil
              </Button>
            </div>
          </motion.div>
        )}

        {processingState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || 'Ocorreu um erro durante a análise'}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Button */}
      {processingState === 'idle' && (
        <div className="pt-4 border-t">
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
