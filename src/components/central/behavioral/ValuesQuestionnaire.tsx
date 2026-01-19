import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Heart, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { VALUES_QUESTIONS, VALUES_LABELS, type ValuesResponse, type ValuesScores } from '@/types/behavioral';

interface ValuesQuestionnaireProps {
  onComplete: (responses: ValuesResponse[]) => void;
  onCancel: () => void;
  salespersonName?: string;
}

export function ValuesQuestionnaire({ onComplete, onCancel, salespersonName }: ValuesQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ValuesResponse[]>([]);
  const [currentRanking, setCurrentRanking] = useState<(keyof ValuesScores)[]>([]);
  
  const currentQuestion = VALUES_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / VALUES_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === VALUES_QUESTIONS.length - 1;
  
  const handleOptionClick = (optionId: keyof ValuesScores) => {
    setCurrentRanking(prev => {
      // Se já está no ranking, remove
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      }
      // Adiciona no final
      if (prev.length < 4) {
        return [...prev, optionId];
      }
      return prev;
    });
  };
  
  const canProceed = currentRanking.length === 4;
  
  const handleNext = () => {
    if (!canProceed) return;
    
    const response: ValuesResponse = {
      questionId: currentQuestion.id,
      ranking: currentRanking,
    };
    
    const newResponses = [...responses];
    newResponses[currentQuestionIndex] = response;
    setResponses(newResponses);
    
    if (isLastQuestion) {
      onComplete(newResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Limpar ranking para próxima pergunta
      const nextResponse = newResponses[currentQuestionIndex + 1];
      if (nextResponse) {
        setCurrentRanking(nextResponse.ranking);
      } else {
        setCurrentRanking([]);
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex === 0) {
      onCancel();
      return;
    }
    
    // Salvar resposta atual se válida
    if (canProceed) {
      const response: ValuesResponse = {
        questionId: currentQuestion.id,
        ranking: currentRanking,
      };
      const newResponses = [...responses];
      newResponses[currentQuestionIndex] = response;
      setResponses(newResponses);
    }
    
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    // Carregar resposta anterior
    const prevResponse = responses[currentQuestionIndex - 1];
    if (prevResponse) {
      setCurrentRanking(prevResponse.ranking);
    } else {
      setCurrentRanking([]);
    }
  };
  
  const getRankPosition = (optionId: keyof ValuesScores) => {
    const index = currentRanking.indexOf(optionId);
    return index === -1 ? null : index + 1;
  };
  
  const getRankLabel = (position: number) => {
    switch (position) {
      case 1: return '1º - Mais importante';
      case 2: return '2º';
      case 3: return '3º';
      case 4: return '4º - Menos importante';
      default: return '';
    }
  };
  
  const getRankColor = (position: number | null) => {
    if (position === null) return '';
    switch (position) {
      case 1: return 'ring-2 ring-green-500 bg-green-500/10';
      case 2: return 'ring-2 ring-blue-500 bg-blue-500/10';
      case 3: return 'ring-2 ring-yellow-500 bg-yellow-500/10';
      case 4: return 'ring-2 ring-red-500 bg-red-500/10';
      default: return '';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Heart className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Questionário de Motivadores</h2>
        </div>
        {salespersonName && (
          <p className="text-muted-foreground">
            Perfil de: <span className="font-medium text-foreground">{salespersonName}</span>
          </p>
        )}
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Pergunta {currentQuestionIndex + 1} de {VALUES_QUESTIONS.length}</span>
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
                Clique nas opções na ordem de importância para você.
                <br />
                <span className="text-green-600">1º clique</span> = Mais importante → 
                <span className="text-red-600"> 4º clique</span> = Menos importante
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-medium text-center">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const position = getRankPosition(option.id);
              const valueInfo = VALUES_LABELS[option.id];
              
              return (
                <Card 
                  key={option.id} 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    getRankColor(position)
                  )}
                  onClick={() => handleOptionClick(option.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-all",
                        position === null 
                          ? "bg-muted text-muted-foreground" 
                          : position === 1 
                            ? "bg-green-500 text-white"
                            : position === 2
                              ? "bg-blue-500 text-white"
                              : position === 3
                                ? "bg-yellow-500 text-white"
                                : "bg-red-500 text-white"
                      )}>
                        {position ?? '?'}
                      </div>
                      
                      {/* Option Text */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{option.text}</p>
                        {position && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getRankLabel(position)}
                          </p>
                        )}
                      </div>
                      
                      {/* Value Badge */}
                      <div 
                        className="px-2 py-1 rounded text-xs font-medium shrink-0"
                        style={{ backgroundColor: `${valueInfo.color}20`, color: valueInfo.color }}
                      >
                        {valueInfo.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Current Ranking Summary */}
          {currentRanking.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Sua ordem:</span>
              <div className="flex gap-1">
                {currentRanking.map((id, index) => (
                  <span 
                    key={id}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: `${VALUES_LABELS[id].color}20`, 
                      color: VALUES_LABELS[id].color 
                    }}
                  >
                    {index + 1}º {VALUES_LABELS[id].name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentQuestionIndex === 0 ? 'Cancelar' : 'Anterior'}
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!canProceed}
          className={cn(isLastQuestion && "bg-primary")}
        >
          {isLastQuestion ? (
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
