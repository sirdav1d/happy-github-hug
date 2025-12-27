import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardData, ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatAssistantProps {
  data: DashboardData;
}

const ChatAssistant = ({ data }: ChatAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      text: `Olá! 👋 Sou seu assistente de vendas da ${data.companyName}. Posso ajudar com análises de desempenho, insights sobre suas métricas e sugestões estratégicas. Como posso ajudar?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build context from dashboard data
  const dashboardContext = useMemo(() => {
    const validMonths = data.currentYearData.filter(d => d.revenue > 0);
    const currentMonth = validMonths.length > 0 ? validMonths[validMonths.length - 1] : { revenue: 0, goal: 0, month: 'Jan' };
    const selectedYear = data.currentYearData.length > 0 ? data.currentYearData[0].year : new Date().getFullYear();
    
    return {
      companyName: data.companyName,
      businessSegment: data.businessSegment,
      annualGoal: data.kpis.annualGoal,
      annualRealized: data.kpis.annualRealized,
      lastYearGrowth: data.kpis.lastYearGrowth,
      averageTicket: data.kpis.averageTicket,
      conversionRate: data.kpis.conversionRate,
      cac: data.kpis.cac,
      ltv: data.kpis.ltv,
      activeCustomers: data.kpis.activeCustomers,
      totalSalesCount: data.kpis.totalSalesCount,
      currentMonthRevenue: currentMonth.revenue,
      currentMonthGoal: currentMonth.goal,
      currentMonthName: currentMonth.month,
      selectedYear,
    };
  }, [data]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare messages for API (convert to expected format)
      const apiMessages = messages
        .filter(m => m.role !== "model" || m.id !== "1") // Exclude initial greeting
        .map(m => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text,
        }));
      
      // Add current user message
      apiMessages.push({
        role: "user",
        content: userMessage.text,
      });

      const { data: responseData, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          messages: apiMessages,
          context: dashboardContext,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.error) {
        if (responseData.error === 'rate_limit') {
          toast({
            title: "Limite atingido",
            description: responseData.message,
            variant: "destructive",
          });
        } else if (responseData.error === 'payment_required') {
          toast({
            title: "Créditos insuficientes",
            description: responseData.message,
            variant: "destructive",
          });
        }
        throw new Error(responseData.message);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseData.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "Desculpe, tive um problema ao processar sua pergunta. Por favor, tente novamente em alguns segundos. 🔄",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg",
          "bg-primary text-primary-foreground",
          "hover:shadow-xl transition-shadow",
          isOpen && "hidden"
        )}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[380px] h-[500px] max-h-[80vh]",
              "bg-card border border-border rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Assistente IA</h3>
                  <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[75%] p-3 rounded-2xl text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="bg-secondary p-3 rounded-2xl rounded-bl-md">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;
