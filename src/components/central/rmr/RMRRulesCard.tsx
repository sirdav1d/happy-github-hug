import { motion } from "framer-motion";
import { BookOpen, Clock, Target, Trophy, Play, Flag, Sparkles, CheckCircle, XCircle, Coffee, Camera, Users, FileSliders } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Estrutura baseada no documento oficial Mastersales
const BEFORE_MEETING = {
  duration: "15 min coffee + 45 min reunião",
  when: "Primeiro dia útil do mês, fora do horário comercial (1h antes do expediente)",
  resources: ["Coffee break", "Slides (modelo no drive)", "Troféu", "Painel de Gestão à Vista impresso"],
  purpose: "Analisar resultados do mês anterior, premiar colaboradores destaque e comunicar metas e estratégias do mês seguinte"
};

const SLIDES_STRUCTURE = [
  {
    id: "slide1",
    title: "Slide 1 - Resultado do Mês Anterior",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    content: "Gráfico ou tabela com resultados de cada vendedor e totalização da equipe",
    dos: [
      "Apresentar resultado individual e da equipe",
      "Usar gráfico visual para facilitar compreensão",
      "Deixar cada vendedor anunciar seu próprio resultado",
      "Começar SEMPRE pelo positivo antes de qualquer crítica",
      "Perguntar 'O que aprendemos?' em vez de 'Por que não bateu?'"
    ],
    donts: [
      "Usar tom de cobrança ou julgamento",
      "Expor ninguém negativamente na frente do grupo",
      "Comparar vendedores de forma humilhante"
    ],
    tip: "Vendedor que se sente respeitado mesmo quando erra, supera no próximo mês."
  },
  {
    id: "slide2",
    title: "Slide 2 - Vendedor Destaque",
    icon: Trophy,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    content: "Foto do colaborador + indicador de destaque (taxa de conversão, maior faturamento, ativação de novos clientes)",
    dos: [
      "Colocar foto do colaborador destaque",
      "Mostrar o indicador em que ele se destacou",
      "Tocar música de entrada para o destaque",
      "Contar a HISTÓRIA de como ele conseguiu",
      "Promover palmas de pé de toda a equipe",
      "Entregar troféu ou algo simbólico"
    ],
    donts: [
      "Tratar como rotina ou obrigação",
      "Premiar apenas números - valorize atitudes também",
      "Pular esta seção por falta de tempo"
    ],
    tip: "Todos devem sair da RMR querendo ser o próximo destaque!"
  },
  {
    id: "slide3",
    title: "Slide 3 - Tema Motivacional",
    icon: Play,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    content: "Vídeos, frases ou textos motivacionais (engajamento dura no máximo 15 dias)",
    dos: [
      "Escolher tema baseado em problemas observados nos feedbacks individuais",
      "Conectar o tema ao que você quer melhorar durante o mês",
      "Utilizar materiais da pasta do drive",
      "Promover reflexão em duplas após o vídeo (2 min)",
      "Perguntar: 'O que você leva para aplicar esta semana?'"
    ],
    donts: [
      "Passar vídeo sem introdução ou contexto",
      "Usar vídeos muito longos (máximo 5 minutos)",
      "Pular a reflexão pós-vídeo"
    ],
    tip: "O vídeo é apenas o gatilho - o valor está na reflexão e conexão!"
  },
  {
    id: "slide4",
    title: "Slide 4 - Metas e Estratégias",
    icon: Flag,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    content: "Meta geral, meta por vendedor, premiações e estratégias do mês",
    dos: [
      "Apresentar meta geral da equipe",
      "Definir meta individual por vendedor",
      "Comunicar premiações de acordo com meta atingida",
      "Definir estratégias: promoções, lançamentos, ativação de base, eventos, tráfego, indicações, networking",
      "Pedir compromisso público de cada vendedor",
      "Dividir meta total em metas semanais"
    ],
    donts: [
      "Definir metas vagas sem números claros",
      "Listar dezenas de estratégias genéricas",
      "Definir estratégias sem responsáveis"
    ],
    tip: "Meta sem compromisso público é apenas um desejo. Formalize!"
  }
];

const AFTER_MEETING = {
  action: "Colocar Painel de Gestão à Vista em local visível e de fácil acesso ao time de vendas",
  model: "Modelo disponível no drive"
};

