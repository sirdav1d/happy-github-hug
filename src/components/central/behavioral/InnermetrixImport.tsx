import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileUp, CheckCircle2, AlertCircle, Sparkles, Brain, Heart, Upload, FileText, Eye, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { DISCScores, ValuesScores, AttributeScores } from '@/types/behavioral';
import { DISC_LABELS, VALUES_LABELS, ATTRIBUTE_LABELS } from '@/types/behavioral';
import { DISCRadarChart } from './DISCRadarChart';
import { ValuesBarChart } from './ValuesBarChart';
import { AttributeIndexChart } from './AttributeIndexChart';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface InnermetrixImportProps {
  salespersonName: string;
  onComplete: (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    attributeScores?: AttributeScores;
    source: 'innermetrix';
  }) => void;
  onCancel: () => void;
}

export function InnermetrixImport({ 
  salespersonName, 
  onComplete, 
  onCancel 
}: InnermetrixImportProps) {
  const [discScores, setDiscScores] = useState<DISCScores>({ d: 50, i: 50, s: 50, c: 50 });
  const [valuesScores, setValuesScores] = useState<ValuesScores>({
    aesthetic: 50,
    economic: 50,
    individualist: 50,
    political: 50,
    altruistic: 50,
    regulatory: 50,
    theoretical: 50,
  });
  const [attributeScores, setAttributeScores] = useState<AttributeScores>({
    empathy: 5,
    practicalThinking: 5,
    systemsJudgment: 5,
    selfEsteem: 5,
    roleAwareness: 5,
    selfDirection: 5,
  });
  
  // Flags para indicar quais pilares foram extraídos
  const [hasDisc, setHasDisc] = useState(false);
  const [hasValues, setHasValues] = useState(false);
  const [hasAttributes, setHasAttributes] = useState(false);
  
  const [pdfText, setPdfText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);
  const [showManualAdjust, setShowManualAdjust] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDISCChange = (key: keyof DISCScores, value: number[]) => {
    setDiscScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleValuesChange = (key: keyof ValuesScores, value: number[]) => {
    setValuesScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleAttributeChange = (key: keyof AttributeScores, value: number[]) => {
    setAttributeScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');
    setParseSuccess(false);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        const pageTexts: string[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const strings = content.items
            .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
            .filter(Boolean);
          pageTexts.push(strings.join(' '));
        }

        const text = pageTexts.join('\n\n');
        if (text.trim().length < 50) {
          setParseError('Não foi possível extrair texto suficiente do PDF. Tente exportar o relatório como texto (.txt) ou copie/cole o conteúdo.');
          return;
        }

        setPdfText(text);
        parsePDFText(text);
        return;
      }

      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text();
        setPdfText(text);
        parsePDFText(text);
        return;
      }

      setParseError('Formato não suportado. Use arquivos .txt ou .pdf.');
    } catch (error) {
      console.error('Error reading file:', error);
      setParseError('Erro ao ler arquivo. Tente novamente ou copie e cole o texto.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const normalizeNumber = (raw: string) => {
    const cleaned = raw
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '')
      .trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const pickBestCandidate = (candidates: { value: number; distance: number }[]) => {
    if (candidates.length === 0) return null;

    // Heurística: evita pegar valores de escala (100) / referência comum (50)
    // quando existir outra alternativa plausível.
    const hasNonScale = candidates.some(
      (c) => c.value >= 0 && c.value <= 100 && c.value !== 100 && c.value !== 50
    );

    const score = (c: { value: number; distance: number }) => {
      let penalty = 0;
      if (hasNonScale && (c.value === 100 || c.value === 50)) penalty += 1000;
      if (c.value < 0 || c.value > 100) penalty += 1000;
      // valores muito pequenos são raros no gráfico de motivadores, mas podem existir.
      // Mantém apenas uma penalidade leve.
      if (c.value <= 5) penalty += 50;
      return c.distance + penalty;
    };

    return candidates
      .slice()
      .sort((a, b) => score(a) - score(b))[0].value;
  };

  const findLabeledNumber = (
    text: string,
    labels: string[],
    options?: {
      windowSize?: number;
      stopAtLabels?: string[]; // delimita busca até o próximo label (evita pegar escala do gráfico)
    }
  ): number | null => {
    const hay = text;
    const windowSize = options?.windowSize ?? 220;

    for (const label of labels) {
      const candidates: { value: number; distance: number }[] = [];

      // Varre todas as ocorrências do label e coleta números próximos.
      const reLabel = new RegExp(label, 'ig');
      let m: RegExpExecArray | null;
      while ((m = reLabel.exec(hay)) !== null) {
        const start = m.index;
        let end = Math.min(hay.length, start + windowSize);

        if (options?.stopAtLabels?.length) {
          const after = hay.slice(start, end);
          for (const stopLabel of options.stopAtLabels) {
            const idx = after.toLowerCase().indexOf(stopLabel.toLowerCase());
            if (idx > 0) {
              end = start + idx;
              break;
            }
          }
        }

        const slice = hay.slice(start, end);

        // Procura TODOS os números no trecho e calcula distância relativa.
        const reNum = /(-?\d+(?:[\.,]\d+)?)/g;
        let n: RegExpExecArray | null;
        while ((n = reNum.exec(slice)) !== null) {
          const val = normalizeNumber(n[1]);
          if (val == null) continue;
          candidates.push({ value: val, distance: n.index });
        }
      }

      const picked = pickBestCandidate(candidates);
      if (picked != null) return picked;
    }

    return null;
  };

  const extractValuesLoose = (text: string): { found: boolean; scores?: ValuesScores } => {
    // Foca na seção do relatório onde aparece o gráfico/tabela de motivadores.
    const anchorMatch = text.match(/Resumo Executivo dos Valores Motivacionais|Valores Motivacionais/i);
    const scoped = anchorMatch
      ? text.slice(anchorMatch.index ?? 0, (anchorMatch.index ?? 0) + 12000)
      : text;

    const stopAt = ['estética', 'econômico', 'economico', 'individualista', 'político', 'politico', 'altruísta', 'altruista', 'regulador', 'teórico', 'teorico'];

    // Labels expandidos para cobrir variações PT/EN
    const v = {
      aesthetic: findLabeledNumber(scoped, ['estética', 'estético', 'estetica', 'estetico', 'aesthetic'], {
        stopAtLabels: stopAt,
      }),
      economic: findLabeledNumber(scoped, ['econômico', 'economico', 'econômica', 'economica', 'economic'], {
        stopAtLabels: stopAt,
      }),
      individualist: findLabeledNumber(scoped, ['individualista', 'individualist', 'individual'], {
        stopAtLabels: stopAt,
      }),
      political: findLabeledNumber(scoped, ['político', 'politico', 'política', 'politica', 'political'], {
        stopAtLabels: stopAt,
      }),
      altruistic: findLabeledNumber(scoped, ['altruísta', 'altruista', 'altruístico', 'altruistico', 'altruistic'], {
        stopAtLabels: stopAt,
      }),
      regulatory: findLabeledNumber(scoped, ['regulador', 'reguladora', 'regulatory', 'regulatório', 'regulatorio'], {
        stopAtLabels: stopAt,
      }),
      theoretical: findLabeledNumber(scoped, ['teórico', 'teorico', 'teórica', 'teorica', 'theoretical'], {
        stopAtLabels: stopAt,
      }),
    } as const;

    const foundCount = Object.values(v).filter((n) => n != null).length;
    if (foundCount < 5) return { found: false };

    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    return {
      found: true,
      scores: {
        aesthetic: clamp(v.aesthetic ?? 50),
        economic: clamp(v.economic ?? 50),
        individualist: clamp(v.individualist ?? 50),
        political: clamp(v.political ?? 50),
        altruistic: clamp(v.altruistic ?? 50),
        regulatory: clamp(v.regulatory ?? 50),
        theoretical: clamp(v.theoretical ?? 50),
      },
    };
  };

  const extractAttributesLoose = (text: string): { found: boolean; scores?: AttributeScores } => {
    const a = {
      empathy: findLabeledNumber(text, ['empatia', 'empathy']),
      practicalThinking: findLabeledNumber(text, ['pensamento prático', 'pensamento pratico', 'practical thinking']),
      systemsJudgment: findLabeledNumber(text, ['julgamento de sistemas', 'systems judgment', 'systems judgement']),
      selfEsteem: findLabeledNumber(text, ['autoestima', 'auto-estima', 'self esteem', 'self-esteem']),
      roleAwareness: findLabeledNumber(text, ['consciência de papel', 'consciencia de papel', 'consciência da função', 'consciencia da funcao', 'role awareness']),
      selfDirection: findLabeledNumber(text, ['autodireção', 'autodirecao', 'self direction', 'self-direction']),
    } as const;

    const foundCount = Object.values(a).filter((n) => n != null).length;
    if (foundCount < 4) return { found: false };

    const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
    return {
      found: true,
      scores: {
        empathy: clamp(a.empathy ?? 5),
        practicalThinking: clamp(a.practicalThinking ?? 5),
        systemsJudgment: clamp(a.systemsJudgment ?? 5),
        selfEsteem: clamp(a.selfEsteem ?? 5),
        roleAwareness: clamp(a.roleAwareness ?? 5),
        selfDirection: clamp(a.selfDirection ?? 5),
      },
    };
  };

  const parsePDFText = (text?: string) => {
    const textToParse = (text || pdfText || '').trim();

    if (!textToParse) {
      setParseError('Nenhum texto para analisar');
      return;
    }

    setIsParsing(true);
    setParseError('');
    setParseSuccess(false);

    try {
      // Reset flags
      let discFound = false;
      let valuesFound = false;
      let attributesFound = false;

      // DISC Patterns - múltiplos formatos
      const discPatterns = [
        /(?:D|Dominância|Dominance)[:\s=]*(\d+)[\s\S]*?(?:I|Influência|Influence)[:\s=]*(\d+)[\s\S]*?(?:S|Estabilidade|Steadiness)[:\s=]*(\d+)[\s\S]*?(?:C|Conformidade|Compliance)[:\s=]*(\d+)/i,
        /(?:Natural|Adapted|DISC)[\s\S]{0,50}?D[:\s]*(\d+)[\s\S]{0,20}?I[:\s]*(\d+)[\s\S]{0,20}?S[:\s]*(\d+)[\s\S]{0,20}?C[:\s]*(\d+)/i,
        /DISC[\s\S]{0,100}?(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/i,
      ];

      for (const pattern of discPatterns) {
        const match = textToParse.match(pattern);
        if (!match) continue;
        const [, d, i, s, c] = match;
        const dVal = parseInt(d);
        const iVal = parseInt(i);
        const sVal = parseInt(s);
        const cVal = parseInt(c);

        if ([dVal, iVal, sVal, cVal].every((v) => v >= 0 && v <= 100)) {
          setDiscScores({ d: dVal, i: iVal, s: sVal, c: cVal });
          setHasDisc(true);
          discFound = true;
          break;
        }
      }

      // Values (Motivadores) - padrões mais flexíveis
      const valuesPatterns = [
        // Formato com labels completos (PT e EN)
        /(?:Estétic[ao]?|Aesthetic)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Econômic[ao]?|Economic)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Individualista|Individualist)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Polític[ao]?|Political)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Altru[ií]st[ao]?|Altruistic)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Regulador[a]?|Regulatory)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Teóric[ao]?|Theoretical)[:\s=]*(\d+(?:[\.,]\d+)?)/i,
        // Formato tabela: "Estética | Econômico | ..." (aceita decimais e vírgula)
        /Estética\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Econômico\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Individualista\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Político\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Altruísta\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Regulador\s*[\|:]\s*(\d+(?:[\.,]\d+)?)[\s\S]*?Teórico\s*[\|:]\s*(\d+(?:[\.,]\d+)?)/i,
        // Formato genérico Values
        /Values[\s\S]{0,200}?(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/i,
        // Formato mais relaxado
        /Estétic[ao]?\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Econômic[ao]?\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Individual[a-z]*\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Polític[ao]?\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Altru[ií]st[ao]?\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Regulad[a-z]*\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Teóric[ao]?\s*[\|:\-]?\s*(\d+(?:[\.,]\d+)?)/i,
      ];

      for (const pattern of valuesPatterns) {
        const match = textToParse.match(pattern);
        if (!match) continue;
        const raw = match.slice(1, 8).map((v) => normalizeNumber(v)).filter((v): v is number => v != null);
        if (raw.length !== 7) continue;
        if (!raw.every((v) => v >= 0 && v <= 100)) continue;

        const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
        setValuesScores({
          aesthetic: clamp(raw[0]),
          economic: clamp(raw[1]),
          individualist: clamp(raw[2]),
          political: clamp(raw[3]),
          altruistic: clamp(raw[4]),
          regulatory: clamp(raw[5]),
          theoretical: clamp(raw[6]),
        });
        setHasValues(true);
        valuesFound = true;
        break;
      }

      // Se regex estrito falhou, tenta extração loose ANTES de desistir
      if (!valuesFound) {
        const loose = extractValuesLoose(textToParse);
        if (loose.found && loose.scores) {
          setValuesScores(loose.scores);
          setHasValues(true);
          valuesFound = true;
        }
      }

      // Extração loose já foi feita acima, não precisa duplicar

      // Attribute Index - escala 0-10
      const attributePatterns = [
        /(?:Empatia|Empathy)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Pensamento Prático|Practical Thinking)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Julgamento de Sistemas|Systems Judgment)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Auto-?estima|Self.?Esteem)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Consciência de (?:Papel|Função)|Role Awareness)[:\s=]*(\d+(?:[\.,]\d+)?)[\s\S]*?(?:Auto-?direção|Self.?Direction)[:\s=]*(\d+(?:[\.,]\d+)?)/i,
        /Empat[a-z]*[:\s]+(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Prático[:\s]+(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Sistema[:\s]+(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Estima[:\s]+(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?(?:Papel|Função)[:\s]+(\d+(?:[\.,]\d+)?)[\s\S]{0,100}?Direção[:\s]+(\d+(?:[\.,]\d+)?)/i,
        /Attribute\s*Index[\s\S]{0,300}?(\d+(?:[\.,]\d+)?)\D+(\d+(?:[\.,]\d+)?)\D+(\d+(?:[\.,]\d+)?)\D+(\d+(?:[\.,]\d+)?)\D+(\d+(?:[\.,]\d+)?)\D+(\d+(?:[\.,]\d+)?)/i,
      ];

      for (const pattern of attributePatterns) {
        const match = textToParse.match(pattern);
        if (!match) continue;

        const raw = match
          .slice(1, 7)
          .map((v) => normalizeNumber(v))
          .filter((v): v is number => v != null);

        if (raw.length !== 6) continue;
        if (!raw.every((v) => v >= 0 && v <= 10)) continue;

        const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
        setAttributeScores({
          empathy: clamp(raw[0]),
          practicalThinking: clamp(raw[1]),
          systemsJudgment: clamp(raw[2]),
          selfEsteem: clamp(raw[3]),
          roleAwareness: clamp(raw[4]),
          selfDirection: clamp(raw[5]),
        });
        setHasAttributes(true);
        attributesFound = true;
        break;
      }

      if (!attributesFound) {
        const loose = extractAttributesLoose(textToParse);
        if (loose.found && loose.scores) {
          setAttributeScores(loose.scores);
          setHasAttributes(true);
          attributesFound = true;
        }
      }

      // Feedback
      if (discFound || valuesFound || attributesFound) {
        setParseSuccess(true);
        const extracted = [
          discFound && 'DISC',
          valuesFound && 'Motivadores',
          attributesFound && 'Attribute Index',
        ]
          .filter(Boolean)
          .join(', ');
        toast.success(`Extraído: ${extracted}! Revise antes de salvar.`);
      } else {
        setParseError(
          'Não foi possível extrair valores automaticamente. Verifique o formato do texto ou ajuste manualmente.'
        );
        setShowManualAdjust(true);
        setHasDisc(true); // Permite entrada manual
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseError('Erro ao processar texto. Ajuste os valores manualmente.');
      setShowManualAdjust(true);
      setHasDisc(true);
    } finally {
      setIsParsing(false);
    }
  };

  const tryAutoEnablePillar = (pillar: 'values' | 'attributes', checked: boolean) => {
    if (!checked) {
      if (pillar === 'values') setHasValues(false);
      if (pillar === 'attributes') setHasAttributes(false);
      return;
    }

    const textToParse = (pdfText || '').trim();
    if (!textToParse) {
      // Sem texto: permite manual (valores padrão) — mas deixa claro
      if (pillar === 'values') setHasValues(true);
      if (pillar === 'attributes') setHasAttributes(true);
      toast.message('Sem texto para extrair. Ajuste manualmente os valores.');
      return;
    }

    if (pillar === 'values') {
      // tenta extrair só motivadores
      const loose = extractValuesLoose(textToParse);
      if (loose.found && loose.scores) {
        setValuesScores(loose.scores);
        setHasValues(true);
        toast.success('Motivadores extraídos do texto.');
        return;
      }
      // fallback: reprocessa tudo (caso o padrão completo funcione)
      parsePDFText(textToParse);
      if (!hasValues) toast.error('Motivadores não encontrados no texto extraído.');
      setHasValues(true); // mantém habilitado para ajuste manual
      return;
    }

    if (pillar === 'attributes') {
      const loose = extractAttributesLoose(textToParse);
      if (loose.found && loose.scores) {
        setAttributeScores(loose.scores);
        setHasAttributes(true);
        toast.success('Attribute Index extraído do texto.');
        return;
      }
      parsePDFText(textToParse);
      if (!hasAttributes) toast.error('Attribute Index não encontrado no texto extraído.');
      setHasAttributes(true);
    }
  };

  const handleSubmit = () => {
    onComplete({
      discScores,
      valuesScores: hasValues ? valuesScores : undefined,
      attributeScores: hasAttributes ? attributeScores : undefined,
      source: 'innermetrix',
    });
  };

  const isValid = Object.values(discScores).every(v => v >= 0 && v <= 100);
  
  // Contagem de pilares extraídos
  const pillarsCount = [hasDisc, hasValues, hasAttributes].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Award className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Importar Relatório Innermetrix</h2>
        </div>
        <p className="text-muted-foreground">
          Perfil de: <span className="font-medium text-foreground">{salespersonName}</span>
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Método Recomendado
          </Badge>
          {pillarsCount > 0 && (
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3 h-3" />
              {pillarsCount}/3 Pilares
            </Badge>
          )}
        </div>
      </div>

      {/* Instructions with 3 pillars explanation */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-3">
              <p className="font-medium">Metodologia Innermetrix - 3 Pilares</p>
              <div className="grid gap-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">DISC (COMO)</span>
                    <span className="ml-1">- Estilo comportamental e comunicação</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Values Index (PORQUÊ)</span>
                    <span className="ml-1">- Motivadores e valores pessoais</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Attribute Index (O QUÊ)</span>
                    <span className="ml-1">- Competências e talentos naturais</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80">
                O sistema extrai automaticamente todos os pilares encontrados no PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <div className="space-y-3">
        <Label className="text-base font-medium">1. Upload do Relatório</Label>
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Arraste o arquivo ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground mt-1">
            Formatos suportados: PDF ou TXT
          </p>
        </div>
      </div>

      {/* Or paste text */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou cole o texto</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>2. Texto do Relatório</Label>
        <Textarea
          placeholder="Cole aqui o texto copiado do relatório Innermetrix..."
          value={pdfText}
          onChange={(e) => setPdfText(e.target.value)}
          rows={5}
          className="font-mono text-xs"
        />
      </div>

      {/* Feedback */}
      {parseSuccess && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertDescription>
            ✅ Valores extraídos com sucesso! Revise abaixo e ajuste se necessário.
          </AlertDescription>
        </Alert>
      )}

      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {pdfText.trim() && !parseSuccess && (
        <Button 
          onClick={() => parsePDFText()} 
          disabled={isParsing}
          variant="secondary"
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          {isParsing ? 'Processando...' : 'Extrair Valores do Texto'}
        </Button>
      )}

      {/* Extracted/Adjustable Values */}
      {(parseSuccess || showManualAdjust) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">3. Valores Extraídos</Label>
            <Badge variant="outline" className="gap-1">
              {parseSuccess ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Extraído automaticamente
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  Ajuste manual necessário
                </>
              )}
            </Badge>
          </div>

          {/* Pillar Toggles */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDisc}
                onChange={(e) => setHasDisc(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground"
              />
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="text-sm">DISC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasValues}
                onChange={(e) => tryAutoEnablePillar('values', e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground"
              />
              <Heart className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Motivadores</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAttributes}
                onChange={(e) => tryAutoEnablePillar('attributes', e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground"
              />
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Attribute Index</span>
            </label>
          </div>

          {/* DISC Scores */}
          {hasDisc && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  Perfil DISC (Como se comporta)
                </h4>
                <div className="space-y-4">
                  {(Object.keys(discScores) as Array<keyof DISCScores>).map((key) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: DISC_LABELS[key].color }}
                          />
                          {DISC_LABELS[key].name}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={discScores[key]}
                          onChange={(e) => handleDISCChange(key, [parseInt(e.target.value) || 0])}
                          className="w-20 text-center"
                        />
                      </div>
                      <Slider
                        value={[discScores[key]]}
                        onValueChange={(v) => handleDISCChange(key, v)}
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:bg-violet-500"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Values Scores */}
          {hasValues && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-amber-500" />
                    Motivadores (Porquê faz)
                  </h4>
                  <div className="space-y-3">
                    {(Object.keys(valuesScores) as Array<keyof ValuesScores>).map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="flex items-center gap-2 text-sm">
                            <span 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: VALUES_LABELS[key].color }}
                            />
                            {VALUES_LABELS[key].name}
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={valuesScores[key]}
                            onChange={(e) => handleValuesChange(key, [parseInt(e.target.value) || 0])}
                            className="w-16 text-center text-sm h-8"
                          />
                        </div>
                        <Slider
                          value={[valuesScores[key]]}
                          onValueChange={(v) => handleValuesChange(key, v)}
                          max={100}
                          step={1}
                          className="[&_[role=slider]]:bg-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Attribute Index Scores */}
          {hasAttributes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Attribute Index (O que faz bem) - Escala 0-10
                  </h4>
                  <div className="space-y-3">
                    {(Object.keys(attributeScores) as Array<keyof AttributeScores>).map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="flex items-center gap-2 text-sm">
                            <span 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: ATTRIBUTE_LABELS[key].color }}
                            />
                            {ATTRIBUTE_LABELS[key].name}
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={attributeScores[key]}
                            onChange={(e) => handleAttributeChange(key, [parseFloat(e.target.value) || 0])}
                            className="w-16 text-center text-sm h-8"
                          />
                        </div>
                        <Slider
                          value={[attributeScores[key]]}
                          onValueChange={(v) => handleAttributeChange(key, v)}
                          max={10}
                          step={0.1}
                          className="[&_[role=slider]]:bg-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Live Preview - 3 Pillars */}
          <Card className="bg-muted/20 border-primary/20">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-4 flex items-center gap-2 text-primary">
                <Eye className="w-4 h-4" />
                Visualização Prévia - {pillarsCount} Pilar{pillarsCount !== 1 ? 'es' : ''}
              </h4>
              <div className={`grid gap-6 ${pillarsCount >= 3 ? 'lg:grid-cols-3' : pillarsCount === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {hasDisc && (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-violet-500" />
                      <p className="text-sm text-muted-foreground">DISC</p>
                    </div>
                    <DISCRadarChart natural={discScores} size="sm" showLegend={false} />
                  </div>
                )}
                
                {hasValues && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Heart className="w-4 h-4 text-amber-500" />
                      <p className="text-sm text-muted-foreground">Motivadores</p>
                    </div>
                    <ValuesBarChart values={valuesScores} size="sm" />
                  </div>
                )}
                
                {hasAttributes && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Target className="w-4 h-4 text-blue-500" />
                      <p className="text-sm text-muted-foreground">Attribute Index</p>
                    </div>
                    <AttributeIndexChart attributes={attributeScores} size="sm" showLabels={false} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid || !hasDisc}
          className="flex-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Salvar Perfil
        </Button>
      </div>
    </div>
  );
}
