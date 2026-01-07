import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Download, Table as TableIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Salesperson } from '@/types';
import { EntryType } from '@/types/sales';
import * as XLSX from 'xlsx';

interface SalesImportWizardProps {
  team: Salesperson[];
  onSubmit: (entries: { salesperson_id: string; salesperson_name: string; amount: number; sale_date: string; entry_type: EntryType }[]) => Promise<void>;
  isSubmitting: boolean;
}

interface ImportEntry {
  year: number;
  month: number;
  salesperson_name: string;
  salesperson_id?: string;
  amount: number;
  isValid: boolean;
  error?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const STEPS = [
  { id: 1, label: 'Seleção', description: 'Escolha o período e método' },
  { id: 2, label: 'Dados', description: 'Importe ou insira os dados' },
  { id: 3, label: 'Revisão', description: 'Verifique e confirme' },
];

const SalesImportWizard: React.FC<SalesImportWizardProps> = ({ team, onSubmit, isSubmitting }) => {
  const currentYear = new Date().getFullYear();
  
  const [step, setStep] = useState(1);
  const [startYear, setStartYear] = useState(currentYear - 1);
  const [startMonth, setStartMonth] = useState(0);
  const [endYear, setEndYear] = useState(currentYear - 1);
  const [endMonth, setEndMonth] = useState(11);
  const [importMethod, setImportMethod] = useState<'upload' | 'manual'>('upload');
  const [importedData, setImportedData] = useState<ImportEntry[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 2018; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const downloadTemplate = () => {
    const templateData = [
      { Ano: 2023, Mês: 'Janeiro', Vendedor: 'Nome do Vendedor', 'Valor Total': 10000 },
      { Ano: 2023, Mês: 'Janeiro', Vendedor: 'Outro Vendedor', 'Valor Total': 15000 },
      { Ano: 2023, Mês: 'Fevereiro', Vendedor: 'Nome do Vendedor', 'Valor Total': 12000 },
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_importacao_vendas.xlsx');
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const entries: ImportEntry[] = jsonData.map((row: any) => {
          const year = parseInt(row['Ano'] || row['ano'] || row['Year']);
          const monthName = (row['Mês'] || row['mes'] || row['Month'] || '').toString().toLowerCase();
          const month = MONTHS.findIndex(m => m.toLowerCase() === monthName);
          const salesperson_name = row['Vendedor'] || row['vendedor'] || row['Salesperson'] || '';
          const amount = parseFloat(row['Valor Total'] || row['valor_total'] || row['Amount'] || 0);

          // Try to match salesperson
          const matchedMember = team.find(m => 
            m.name.toLowerCase().trim() === salesperson_name.toLowerCase().trim()
          );

          const isValid = !isNaN(year) && month >= 0 && month < 12 && salesperson_name && !isNaN(amount) && amount > 0;
          
          return {
            year,
            month,
            salesperson_name,
            salesperson_id: matchedMember?.id,
            amount,
            isValid,
            error: !isValid ? 'Dados inválidos ou vendedor não encontrado' : 
                   !matchedMember ? 'Vendedor não encontrado na equipe' : undefined,
          };
        });

        if (entries.length === 0) {
          setUploadError('Nenhum dado encontrado na planilha. Verifique o formato.');
        } else {
          setImportedData(entries);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setUploadError('Erro ao ler o arquivo. Verifique se é uma planilha válida.');
      }
    };
    
    reader.readAsBinaryString(file);
  }, [team]);

  const generateManualEntries = useCallback(() => {
    const entries: ImportEntry[] = [];
    
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 0;
      const mEnd = y === endYear ? endMonth : 11;
      
      for (let m = mStart; m <= mEnd; m++) {
        team.forEach(member => {
          entries.push({
            year: y,
            month: m,
            salesperson_name: member.name,
            salesperson_id: member.id,
            amount: 0,
            isValid: true,
          });
        });
      }
    }
    
    setImportedData(entries);
  }, [startYear, endYear, startMonth, endMonth, team]);

  const updateEntryAmount = (index: number, amount: number) => {
    setImportedData(prev => prev.map((entry, i) => 
      i === index ? { ...entry, amount, isValid: amount > 0 } : entry
    ));
  };

  const removeEntry = (index: number) => {
    setImportedData(prev => prev.filter((_, i) => i !== index));
  };

  const validEntries = useMemo(() => 
    importedData.filter(e => e.isValid && e.amount > 0 && e.salesperson_id),
    [importedData]
  );

  const totalAmount = useMemo(() => 
    validEntries.reduce((sum, e) => sum + e.amount, 0),
    [validEntries]
  );