const RMR_SECTIONS = [
  {
    id: "abertura",
    title: "1. Abertura",
    duration: "5 min",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    objective: "Criar ruptura com a rotina e elevar a energia do grupo",
    dos: [
      "Comece com música ambiente animada",
      "Promova palmas coletivas ou dinâmica quebra-gelo",
      "Fale de pé com energia contagiante",
      "Organize a sala em semicírculo"
    ],
    donts: [
      "Nunca comece com 'bom dia' seco e formal",
      "Evite entrar lendo papéis ou olhando celular",
      "Não comece sentado ou de costas para o time"
    ],
    tip: "A energia dos primeiros 60 segundos define o tom de toda a reunião!"
  },
  {
    id: "resultados",
    title: "2. Resultados do Mês",
    duration: "10 min",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    objective: "Apresentar números com foco em aprendizado, não cobrança",
    dos: [
      "Comece SEMPRE pelo positivo antes de qualquer crítica",
      "Deixe cada vendedor anunciar seu próprio resultado",
      "Use gráficos visuais para mostrar evolução",
      "Pergunte 'O que aprendemos?' em vez de 'Por que não bateu?'"
    ],
    donts: [
      "Evite tom de cobrança ou julgamento",
      "Não exponha ninguém negativamente na frente do grupo",
      "Não compare vendedores de forma humilhante"
    ],
    tip: "Vendedor que se sente respeitado mesmo quando erra, supera no próximo mês."
  },
  {
    id: "reconhecimento",
    title: "3. Reconhecimento",
    duration: "5 min",
    icon: Trophy,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    objective: "Criar um momento ÉPICO de celebração do destaque",
    dos: [
      "Toque música de entrada para o destaque",
      "Conte a HISTÓRIA de como ele conseguiu, não só o resultado",
      "Promova palmas de pé de toda a equipe",
      "Entregue algo simbólico (certificado, badge, foto)"
    ],
    donts: [
      "Não trate como rotina ou obrigação",
      "Evite premiar apenas números - valorize atitudes também",
      "Nunca pule esta seção por falta de tempo"
    ],
    tip: "Todos devem sair da RMR querendo ser o próximo destaque!"
  },
  {
    id: "motivacional",
    title: "4. Momento Motivacional",
    duration: "10 min",
    icon: Play,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    objective: "Conectar o tema do mês com a realidade da equipe",
    dos: [
      "Introduza o vídeo conectando ao contexto do time",
      "Após o vídeo, promova reflexão em duplas (2 min)",
      "Pergunte: 'O que você leva para aplicar esta semana?'",
      "Relacione a mensagem com as estratégias do mês"
    ],
    donts: [
      "Não passe o vídeo sem introdução ou contexto",
      "Evite vídeos muito longos (máx 5 min)",
      "Não pule a reflexão pós-vídeo"
    ],
    tip: "O vídeo é apenas o gatilho - o valor está na reflexão e conexão!"
  },
  {
    id: "metas",
    title: "5. Metas e Estratégias",
    duration: "10 min",
    icon: Flag,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    objective: "Definir metas claras com compromisso público da equipe",
    dos: [
      "Apresente a meta de forma SMART (Específica, Mensurável, Alcançável, Relevante, Temporal)",
      "Divida a meta total em metas semanais",
      "Peça compromisso público de cada vendedor",
      "Defina no máximo 3 estratégias focadas"
    ],
    donts: [
      "Evite metas vagas sem números claros",
      "Não liste dezenas de estratégias genéricas",
      "Não defina estratégias sem responsáveis"
    ],
    tip: "Meta sem compromisso público é apenas um desejo. Formalize!"
  },
  {
    id: "encerramento",
    title: "6. Encerramento",
    duration: "5 min",
    icon: Sparkles,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    objective: "Terminar no AUGE de energia com compromisso coletivo",
    dos: [
      "Todos de pé em círculo",
      "Promova grito de guerra ou palavra de ordem do time",
      "Termine com frase de impacto que resuma o tema",
      "Tire foto do time para o grupo de WhatsApp"
    ],
    donts: [
      "NUNCA termine em baixa energia ou com 'assuntos diversos'",
      "Não deixe a reunião 'morrer' naturalmente",
      "Evite encerrar sentado lendo recados"
    ],
    tip: "A última sensação define como o time lembra da RMR!"
  }
];

const RMRRulesCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Metodologia RMR
            <Badge variant="secondary" className="ml-2">45 min</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            A RMR segue uma estrutura de 6 seções para criar reuniões memoráveis e motivadoras
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Antes da Reunião */}
            <AccordionItem value="before">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Coffee className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Antes da Reunião</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Preparação
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-4 pl-11">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm font-medium text-foreground mb-2">
                      📅 Quando: {BEFORE_MEETING.when}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {BEFORE_MEETING.purpose}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Recursos Necessários:
                    </p>
                    <ul className="space-y-1">
                      {BEFORE_MEETING.resources.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <span className="font-semibold">Dica de Ouro:</span> Comunique toda a equipe da data da reunião com antecedência. A hora pode entrar no banco de horas.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Estrutura dos Slides */}
            <AccordionItem value="slides">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <FileSliders className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Estrutura dos Slides</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      4 slides
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-4 pl-11">
                  {SLIDES_STRUCTURE.map((slide) => (
                    <div key={slide.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${slide.bgColor}`}>
                          <slide.icon className={`h-3.5 w-3.5 ${slide.color}`} />
                        </div>
                        <span className="font-medium text-sm">{slide.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 pl-7">
                        {slide.content}
                      </p>
                      
                      {/* Dos */}
                      <div className="pl-7 mb-2">
                        <p className="text-xs font-medium text-emerald-500 mb-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          O que fazer:
                        </p>
                        <ul className="space-y-0.5">
                          {slide.dos.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-emerald-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tip */}
                      <div className="pl-7 mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          <span className="font-semibold">💡</span> {slide.tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Seções da RMR */}
            {RMR_SECTIONS.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <section.icon className={`h-4 w-4 ${section.color}`} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">{section.title}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {section.duration}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-4 pl-11">
                    {/* Objective */}
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-sm font-medium text-foreground">
                        Objetivo: {section.objective}
                      </p>
                    </div>

                    {/* Do's */}
                    <div>
                      <p className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        O que fazer:
                      </p>
                      <ul className="space-y-1">
                        {section.dos.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Don'ts */}
                    <div>
                      <p className="text-sm font-medium text-rose-500 mb-2 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        O que evitar:
                      </p>
                      <ul className="space-y-1">
                        {section.donts.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-rose-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Golden Tip */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        <span className="font-semibold">Dica de Ouro:</span> {section.tip}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}

            {/* Após a Reunião */}
            <AccordionItem value="after">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Camera className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Após a Reunião</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Pós-RMR
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-4 pl-11">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm font-medium text-foreground">
                      {AFTER_MEETING.action}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {AFTER_MEETING.model}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <span className="font-semibold">Dica de Ouro:</span> O Painel de Gestão à Vista mantém a equipe focada nas metas durante todo o mês. Coloque em local de alta visibilidade!
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RMRRulesCard;
