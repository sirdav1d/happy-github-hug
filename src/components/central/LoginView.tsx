import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Lock, Mail, AlertTriangle, ScanFace, ChevronRight, Sparkles } from 'lucide-react';
import ParticleNetwork from './login/ParticleNetwork';
import FloatingOrbs from './login/FloatingOrbs';
import FloatingMetrics from './login/FloatingMetrics';

const LoginView = () => {
  const { signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const simulateLoadingSequence = async (callback: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    const stages = [
      { text: "CALIBRANDO REDE NEURAL...", progress: 25 },
      { text: "VALIDANDO HASH...", progress: 50 },
      { text: "SINCRONIZANDO BI...", progress: 75 },
      { text: "ACESSO PERMITIDO", progress: 100 }
    ];
    
    for (const stage of stages) {
      setLoadingStage(stage.text);
      setLoadingProgress(stage.progress);
      await new Promise(r => setTimeout(r, 400));
    }
    
    try {
      await callback();
    } catch (err: any) {
      let msg = "ACESSO NEGADO PELA REDE.";
      if (err.message?.includes('Invalid login')) msg = "CREDENCIAIS INVÁLIDAS.";
      else if (err.message?.includes('User already registered')) msg = "USUÁRIO JÁ CADASTRADO.";
      setError(msg);
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await simulateLoadingSequence(async () => {
      if (isRegistering) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-300 font-sans overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />
      <ParticleNetwork />
      <FloatingOrbs />
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center">
        <FloatingMetrics />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        <motion.div 
          className="text-center z-20 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo with glow */}
          <motion.div 
            className="relative mx-auto mb-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-36 h-36 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl relative overflow-hidden">
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="text-6xl font-black text-white relative z-10">CI</span>
            </div>
            {/* Glow behind logo */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full scale-150" />
          </motion.div>
          
          <motion.h2 
            className="text-5xl font-bold text-white mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Central Inteligente
          </motion.h2>
          
          <motion.p 
            className="text-slate-400 max-w-md text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Plataforma de Business Intelligence para mentorias e consultoria de vendas
          </motion.p>
          
          {/* Feature badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {['IA Avançada', 'Dashboards', 'Insights Preditivos'].map((feature, i) => (
              <span 
                key={feature}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm"
              >
                {feature}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 lg:p-16 relative z-30">
        {/* Glassmorphism card */}
        <motion.div 
          className="w-full max-w-md relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />
          
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-8 lg:p-10 shadow-2xl">
            {/* Mobile logo */}
            <motion.div 
              className="lg:hidden text-center mb-8"
              variants={itemVariants}
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg mb-4">
                <span className="text-3xl font-black text-white">CI</span>
              </div>
            </motion.div>

            {/* Status badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <Sparkles className="w-3 h-3" />
                Sistema v2.1 Online
              </div>
            </motion.div>
            
            {/* Title */}
            <motion.div className="mb-8" variants={itemVariants}>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isRegistering ? 'register' : 'login'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isRegistering ? 'Criar Conta' : 'Bem-vindo'}
                  </motion.span>
                </AnimatePresence>
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                {isRegistering ? 'Preencha os dados para começar' : 'Entre para acessar sua central'}
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start gap-3 overflow-hidden"
                  >
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-red-300 font-mono">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="space-y-4" variants={itemVariants}>
                {/* Email field */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300" />
                    </div>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-800/80 transition-all duration-300 font-medium text-sm"
                      placeholder="seu.email@empresa.com"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300" />
                    </div>
                    <input
                      type="password"
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-800/80 transition-all duration-300 font-medium text-sm"
                      placeholder="••••••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-500 relative overflow-hidden group
                    ${loading 
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-[1.02]'
                    }
                  `}
                >
                  {/* Animated background for button */}
                  {!loading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  )}
                  
                  {/* Loading progress bar */}
                  {loading && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-indigo-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <ScanFace className="animate-pulse" size={18} />
                        <span className="font-mono text-xs">{loadingStage}</span>
                      </>
                    ) : (
                      <>
                        {isRegistering ? 'CRIAR CONTA' : 'INICIAR SESSÃO'}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            {/* Toggle login/register */}
            <motion.div className="text-center pt-6" variants={itemVariants}>
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto group"
              >
                {isRegistering ? (
                  <>
                    <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Voltar para Login
                  </>
                ) : (
                  <>
                    Não tem conta?
                    <span className="text-cyan-400 font-semibold group-hover:underline underline-offset-2">
                      Criar agora
                    </span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Bottom text */}
        <motion.p 
          className="text-slate-600 text-xs mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          © 2025 Central Inteligente • Todos os direitos reservados
        </motion.p>
      </div>
    </div>
  );
};

export default LoginView;
