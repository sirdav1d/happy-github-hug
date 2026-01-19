import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Users,
  RefreshCw,
} from "lucide-react";
import { useTestUserManagement } from "@/hooks/useTestUserManagement";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TestUser {
  id: string;
  test_user_id: string;
  test_user_email: string;
  created_at: string;
}

export function TestUserManagement() {
  const { createTestUser, deleteTestUser, isCreating, isDeleting, lastDeleteResult } = useTestUserManagement();
  
  // Test users list
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Create form state
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<{ email: string; password: string } | null>(null);
  
  // Delete form state
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const fetchTestUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("test_users_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching test users:", error);
      } else {
        setTestUsers(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchTestUsers();
  }, []);

  const handleCreate = async () => {
    if (!createEmail || !createPassword) return;
    
    const result = await createTestUser(createEmail, createPassword);
    if (result?.success) {
      setCreateSuccess({ email: createEmail, password: createPassword });
      setCreateEmail("");
      setCreatePassword("");
      // Refresh list
      fetchTestUsers();
    }
  };

  const handleDelete = async () => {
    if (!deleteEmail || confirmEmail !== deleteEmail) return;
    
    await deleteTestUser(deleteEmail);
    setShowDeleteConfirm(false);
    setConfirmEmail("");
    setDeleteEmail("");
    // Refresh list
    fetchTestUsers();
  };

  const handleDeleteFromList = (email: string) => {
    setDeleteEmail(email);
    setShowDeleteConfirm(true);
  };

  const formatTableName = (name: string) => {
    const names: Record<string, string> = {
      salesperson_events: "Eventos de Vendedores",
      pgv_entries: "Entradas PGV",
      rmr_preparation_status: "Status RMR",
      rmr_video_suggestions: "Sugestões de Vídeo",
      fivi_sessions: "Sessões FIVI",
      salespeople: "Vendedores",
      pgv_weeks: "Semanas PGV",
      rmr_meetings: "Reuniões RMR",
      sales: "Vendas",
      leads: "Leads",
      clients: "Clientes",
      annual_goals: "Metas Anuais",
      goal_rules: "Regras de Meta",
      premium_policies: "Políticas Premium",
      user_favorite_videos: "Vídeos Favoritos",
      notifications: "Notificações",
      mentorship_phases: "Fases de Mentoria",
      mentoring_sessions: "Sessões de Mentoria",
      dashboard_data: "Dados do Dashboard",
      activity_logs: "Logs de Atividade",
      profiles: "Perfil",
    };
    return names[name] || name;
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5 text-amber-500" />
          Gerenciamento de Usuários de Teste
        </CardTitle>
        <CardDescription>
          Crie e gerencie usuários de teste com acesso total para demonstração e testes do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários ({testUsers.length})
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="delete" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Usuários de teste criados por você
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTestUsers}
                disabled={isLoadingUsers}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : testUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário de teste criado ainda.</p>
                <p className="text-sm">Use a aba "Criar" para adicionar um novo usuário.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {testUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{user.test_user_email}</p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteFromList(user.test_user_email)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email do Usuário de Teste</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="teste@exemplo.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    disabled={isCreating}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <p className="font-medium text-foreground">O usuário criado terá:</p>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Role <Badge variant="secondary" className="ml-1">consultant</Badge></li>
                  <li>Acesso total a todas as funcionalidades</li>
                  <li>Email já confirmado automaticamente</li>
                </ul>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!createEmail || !createPassword || createPassword.length < 6 || isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Usuário de Teste
                  </>
                )}
              </Button>

              <AnimatePresence>
                {createSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">
                          Usuário criado com sucesso!
                        </p>
                        <div className="text-sm space-y-1">
                          <p><strong>Email:</strong> {createSuccess.email}</p>
                          <p><strong>Senha:</strong> {createSuccess.password}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCreateSuccess(null)}
                          className="text-xs"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Delete Tab */}
          <TabsContent value="delete" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-email">Email do Usuário a Excluir</Label>
                <Input
                  id="delete-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  disabled={isDeleting}
                />
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-destructive">
                      Esta ação é irreversível!
                    </p>
                    <p className="text-muted-foreground">
                      Todos os dados do usuário serão permanentemente removidos:
                    </p>
                    <ul className="text-muted-foreground text-xs grid grid-cols-2 gap-1 ml-4 list-disc">
                      <li>Perfil e login</li>
                      <li>Vendas e leads</li>
                      <li>Equipe de vendedores</li>
                      <li>Reuniões RMR</li>
                      <li>Sessões FIVI</li>
                      <li>Metas e regras</li>
                      <li>Dados de PGV</li>
                      <li>Dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!deleteEmail || isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Usuário e Todos os Dados
                  </>
                )}
              </Button>

              <AnimatePresence>
                {lastDeleteResult?.success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">
                          Usuário excluído com sucesso!
                        </p>
                      </div>
                      
                      {lastDeleteResult.details?.counts && (
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-2">Registros removidos:</p>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(lastDeleteResult.details.counts)
                              .filter(([, count]) => count > 0)
                              .map(([table, count]) => (
                                <div key={table} className="flex justify-between bg-muted/50 px-2 py-1 rounded">
                                  <span>{formatTableName(table)}:</span>
                                  <Badge variant="secondary" className="ml-2">{count}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Você está prestes a excluir permanentemente o usuário{" "}
                    <strong className="text-foreground">{deleteEmail}</strong> e todos os seus dados.
                  </p>
                  <div className="space-y-2">
                    <Label>Digite o email para confirmar:</Label>
                    <Input
                      type="email"
                      placeholder={deleteEmail}
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmEmail("")}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmEmail !== deleteEmail}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
