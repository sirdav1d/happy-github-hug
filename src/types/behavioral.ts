// Tipos para o módulo de Análise Comportamental

export interface DISCScores {
  d: number; // Dominância (0-100)
  i: number; // Influência (0-100)
  s: number; // Estabilidade (0-100)
  c: number; // Conformidade (0-100)
}

export interface ValuesScores {
  aesthetic: number;    // Estético (0-100)
  economic: number;     // Econômico (0-100)
  individualist: number; // Individualista (0-100)
  political: number;    // Político (0-100)
  altruistic: number;   // Altruísta (0-100)
  regulatory: number;   // Regulador (0-100)
  theoretical: number;  // Teórico (0-100)
}

export interface AttributeScores {
  empathy: number;           // Empatia (0-10)
  practicalThinking: number; // Pensamento Prático (0-10)
  systemsJudgment: number;   // Julgamento de Sistemas (0-10)
  selfEsteem: number;        // Autoestima (0-10)
  roleAwareness: number;     // Consciência de Papel (0-10)
  selfDirection: number;     // Autodireção (0-10)
}

export interface BehavioralProfile {
  id: string;
  salespersonId: string | null;
  userId: string;
  discNatural: DISCScores | null;
  discAdapted: DISCScores | null;
  values: ValuesScores | null;
  attributes: AttributeScores | null;
  source: 'questionnaire' | 'conversation' | 'innermetrix_pdf' | 'manual' | 'hybrid';
  confidenceScore: number;
  aiSummary: string | null;
  strengths: string[];
  developmentAreas: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BehavioralModuleConfig {
  id: string;
  userId: string;
  isEnabled: boolean;
  showInTeamView: boolean;
  showInFivi: boolean;
  showInRmr: boolean;
  allowSelfAssessment: boolean;
  createdAt: string;
  updatedAt: string;
}

// Questionário DISC
export interface DISCQuestionBlock {
  id: string;
  options: {
    id: 'd' | 'i' | 's' | 'c';
    text: string;
    description?: string;
  }[];
}

export interface DISCResponse {
  blockId: string;
  most: 'd' | 'i' | 's' | 'c';
  least: 'd' | 'i' | 's' | 'c';
}

// Questionário Values
export interface ValuesQuestion {
  id: string;
  question: string;
  options: {
    id: keyof ValuesScores;
    text: string;
  }[];
}

export interface ValuesResponse {
  questionId: string;
  ranking: (keyof ValuesScores)[]; // ordenado do mais importante ao menos
}

// Conversa Comportamental
export interface BehavioralConversation {
  id: string;
  profileId: string | null;
  salespersonId: string;
  userId: string;
  audioFilePath: string | null;
  transcription: string | null;
  aiAnalysis: {
    discIndicators: {
      dimension: 'd' | 'i' | 's' | 'c';
      score: number;
      evidence: string[];
    }[];
    valuesIndicators: {
      value: keyof ValuesScores;
      score: number;
      evidence: string[];
    }[];
    summary: string;
  } | null;
  aiDiscScores: DISCScores | null;
  aiValuesScores: ValuesScores | null;
  durationSeconds: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordedAt: string;
  processedAt: string | null;
}

// Constantes dos questionários - Perguntas ampliadas e diversificadas
export const DISC_QUESTION_BLOCKS: DISCQuestionBlock[] = [
  // Bloco 1: Traços gerais
  {
    id: 'block_1',
    options: [
      { id: 'd', text: 'Direto e decidido', description: 'Vai ao ponto, foca em resultados' },
      { id: 'i', text: 'Entusiasta e otimista', description: 'Energético, inspira os outros' },
      { id: 's', text: 'Paciente e confiável', description: 'Calmo, consistente, leal' },
      { id: 'c', text: 'Preciso e analítico', description: 'Detalhista, focado em qualidade' },
    ],
  },
  // Bloco 2: Comportamento em grupo
  {
    id: 'block_2',
    options: [
      { id: 'd', text: 'Competitivo', description: 'Quer vencer, superar desafios' },
      { id: 'i', text: 'Sociável', description: 'Gosta de interagir, fazer conexões' },
      { id: 's', text: 'Consistente', description: 'Mantém ritmo estável, previsível' },
      { id: 'c', text: 'Cuidadoso', description: 'Evita erros, verifica detalhes' },
    ],
  },
  // Bloco 3: Motivação interna
  {
    id: 'block_3',
    options: [
      { id: 'd', text: 'Determinado', description: 'Persiste até conseguir' },
      { id: 'i', text: 'Persuasivo', description: 'Convence com carisma' },
      { id: 's', text: 'Calmo', description: 'Mantém a serenidade' },
      { id: 'c', text: 'Sistemático', description: 'Segue processos e métodos' },
    ],
  },
  // Bloco 4: Tomada de risco
  {
    id: 'block_4',
    options: [
      { id: 'd', text: 'Ousado', description: 'Assume riscos, age rápido' },
      { id: 'i', text: 'Inspirador', description: 'Motiva e energiza o ambiente' },
      { id: 's', text: 'Estável', description: 'Previsível, não gosta de mudanças bruscas' },
      { id: 'c', text: 'Metódico', description: 'Organizado, segue planos' },
    ],
  },
  // Bloco 5: Expectativas
  {
    id: 'block_5',
    options: [
      { id: 'd', text: 'Exigente', description: 'Espera alto desempenho de si e dos outros' },
      { id: 'i', text: 'Encantador', description: 'Cativa com simpatia e carisma' },
      { id: 's', text: 'Previsível', description: 'Mantém rotinas estáveis' },
      { id: 'c', text: 'Perfeccionista', description: 'Busca a excelência em tudo' },
    ],
  },
  // Bloco 6: Autonomia e trabalho em equipe
  {
    id: 'block_6',
    options: [
      { id: 'd', text: 'Independente', description: 'Trabalha bem sozinho, autônomo' },
      { id: 'i', text: 'Expressivo', description: 'Demonstra emoções, comunica bem' },
      { id: 's', text: 'Leal', description: 'Fiel ao time e compromissos' },
      { id: 'c', text: 'Diplomático', description: 'Evita conflitos, pondera' },
    ],
  },
  // Bloco 7: Novidades e desafios
  {
    id: 'block_7',
    options: [
      { id: 'd', text: 'Aventureiro', description: 'Gosta de novos desafios' },
      { id: 'i', text: 'Confiante', description: 'Seguro de si, otimista' },
      { id: 's', text: 'Tranquilo', description: 'Relaxado, não se estressa fácil' },
      { id: 'c', text: 'Exato', description: 'Preciso nos detalhes' },
    ],
  },
  // Bloco 8: Comunicação
  {
    id: 'block_8',
    options: [
      { id: 'd', text: 'Assertivo', description: 'Expressa opiniões com firmeza' },
      { id: 'i', text: 'Otimista', description: 'Vê o lado positivo das situações' },
      { id: 's', text: 'Relaxado', description: 'Leve, não se afoba' },
      { id: 'c', text: 'Lógico', description: 'Pensa de forma racional' },
    ],
  },
  // Bloco 9: Orientação
  {
    id: 'block_9',
    options: [
      { id: 'd', text: 'Orientado a resultados', description: 'Foco em metas e entregas' },
      { id: 'i', text: 'Orientado a pessoas', description: 'Foco em relacionamentos' },
      { id: 's', text: 'Orientado ao time', description: 'Foco na harmonia do grupo' },
      { id: 'c', text: 'Orientado a qualidade', description: 'Foco em padrões e excelência' },
    ],
  },
  // Bloco 10: Gestão de risco
  {
    id: 'block_10',
    options: [
      { id: 'd', text: 'Toma riscos', description: 'Decide rápido mesmo com incerteza' },
      { id: 'i', text: 'Cria conexões', description: 'Networking natural' },
      { id: 's', text: 'Mantém harmonia', description: 'Evita conflitos, busca paz' },
      { id: 'c', text: 'Segue processos', description: 'Respeita regras e procedimentos' },
    ],
  },
  // Bloco 11: Resolução de problemas
  {
    id: 'block_11',
    options: [
      { id: 'd', text: 'Resolve rápido', description: 'Ação imediata em problemas' },
      { id: 'i', text: 'Motiva outros', description: 'Inspira a equipe a superar' },
      { id: 's', text: 'Apoia colegas', description: 'Ajuda quem precisa' },
      { id: 'c', text: 'Analisa dados', description: 'Decide com informações' },
    ],
  },
  // Bloco 12: Liderança
  {
    id: 'block_12',
    options: [
      { id: 'd', text: 'Lidera pelo exemplo', description: 'Mostra como fazer' },
      { id: 'i', text: 'Lidera pela inspiração', description: 'Motiva com visão' },
      { id: 's', text: 'Lidera pelo suporte', description: 'Apoia o crescimento' },
      { id: 'c', text: 'Lidera pela competência', description: 'Conhecimento técnico' },
    ],
  },
  // Bloco 13: Sob pressão (diferencia natural vs adaptado)
  {
    id: 'block_13',
    options: [
      { id: 'd', text: 'Fico mais agressivo', description: 'Pressiono para resolver rápido' },
      { id: 'i', text: 'Fico mais falante', description: 'Busco apoio conversando' },
      { id: 's', text: 'Fico mais quieto', description: 'Me retraio para processar' },
      { id: 'c', text: 'Fico mais crítico', description: 'Analiso detalhes obsessivamente' },
    ],
  },
  // Bloco 14: Reação a críticas
  {
    id: 'block_14',
    options: [
      { id: 'd', text: 'Defendo minha posição', description: 'Argumento e justifico' },
      { id: 'i', text: 'Tento amenizar', description: 'Uso humor ou charme' },
      { id: 's', text: 'Aceito em silêncio', description: 'Processo internamente' },
      { id: 'c', text: 'Peço mais detalhes', description: 'Quero entender os fatos' },
    ],
  },
  // Bloco 15: Ritmo de trabalho
  {
    id: 'block_15',
    options: [
      { id: 'd', text: 'Rápido e intenso', description: 'Prefiro terminar logo' },
      { id: 'i', text: 'Variado e dinâmico', description: 'Gosto de variar tarefas' },
      { id: 's', text: 'Constante e estável', description: 'Ritmo regular, sem pressa' },
      { id: 'c', text: 'Meticuloso e cuidadoso', description: 'Qualidade sobre velocidade' },
    ],
  },
  // Bloco 16: Em reuniões
  {
    id: 'block_16',
    options: [
      { id: 'd', text: 'Foco no objetivo', description: 'Quero decisões e ações' },
      { id: 'i', text: 'Engajo o grupo', description: 'Trago energia e ideias' },
      { id: 's', text: 'Ouço atentamente', description: 'Contribuo quando necessário' },
      { id: 'c', text: 'Anoto e analiso', description: 'Preparo e documento' },
    ],
  },
  // Bloco 17: Mudanças
  {
    id: 'block_17',
    options: [
      { id: 'd', text: 'Abraço mudanças', description: 'Vejo como oportunidade' },
      { id: 'i', text: 'Comunico e engajo', description: 'Ajudo outros a aceitar' },
      { id: 's', text: 'Prefiro estabilidade', description: 'Preciso de tempo para adaptar' },
      { id: 'c', text: 'Avalio criticamente', description: 'Questiono se faz sentido' },
    ],
  },
  // Bloco 18: Conflitos
  {
    id: 'block_18',
    options: [
      { id: 'd', text: 'Enfrento diretamente', description: 'Resolvo na hora' },
      { id: 'i', text: 'Busco conciliação', description: 'Uso persuasão para resolver' },
      { id: 's', text: 'Evito confronto', description: 'Prefiro ceder a brigar' },
      { id: 'c', text: 'Analiso os fatos', description: 'Busco solução lógica' },
    ],
  },
];

export const VALUES_QUESTIONS: ValuesQuestion[] = [
  {
    id: 'values_1',
    question: 'O que mais te motiva no trabalho?',
    options: [
      { id: 'economic', text: 'Ganho financeiro e retorno prático' },
      { id: 'altruistic', text: 'Fazer diferença na vida das pessoas' },
      { id: 'political', text: 'Ser reconhecido como líder/referência' },
      { id: 'theoretical', text: 'Aprender e dominar novos conhecimentos' },
    ],
  },
  {
    id: 'values_2',
    question: 'O que te dá mais satisfação ao final do dia?',
    options: [
      { id: 'economic', text: 'Ver resultados concretos e lucro' },
      { id: 'altruistic', text: 'Ter ajudado alguém genuinamente' },
      { id: 'political', text: 'Ter influenciado uma decisão importante' },
      { id: 'theoretical', text: 'Ter descoberto algo novo' },
    ],
  },
  {
    id: 'values_3',
    question: 'Qual ambiente de trabalho ideal?',
    options: [
      { id: 'individualist', text: 'Com liberdade e autonomia' },
      { id: 'regulatory', text: 'Com regras claras e estrutura' },
      { id: 'aesthetic', text: 'Com harmonia e equilíbrio' },
      { id: 'economic', text: 'Com desafios constantes e metas' },
    ],
  },
  {
    id: 'values_4',
    question: 'Como você prefere tomar decisões?',
    options: [
      { id: 'theoretical', text: 'Baseado em pesquisa e análise' },
      { id: 'political', text: 'Baseado no impacto e influência' },
      { id: 'regulatory', text: 'Baseado em princípios e regras' },
      { id: 'individualist', text: 'Baseado no que faz sentido pra mim' },
    ],
  },
  {
    id: 'values_5',
    question: 'O que mais te incomoda no trabalho?',
    options: [
      { id: 'aesthetic', text: 'Ambientes caóticos e desorganizados' },
      { id: 'altruistic', text: 'Situações onde pessoas são prejudicadas' },
      { id: 'economic', text: 'Desperdício de recursos e tempo' },
      { id: 'theoretical', text: 'Falta de aprendizado e crescimento' },
    ],
  },
  {
    id: 'values_6',
    question: 'Como você gosta de ser reconhecido?',
    options: [
      { id: 'economic', text: 'Com bônus e recompensas financeiras' },
      { id: 'political', text: 'Com promoções e mais responsabilidade' },
      { id: 'altruistic', text: 'Com gratidão sincera das pessoas' },
      { id: 'individualist', text: 'Com mais liberdade e autonomia' },
    ],
  },
  {
    id: 'values_7',
    question: 'O que define sucesso para você?',
    options: [
      { id: 'economic', text: 'Estabilidade financeira e patrimônio' },
      { id: 'political', text: 'Reconhecimento e influência' },
      { id: 'aesthetic', text: 'Equilíbrio e qualidade de vida' },
      { id: 'theoretical', text: 'Conhecimento e expertise' },
    ],
  },
  // Novas perguntas para melhor cobertura
  {
    id: 'values_8',
    question: 'Como você prefere gastar seu tempo livre?',
    options: [
      { id: 'aesthetic', text: 'Em atividades artísticas ou na natureza' },
      { id: 'theoretical', text: 'Lendo, estudando ou pesquisando' },
      { id: 'altruistic', text: 'Ajudando a comunidade ou voluntariado' },
      { id: 'individualist', text: 'Fazendo algo só para mim' },
    ],
  },
  {
    id: 'values_9',
    question: 'O que você valoriza em um colega de trabalho?',
    options: [
      { id: 'regulatory', text: 'Que siga as regras e seja ético' },
      { id: 'economic', text: 'Que seja produtivo e eficiente' },
      { id: 'political', text: 'Que tenha influência e conexões' },
      { id: 'altruistic', text: 'Que seja colaborativo e generoso' },
    ],
  },
  {
    id: 'values_10',
    question: 'Em uma negociação, o que mais importa?',
    options: [
      { id: 'economic', text: 'O melhor retorno financeiro' },
      { id: 'political', text: 'Manter minha posição de poder' },
      { id: 'altruistic', text: 'Que todos saiam satisfeitos' },
      { id: 'regulatory', text: 'Que seja justo e transparente' },
    ],
  },
];

// Helpers para labels
export const DISC_LABELS: Record<'d' | 'i' | 's' | 'c', { name: string; color: string; description: string }> = {
  d: { name: 'Dominância', color: 'hsl(0, 70%, 50%)', description: 'Foco em resultados, direto, decisivo' },
  i: { name: 'Influência', color: 'hsl(45, 90%, 50%)', description: 'Foco em pessoas, entusiasta, otimista' },
  s: { name: 'Estabilidade', color: 'hsl(120, 50%, 45%)', description: 'Foco em harmonia, paciente, consistente' },
  c: { name: 'Conformidade', color: 'hsl(210, 70%, 50%)', description: 'Foco em qualidade, preciso, analítico' },
};

export const VALUES_LABELS: Record<keyof ValuesScores, { name: string; color: string; description: string }> = {
  aesthetic: { name: 'Estético', color: 'hsl(280, 60%, 55%)', description: 'Harmonia, equilíbrio, beleza' },
  economic: { name: 'Econômico', color: 'hsl(45, 80%, 45%)', description: 'Retorno prático, eficiência' },
  individualist: { name: 'Individualista', color: 'hsl(25, 70%, 50%)', description: 'Autonomia, liberdade pessoal' },
  political: { name: 'Político', color: 'hsl(0, 60%, 45%)', description: 'Influência, liderança, poder' },
  altruistic: { name: 'Altruísta', color: 'hsl(150, 50%, 45%)', description: 'Servir, ajudar os outros' },
  regulatory: { name: 'Regulador', color: 'hsl(210, 50%, 50%)', description: 'Ordem, regras, tradição' },
  theoretical: { name: 'Teórico', color: 'hsl(180, 50%, 45%)', description: 'Conhecimento, aprendizado' },
};

// Attribute Index Labels (3rd Pillar)
export const ATTRIBUTE_LABELS: Record<keyof AttributeScores, { name: string; color: string; description: string }> = {
  empathy: { name: 'Empatia', color: 'hsl(200, 70%, 50%)', description: 'Capacidade de entender os sentimentos dos outros' },
  practicalThinking: { name: 'Pensamento Prático', color: 'hsl(140, 60%, 45%)', description: 'Habilidade de aplicar conhecimento em situações reais' },
  systemsJudgment: { name: 'Julgamento de Sistemas', color: 'hsl(260, 60%, 55%)', description: 'Capacidade de avaliar e organizar sistemas' },
  selfEsteem: { name: 'Autoestima', color: 'hsl(35, 80%, 50%)', description: 'Valorização e confiança em si mesmo' },
  roleAwareness: { name: 'Consciência de Papel', color: 'hsl(350, 65%, 50%)', description: 'Entendimento do próprio papel e responsabilidades' },
  selfDirection: { name: 'Autodireção', color: 'hsl(180, 55%, 45%)', description: 'Capacidade de definir e seguir seus próprios objetivos' },
};

// Confidence levels based on source
export const CONFIDENCE_LEVELS: Record<string, { min: number; max: number; label: string; color: string }> = {
  innermetrix: { min: 90, max: 100, label: 'Alta Precisão', color: 'emerald' },
  innermetrix_pdf: { min: 90, max: 100, label: 'Alta Precisão', color: 'emerald' },
  questionnaire: { min: 70, max: 80, label: 'Aproximação', color: 'amber' },
  conversation: { min: 60, max: 75, label: 'Inferência IA', color: 'blue' },
  manual: { min: 50, max: 70, label: 'Entrada Manual', color: 'slate' },
  hybrid: { min: 65, max: 85, label: 'Híbrido', color: 'violet' },
};