  const handleSubmit = async () => {
    const salesToCreate = validEntries.map(entry => ({
      salesperson_id: entry.salesperson_id!,
      salesperson_name: entry.salesperson_name,
      amount: entry.amount,
      sale_date: format(startOfMonth(new Date(entry.year, entry.month)), 'yyyy-MM-dd'),
      entry_type: 'import' as EntryType,
    }));

    await onSubmit(salesToCreate);
    
    // Reset wizard
    setStep(1);
    setImportedData([]);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const canProceedStep1 = startYear <= endYear && (startYear < endYear || startMonth <= endMonth);
  const canProceedStep2 = importedData.length > 0 && validEntries.length > 0;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, index) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step > s.id ? 'bg-emerald-500 text-white' :
                step === s.id ? 'bg-primary text-primary-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                {step > s.id ? <CheckCircle size={20} /> : s.id}
              </div>
              <div className="hidden md:block">
                <p className={`text-sm font-medium ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? 'bg-emerald-500' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Period Selection */}
      {step === 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Selecione o Período para Importação</CardTitle>
            <CardDescription>
              Escolha o intervalo de datas e o método de entrada dos dados históricos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Período Inicial</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={startMonth.toString()} onValueChange={(v) => setStartMonth(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startYear.toString()} onValueChange={(v) => setStartYear(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Período Final</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={endMonth.toString()} onValueChange={(v) => setEndMonth(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={endYear.toString()} onValueChange={(v) => setEndYear(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Método de Importação</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    importMethod === 'upload' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setImportMethod('upload')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileSpreadsheet className="text-primary" size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Upload de Planilha</h4>
                        <p className="text-sm text-muted-foreground">
                          Importe dados de uma planilha Excel ou CSV
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    importMethod === 'manual' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setImportMethod('manual')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <TableIcon className="text-primary" size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Entrada Manual</h4>
                        <p className="text-sm text-muted-foreground">
                          Digite os valores mensais por vendedor
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  if (importMethod === 'manual') {
                    generateManualEntries();
                  }
                  setStep(2);
                }}
                disabled={!canProceedStep1}
              >
                Próximo <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data Entry */}
      {step === 2 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {importMethod === 'upload' ? (
                <>
                  <Upload size={20} className="text-primary" />
                  Upload de Planilha
                </>
              ) : (
                <>
                  <TableIcon size={20} className="text-primary" />
                  Entrada Manual de Dados
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {importMethod === 'upload' && (
              <>
                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription>
                    A planilha deve conter as colunas: <strong>Ano</strong>, <strong>Mês</strong>, <strong>Vendedor</strong> e <strong>Valor Total</strong>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-border rounded-xl">
                  <div className="p-4 rounded-full bg-muted">
                    <Upload size={32} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Arraste sua planilha aqui ou</p>
                    <p className="text-sm text-muted-foreground">clique para selecionar</p>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download size={16} className="mr-2" />
                    Baixar Template
                  </Button>
                </div>

                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {importedData.length > 0 && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Ano</TableHead>
                      <TableHead>Mês</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.map((entry, index) => (
                      <TableRow key={index} className={!entry.isValid || !entry.salesperson_id ? 'bg-destructive/5' : ''}>
                        <TableCell>{entry.year}</TableCell>
                        <TableCell>{MONTHS[entry.month] || 'Inválido'}</TableCell>
                        <TableCell>
                          {entry.salesperson_name}
                          {!entry.salesperson_id && (
                            <span className="text-xs text-amber-500 block">Não mapeado</span>
                          )}
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-32 text-right"
                            value={entry.amount || ''}
                            onChange={(e) => updateEntryAmount(index, parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          {entry.isValid && entry.salesperson_id && entry.amount > 0 ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <CheckCircle size={14} /> OK
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1">
                              <AlertCircle size={14} /> {entry.error || 'Valor zerado'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeEntry(index)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2" size={16} /> Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Próximo <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-500" />
              Revisão e Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{validEntries.length}</p>
                  <p className="text-sm text-muted-foreground">Registros válidos</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-emerald-500">{formatCurrency(totalAmount)}</p>
                  <p className="text-sm text-muted-foreground">Valor total</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{new Set(validEntries.map(e => `${e.year}-${e.month}`)).size}</p>
                  <p className="text-sm text-muted-foreground">Meses cobertos</p>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                Esta ação criará <strong>{validEntries.length} registros</strong> de vendas no sistema. 
                Os registros serão marcados como "Importação" para diferenciá-los das vendas individuais.
              </AlertDescription>
            </Alert>

            {isSubmitting && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">Importando dados...</p>
                <Progress value={50} className="w-full" />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                <ArrowLeft className="mr-2" size={16} /> Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesImportWizard;
