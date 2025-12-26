import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardData, ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const generateContextualResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const { kpis, currentYearData, team } = data;
    
    const progress = (kpis.annualRealized / kpis.annualGoal) * 100;
    const completedMonths = currentYearData.filter((m) => m.revenue > 0).length;
    const remainingMonths = 12 - completedMonths;
    const remaining = kpis.annualGoal - kpis.annualRealized;
    const monthlyNeeded = remainingMonths > 0 ? remaining / remainingMonths : 0;

    // Meta/Objetivo related
    if (lowerMessage.includes("meta") || lowerMessage.includes("objetivo") || lowerMessage.includes("goal")) {
      return `📊 **Análise da Meta Anual:**\n\n• Meta: ${formatCurrency(kpis.annualGoal)}\n• Realizado: ${formatCurrency(kpis.annualRealized)} (${progress.toFixed(1)}%)\n• Faltam: ${formatCurrency(remaining)}\n• Para atingir a meta, você precisa faturar **${formatCurrency(monthlyNeeded)}** por mês nos próximos ${remainingMonths} meses.\n\n${progress >= (completedMonths / 12) * 100 ? "✅ Você está no ritmo para atingir a meta!" : "⚠️ Atenção: você está abaixo do ritmo ideal."}`;
    }

    // Performance/Desempenho
    if (lowerMessage.includes("desempenho") || lowerMessage.includes("performance") || lowerMessage.includes("como está")) {
      const ltvCacRatio = kpis.cac > 0 ? kpis.ltv / kpis.cac : 0;
      return `📈 **Resumo do Desempenho:**\n\n• Crescimento vs ano anterior: ${kpis.lastYearGrowth > 0 ? "+" : ""}${kpis.lastYearGrowth}%\n• Taxa de conversão: ${kpis.conversionRate}%\n• Ticket médio: ${formatCurrency(kpis.averageTicket)}\n• Clientes ativos: ${kpis.activeCustomers}\n• Relação LTV/CAC: ${ltvCacRatio.toFixed(1)}x\n\n${kpis.lastYearGrowth > 0 ? "🎉 Parabéns pelo crescimento!" : "💡 Dica: Foque em estratégias de retenção e upsell."}`;
    }

    // Equipe/Team
    if (lowerMessage.includes("equipe") || lowerMessage.includes("time") || lowerMessage.includes("vendedor")) {
      const activeTeam = team.filter((m) => m.active && !m.isPlaceholder);
      if (activeTeam.length === 0) {
        return "👥 Você ainda não tem membros cadastrados na equipe. Adicione vendedores para acompanhar o desempenho individual.";
      }
      const totalRevenue = activeTeam.reduce((sum, m) => sum + m.totalRevenue, 0);
      const topPerformer = activeTeam.reduce((prev, curr) => 
        curr.totalRevenue > prev.totalRevenue ? curr : prev
      );
      return `👥 **Análise da Equipe:**\n\n• Vendedores ativos: ${activeTeam.length}\n• Faturamento total: ${formatCurrency(totalRevenue)}\n• Top performer: **${topPerformer.name}** com ${formatCurrency(topPerformer.totalRevenue)}\n\n💡 Dica: Identifique as práticas do top performer e compartilhe com a equipe.`;
    }

    // Ticket/Vendas
    if (lowerMessage.includes("ticket") || lowerMessage.includes("venda") || lowerMessage.includes("vendas")) {
      return `🎫 **Análise de Vendas:**\n\n• Total de vendas: ${kpis.totalSalesCount}\n• Ticket médio: ${formatCurrency(kpis.averageTicket)}\n• Taxa de conversão: ${kpis.conversionRate}%\n\n💡 Dica: Para aumentar o ticket médio, considere:\n- Cross-selling de produtos complementares\n- Pacotes ou bundles\n- Upgrades para versões premium`;
    }

    // CAC/LTV
    if (lowerMessage.includes("cac") || lowerMessage.includes("ltv") || lowerMessage.includes("custo")) {
      const ltvCacRatio = kpis.cac > 0 ? kpis.ltv / kpis.cac : 0;
      return `💰 **Métricas de Aquisição:**\n\n• CAC (Custo de Aquisição): ${formatCurrency(kpis.cac)}\n• LTV (Valor do Cliente): ${formatCurrency(kpis.ltv)}\n• Relação LTV/CAC: ${ltvCacRatio.toFixed(1)}x\n\n${ltvCacRatio >= 3 ? "✅ Excelente! Sua relação LTV/CAC está saudável." : ltvCacRatio >= 2 ? "⚠️ Boa relação, mas há espaço para melhoria." : "🚨 Atenção: Revise seus custos de aquisição."}`;
    }

    // Dica/Sugestão
    if (lowerMessage.includes("dica") || lowerMessage.includes("sugestão") || lowerMessage.includes("ajuda") || lowerMessage.includes("melhorar")) {
      const suggestions = [];
      if (kpis.conversionRate < 30) {
        suggestions.push("• Melhore o processo de qualificação de leads");
      }
      if (kpis.averageTicket < 1000) {
        suggestions.push("• Implemente estratégias de upselling");
      }
      if (progress < (completedMonths / 12) * 100) {
        suggestions.push("• Intensifique as ações de prospecção");
      }
      if (team.filter((m) => m.active).length > 0) {
        suggestions.push("• Faça reuniões semanais de alinhamento com a equipe");
      }
      
      return `💡 **Sugestões Personalizadas:**\n\n${suggestions.length > 0 ? suggestions.join("\n") : "• Continue acompanhando suas métricas regularmente\n• Mantenha o foco nas atividades que geram resultado\n• Celebre as pequenas vitórias com sua equipe"}\n\n🎯 Lembre-se: Consistência é a chave do sucesso em vendas!`;
    }

    // Default response
    return `Entendi sua pergunta! 🤔\n\nPosso ajudar com informações sobre:\n• **Metas** - análise de progresso e projeções\n• **Desempenho** - métricas e indicadores\n• **Equipe** - performance dos vendedores\n• **Vendas** - ticket médio e conversão\n• **Custos** - CAC e LTV\n• **Dicas** - sugestões de melhoria\n\nSobre o que você gostaria de saber mais?`;
  };

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

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateContextualResponse(userMessage.text);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "model",
      text: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
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
                  <p className="text-xs text-muted-foreground">Sempre online</p>
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
