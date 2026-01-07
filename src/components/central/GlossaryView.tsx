import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ChevronDown, Lightbulb, TrendingUp, Users, Target, DollarSign, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface GlossaryTerm {
  term: string;
  shortName?: string;
  definition: string;
  formula?: string;
  example?: string;
  category: 'metricas' | 'rituais' | 'vendas' | 'financeiro' | 'pipeline';
  relatedTerms?: string[];
}

const glossaryData: GlossaryTerm[] = [
  // Métricas
  {
    term: 'Ticket Médio',
    definition: 'Valor médio de cada venda realizada. Indica o quanto, em média, cada cliente gasta por compra.',
    formula: 'Receita Total ÷ Número de Vendas',
    example: 'Se você faturou R$ 100.000 com 50 vendas, seu Ticket Médio é R$ 2.000.',
    category: 'metricas',
    relatedTerms: ['LTV', 'Receita'],
  },
  {
    term: 'CAC',
    shortName: 'Custo de Aquisição de Cliente',
    definition: 'Quanto custa, em média, para conquistar um novo cliente. Inclui gastos com marketing, vendas e promoções.',
    formula: 'Investimento em Aquisição ÷ Novos Clientes',
    example: 'Se investiu R$ 10.000 em marketing e conquistou 20 clientes, seu CAC é R$ 500.',
    category: 'financeiro',
    relatedTerms: ['LTV', 'ROI'],
  },
  {
    term: 'LTV',
    shortName: 'Lifetime Value',
    definition: 'Valor total que um cliente gera durante todo seu relacionamento com a empresa. Quanto maior, melhor.',
    formula: 'Ticket Médio × Frequência de Compra × Tempo de Retenção',
    example: 'Cliente que compra R$ 500/mês por 2 anos tem LTV de R$ 12.000.',
    category: 'financeiro',
    relatedTerms: ['CAC', 'Ticket Médio'],
  },
  {
    term: 'Taxa de Conversão',
    definition: 'Percentual de oportunidades que se transformam em vendas efetivas.',
    formula: 'Vendas Realizadas ÷ Total de Oportunidades × 100',
    example: 'De 100 leads, 25 compraram = 25% de conversão.',
    category: 'metricas',
    relatedTerms: ['Pipeline', 'Funil de Vendas'],
  },
  {
    term: 'Run Rate',
    definition: 'Projeção anual baseada no ritmo atual de vendas. Útil para estimar se a meta será atingida.',
    formula: 'Receita Acumulada ÷ Meses Decorridos × 12',
    example: 'R$ 600.000 em 6 meses = Run Rate de R$ 1.200.000/ano.',
    category: 'metricas',
    relatedTerms: ['Meta Anual', 'Projeção'],
  },
  {
    term: 'Índice de Sazonalidade',
    definition: 'Mede quanto um mês varia da média histórica. Ajuda a entender padrões cíclicos do negócio.',
    formula: 'Receita do Mês ÷ Média Mensal Histórica',
    example: 'Índice 1.3 = mês 30% acima da média; 0.7 = 30% abaixo.',
    category: 'metricas',
    relatedTerms: ['Sazonalidade', 'Tendência'],
  },
  {
    term: 'Coeficiente de Variação',
    shortName: 'CV',
    definition: 'Mede a estabilidade das vendas. Quanto menor, mais previsível é o faturamento.',
    formula: 'Desvio Padrão ÷ Média × 100',
    example: 'CV de 15% indica vendas relativamente estáveis.',
    category: 'metricas',
  },
  // Rituais
  {
    term: 'RMR',
    shortName: 'Reunião de Metas e Reconhecimento',
    definition: 'Ritual mensal para definir metas, reconhecer destaques e alinhar estratégias da equipe comercial.',
    example: 'No 1º dia útil do mês, a equipe se reúne para celebrar resultados e definir os objetivos do período.',
    category: 'rituais',
    relatedTerms: ['PGV', 'FIV'],
  },
  {
    term: 'PGV',
    shortName: 'Painel de Gestão à Vista',
    definition: 'Ferramenta visual semanal que acompanha o progresso de cada vendedor em relação às metas.',
    example: 'Toda segunda-feira, o painel é atualizado mostrando meta diária, semanal e acumulado do mês.',
    category: 'rituais',
    relatedTerms: ['RMR', 'FIV', 'Meta Semanal'],
  },
  {
    term: 'FIV',
    shortName: 'Feedback Individual do Vendedor',
    definition: 'Sessão semanal de 15-20 minutos entre gestor e vendedor para acompanhamento personalizado.',
    example: 'O gestor pergunta: "O que funcionou?", "O que precisa melhorar?" e "Qual seu compromisso para a próxima semana?"',
    category: 'rituais',
    relatedTerms: ['RMR', 'PGV'],
  },
  {
    term: 'Política de Premiação',
    definition: 'Sistema de bonificação atrelado ao atingimento de metas, configurável por faixas de performance.',
    example: '80-99% da meta = bônus básico; 100-119% = bônus intermediário; 120%+ = bônus máximo.',
    category: 'rituais',
    relatedTerms: ['PGV', 'Meta'],
  },
  // Vendas
  {
    term: 'Lead',
    definition: 'Potencial cliente que demonstrou interesse no produto/serviço. Primeiro estágio do funil de vendas.',
    example: 'Pessoa que preencheu formulário no site ou deixou contato em uma feira.',
    category: 'vendas',
    relatedTerms: ['Pipeline', 'Qualificação'],
  },
  {
    term: 'Pipeline',
    definition: 'Representação visual de todas as oportunidades de venda em diferentes estágios de negociação.',
    example: 'Kanban com colunas: Prospecção → Abordagem → Apresentação → Negociação → Fechamento.',
    category: 'pipeline',
    relatedTerms: ['Lead', 'Funil de Vendas'],
  },
  {
    term: 'Funil de Vendas',
    definition: 'Jornada do cliente desde o primeiro contato até a compra. Cada etapa representa uma fase da negociação.',
    example: 'De 100 leads, 50 são abordados, 20 recebem proposta, 10 fecham = funil afunilando.',
    category: 'vendas',
    relatedTerms: ['Pipeline', 'Taxa de Conversão'],
  },
  {
    term: 'Qualificação',
    definition: 'Processo de avaliar se um lead tem potencial real de compra (orçamento, necessidade, autoridade, timing).',
    example: 'Lead qualificado: tem budget, decide a compra e precisa do produto nos próximos 30 dias.',
    category: 'vendas',
    relatedTerms: ['Lead', 'BANT'],
  },
  {
    term: 'Follow-up',
    definition: 'Acompanhamento sistemático de leads e clientes para manter o relacionamento e avançar negociações.',
    example: 'Ligar 3 dias após enviar proposta para esclarecer dúvidas.',
    category: 'vendas',
    relatedTerms: ['Pipeline', 'Negociação'],
  },
  {
    term: 'Venda Online',
    definition: 'Transações realizadas através de canais digitais (e-commerce, WhatsApp, redes sociais).',
    category: 'vendas',
    relatedTerms: ['Venda Presencial', 'Canal'],
  },
  {
    term: 'Venda Presencial',
    definition: 'Transações realizadas pessoalmente na loja física ou em visita ao cliente.',
    category: 'vendas',
    relatedTerms: ['Venda Online', 'Canal'],
  },
  // Financeiro
  {
    term: 'ROI',
    shortName: 'Return on Investment',
    definition: 'Retorno sobre o investimento. Mede quanto de lucro cada real investido gerou.',
    formula: '(Ganho - Investimento) ÷ Investimento × 100',
    example: 'Investiu R$ 1.000 e gerou R$ 1.500 = ROI de 50%.',
    category: 'financeiro',
    relatedTerms: ['CAC', 'LTV'],
  },
  {
    term: 'Receita Recorrente',
    definition: 'Faturamento previsível que se repete periodicamente (assinaturas, mensalidades).',
    example: 'SaaS com 100 clientes pagando R$ 99/mês = R$ 9.900 de receita recorrente mensal.',
    category: 'financeiro',
    relatedTerms: ['LTV', 'Churn'],
  },
  {
    term: 'Meta',
    definition: 'Objetivo quantificável a ser atingido em um período específico. Base para medir performance.',
    example: 'Meta mensal de R$ 200.000 dividida entre 4 vendedores = R$ 50.000 cada.',
    category: 'financeiro',
    relatedTerms: ['PGV', 'RMR'],
  },
  // Pipeline
  {
    term: 'Lead Quente',
    definition: 'Oportunidade com alta probabilidade de fechamento, geralmente em estágio avançado de negociação.',
    example: 'Cliente que solicitou proposta formal e está comparando com concorrentes.',
    category: 'pipeline',
    relatedTerms: ['Pipeline', 'Negociação'],
  },
  {
    term: 'Lead Parado',
    definition: 'Oportunidade sem movimentação há mais de 7 dias. Requer atenção para não esfriar.',
    example: 'Proposta enviada há 10 dias sem resposta do cliente.',
    category: 'pipeline',
    relatedTerms: ['Follow-up', 'Pipeline'],
  },
  {
    term: 'Valor Estimado',
    definition: 'Previsão do valor potencial de uma negociação, usado para priorizar oportunidades.',
    example: 'Lead com valor estimado de R$ 50.000 deve receber mais atenção que um de R$ 5.000.',
    category: 'pipeline',
    relatedTerms: ['Pipeline', 'Ticket Médio'],
  },
];

