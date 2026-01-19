import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Brain, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DISC_QUESTION_BLOCKS, DISC_LABELS, type DISCResponse, type DISCQuestionBlock } from '@/types/behavioral';

interface DISCQuestionnaireProps {
  onComplete: (responses: DISCResponse[]) => void;
  onCancel: () => void;
  salespersonName?: string;
}

export function DISCQuestionnaire({ onComplete, onCancel, salespersonName }: DISCQuestionnaireProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [responses, setResponses] = useState<DISCResponse[]>([]);
  const [currentMost, setCurrentMost] = useState<'d' | 'i' | 's' | 'c' | null>(null);
  const [currentLeast, setCurrentLeast] = useState<'d' | 'i' | 's' | 'c' | null>(null);
  
  const currentBlock = DISC_QUESTION_BLOCKS[currentBlockIndex];
  const progress = ((currentBlockIndex + 1) / DISC_QUESTION_BLOCKS.length) * 100;
  const isLastBlock = currentBlockIndex === DISC_QUESTION_BLOCKS.length - 1;
  
  const handleOptionClick = useCallback((optionId: 'd' | 'i' | 's' | 'c', type: 'most' | 'least') => {
    console.log('[DISC] Click:', { optionId, type, currentMost, currentLeast });
    
    if (type === 'most') {
      if (currentMost === optionId) {
        // Desmarcar se clicar no mesmo
        setCurrentMost(null);
      } else {
        setCurrentMost(optionId);
        // Se selecionou o mesmo que estava como MENOS, limpa o MENOS
        if (currentLeast === optionId) {
          setCurrentLeast(null);
        }
      }
    } else {
      if (currentLeast === optionId) {
        // Desmarcar se clicar no mesmo
        setCurrentLeast(null);
      } else {
        setCurrentLeast(optionId);
        // Se selecionou o mesmo que estava como MAIS, limpa o MAIS
        if (currentMost === optionId) {
          setCurrentMost(null);
        }
      }
    }
  }, [currentMost, currentLeast]);
  
  const canProceed = currentMost !== null && currentLeast !== null;
  
  const handleNext = useCallback(() => {
    if (!canProceed || !currentMost || !currentLeast) return;
    
    const response: DISCResponse = {
      blockId: currentBlock.id,
      most: currentMost,
      least: currentLeast,
    };
    
    const newResponses = [...responses];
    newResponses[currentBlockIndex] = response;
    setResponses(newResponses);
    
    if (isLastBlock) {
      onComplete(newResponses);
    } else {
      setCurrentBlockIndex(currentBlockIndex + 1);
      // Carregar resposta anterior se existir
      const nextResponse = newResponses[currentBlockIndex + 1];
      if (nextResponse) {
        setCurrentMost(nextResponse.most);
        setCurrentLeast(nextResponse.least);
      } else {
        setCurrentMost(null);
        setCurrentLeast(null);
      }
    }
  }, [canProceed, currentMost, currentLeast, currentBlock.id, responses, currentBlockIndex, isLastBlock, onComplete]);
  
  const handlePrevious = useCallback(() => {
    if (currentBlockIndex === 0) {
      onCancel();
      return;
    }
    
    // Salvar resposta atual se válida
    if (canProceed && currentMost && currentLeast) {
      const response: DISCResponse = {
        blockId: currentBlock.id,
        most: currentMost,
        least: currentLeast,
      };
      const newResponses = [...responses];
      newResponses[currentBlockIndex] = response;
      setResponses(newResponses);
    }
    
    setCurrentBlockIndex(currentBlockIndex - 1);
    // Carregar resposta anterior
    const prevResponse = responses[currentBlockIndex - 1];
    if (prevResponse) {
      setCurrentMost(prevResponse.most);
      setCurrentLeast(prevResponse.least);
    } else {
      setCurrentMost(null);
      setCurrentLeast(null);
    }
  }, [currentBlockIndex, canProceed, currentMost, currentLeast, currentBlock.id, responses, onCancel]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Questionário DISC</h2>
        </div>
        {salespersonName && (
          <p className="text-muted-foreground">
            Perfil de: <span className="font-medium text-foreground">{salespersonName}</span>
          </p>
        )}
      </div>

      {/* Warning - Approximation */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          <strong>Este questionário gera uma aproximação</strong> do perfil DISC com ~70-80% de precisão. 
          Para resultados oficiais, utilize o relatório Innermetrix.
        </AlertDescription>
      </Alert>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Bloco {currentBlockIndex + 1} de {DISC_QUESTION_BLOCKS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Instructions */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Como responder:</p>
              <p className="text-muted-foreground">
                Selecione a opção que <span className="text-green-600 font-medium">MAIS</span> te descreve 
                e a que <span className="text-red-600 font-medium">MENOS</span> te descreve.
                Você precisa marcar uma opção de cada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Question Block */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlock.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {currentBlock.options.map((option) => {
            const isMost = currentMost === option.id;
            const isLeast = currentLeast === option.id;
            
            return (
              <Card 
                key={option.id} 
                className={cn(
                  "transition-all duration-200",
                  isMost && "ring-2 ring-green-500 bg-green-500/10",
                  isLeast && "ring-2 ring-red-500 bg-red-500/10"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Option Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{option.text}</p>
                      {option.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                      )}
                    </div>
                    
                    {/* Selection Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="button"
                        variant={isMost ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isLeast) {
                            handleOptionClick(option.id, 'most');
                          }
                        }}
                        disabled={isLeast}
                        className={cn(
                          "min-w-[70px] transition-all",
                          isMost && "bg-green-600 hover:bg-green-700 text-white",
                          isLeast && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {isMost && <Check className="w-4 h-4 mr-1" />}
                        MAIS
                      </Button>
                      <Button
                        type="button"
                        variant={isLeast ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isMost) {
                            handleOptionClick(option.id, 'least');
                          }
                        }}
                        disabled={isMost}
                        className={cn(
                          "min-w-[70px] transition-all",
                          isLeast && "bg-red-600 hover:bg-red-700 text-white",
                          isMost && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {isLeast && <Check className="w-4 h-4 mr-1" />}
                        MENOS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selection Status */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
          currentMost ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"
        )}>
          {currentMost && <Check className="w-3.5 h-3.5" />}
          MAIS: {currentMost ? DISC_LABELS[currentMost].name : 'Não selecionado'}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
          currentLeast ? "bg-red-500/20 text-red-700" : "bg-muted text-muted-foreground"
        )}>
          {currentLeast && <Check className="w-3.5 h-3.5" />}
          MENOS: {currentLeast ? DISC_LABELS[currentLeast].name : 'Não selecionado'}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={handlePrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentBlockIndex === 0 ? 'Cancelar' : 'Anterior'}
        </Button>
        
        <Button 
          type="button"
          onClick={handleNext} 
          disabled={!canProceed}
          className={cn(isLastBlock && "bg-primary")}
        >
          {isLastBlock ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Finalizar
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