const categoryConfig = {
  metricas: { label: 'Métricas', icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  rituais: { label: 'Rituais', icon: Calendar, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  vendas: { label: 'Vendas', icon: Users, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  financeiro: { label: 'Financeiro', icon: DollarSign, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  pipeline: { label: 'Pipeline', icon: Filter, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
};

const GlossaryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return glossaryData.filter(term => {
      const matchesSearch = searchQuery === '' || 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || term.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach(term => {
      if (!groups[term.category]) {
        groups[term.category] = [];
      }
      groups[term.category].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const categories = Object.keys(categoryConfig) as (keyof typeof categoryConfig)[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Glossário</h1>
            <p className="text-sm text-muted-foreground">Dicionário de termos e métricas do sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>{glossaryData.length} termos disponíveis</span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar termo ou definição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map(cat => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              return (
                <Badge
                  key={cat}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    selectedCategory === cat ? config.color : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Terms List */}
      <div className="space-y-6">
        {Object.entries(groupedTerms).map(([category, terms]) => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          const Icon = config.icon;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-foreground">{config.label}</h2>
                <span className="text-xs text-muted-foreground">({terms.length})</span>
              </div>

              <div className="grid gap-3">
                <AnimatePresence>
                  {terms.map((term, idx) => (
                    <motion.div
                      key={term.term}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card 
                        className={`border-border/50 hover:border-primary/30 transition-all cursor-pointer ${
                          expandedTerm === term.term ? 'ring-1 ring-primary/20' : ''
                        }`}
                        onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground">{term.term}</h3>
                                {term.shortName && (
                                  <span className="text-xs text-muted-foreground">
                                    ({term.shortName})
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {term.definition}
                              </p>

                              <AnimatePresence>
                                {expandedTerm === term.term && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 pt-3 border-t border-border/50 mt-3"
                                  >
                                    {term.formula && (
                                      <div className="bg-muted/50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Fórmula</p>
                                        <code className="text-sm text-primary font-mono">{term.formula}</code>
                                      </div>
                                    )}
                                    {term.example && (
                                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Exemplo Prático</p>
                                        <p className="text-sm text-muted-foreground">{term.example}</p>
                                      </div>
                                    )}
                                    {term.relatedTerms && term.relatedTerms.length > 0 && (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-muted-foreground">Relacionados:</span>
                                        {term.relatedTerms.map(related => (
                                          <Badge 
                                            key={related} 
                                            variant="outline" 
                                            className="text-xs cursor-pointer hover:bg-muted"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSearchQuery(related);
                                              setExpandedTerm(null);
                                            }}
                                          >
                                            {related}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <ChevronDown 
                              className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                                expandedTerm === term.term ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {filteredTerms.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <Search className="w-8 h-8 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-foreground">Nenhum termo encontrado</p>
                  <p className="text-sm text-muted-foreground">Tente buscar por outra palavra</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default GlossaryView;
