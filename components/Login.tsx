import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../context/StoreContext';
import { LogIn, UserPlus, Info, BarChart3, Store, ShieldCheck, Mail, Lock, Eye, EyeOff, Check, ArrowRight, Loader2, LogOut, LayoutDashboard, ShoppingCart, Package } from 'lucide-react';
import { motion, animate } from 'motion/react';

const AnimatedCounter = ({ from, to, duration = 2, isCurrency = false, prefix = '', suffix = '', decimals = 0 }: { from: number, to: number, duration?: number, isCurrency?: boolean, prefix?: string, suffix?: string, decimals?: number }) => {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [from, to, duration]);

  if (isCurrency) {
    return (
      <span>
        {prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
      </span>
    );
  }
  return <span>{prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              store_name: 'Minha Loja'
            }
          }
        });
        if (error) throw error;
        addToast('Conta criada! Verifique seu e-mail (se habilitado) ou tente entrar.', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast('Bem-vindo de volta!', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Erro na autenticação', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden font-sans text-slate-800">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-emerald-100/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

      {/* LEFT COLUMN - Marketing (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] p-12 xl:p-24 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-3 mb-16"
        >
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-md shadow-emerald-500/20">
            <LogIn className="text-white" size={24} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">SmartPOS SaaS</span>
        </motion.div>

        <div className="max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl xl:text-6xl font-black text-slate-800 leading-[1.1] mb-8 tracking-tight"
          >
            Gestão inteligente<br />
            <span className="text-emerald-500">para o seu negócio</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-slate-500 text-lg xl:text-xl font-medium mb-12 max-w-lg leading-relaxed"
          >
            Sistema completo para gestão de PDV, estoque, vendas e relatórios. 
            Tudo o que você precisa em um só lugar.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-8"
          >
            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <BarChart3 size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Relatórios Inteligentes</h3>
                <p className="text-slate-500 font-medium leading-snug">Dados em tempo real para decisões <br className="hidden xl:block"/> mais assertivas</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <Store size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Gestão Completa</h3>
                <p className="text-slate-500 font-medium leading-snug">Controle de vendas, estoque, clientes <br className="hidden xl:block"/> e muito mais</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <ShieldCheck size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Seguro e Confiável</h3>
                <p className="text-slate-500 font-medium leading-snug">Seus dados protegidos com as melhores <br className="hidden xl:block"/> práticas de segurança</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -8, y: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, rotate: -4, y: 0, filter: "blur(0px)" }}
            whileHover={{ rotate: -2, y: -5, scale: 1.02 }}
            transition={{ duration: 1, delay: 0.6, type: "spring", bounce: 0.3 }}
            className="mt-16 w-full max-w-[560px] h-[300px] bg-slate-50/90 rounded-[1.25rem] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] border border-white/50 flex overflow-hidden backdrop-blur-md origin-bottom-left relative z-20 cursor-default"
          >
            {/* Sidebar */}
            <div className="w-[72px] bg-[#0f3d2e] shrink-0 flex flex-col items-center py-6 gap-6 rounded-l-[1.25rem] border-r border-[#155440]">
              <div className="bg-emerald-500 rounded-xl p-2 text-white shadow-lg shadow-emerald-500/20"><LogIn size={20} /></div>
              <div className="w-6 h-px bg-white/20 mb-2"></div>
              <div className="bg-emerald-500 rounded-xl p-2 text-white shadow-lg shadow-emerald-500/20"><LayoutDashboard size={20} /></div>
              <div className="p-2 text-white/50 hover:text-white/80 transition-colors"><ShoppingCart size={20} /></div>
              <div className="p-2 text-white/50 hover:text-white/80 transition-colors"><Package size={20} /></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 bg-white/60 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm">
              {/* Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Vendas hoje</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={12540} duration={3} isCurrency={true} prefix="R$ " />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={12.5} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Pedidos</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={156} duration={3} />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={8.2} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Ticket médio</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={85.20} duration={3} isCurrency={true} prefix="R$ " />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={5.7} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 relative overflow-hidden flex items-end pb-0">
                {/* SVG Graph */}
                <svg className="w-full h-full absolute inset-x-0 bottom-0 preserve-aspect-ratio-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill */}
                  <motion.path 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    d="M0,35 L5,32 L15,22 L20,25 L25,23 L35,28 L40,24 L50,26 L60,18 L68,22 L75,17 L85,6 L95,12 L100,8 L100,40 L0,40 Z" fill="url(#chart-grad)"
                  />
                  
                  {/* Stroke animated */}
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.8 }}
                    d="M0,35 L5,32 L15,22 L20,25 L25,23 L35,28 L40,24 L50,26 L60,18 L68,22 L75,17 L85,6 L95,12 L100,8" 
                    fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" 
                  />
                </svg>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* RIGHT COLUMN - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Only show logo on mobile, hidden on desktop since it's on the left */}
        <div className="lg:hidden flex items-center gap-2 mb-10 w-full max-w-md">
          <div className="bg-emerald-500 rounded-xl p-2 w-10 h-10 flex items-center justify-center shadow-md">
            <LogIn className="text-white" size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">SmartPOS</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100/60 p-8 sm:p-12"
        >
          {/* Logo inside card (optional, mimicking the design image) */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500 rounded-[1.25rem] p-4 shadow-lg shadow-emerald-500/20">
              <LogIn className="text-white" size={32} />
            </div>
          </div>
          
          <div className="text-center mb-8">
             <h2 className="text-[1.75rem] font-black text-slate-800 tracking-tight leading-none mb-3">SmartPOS SaaS</h2>
             <p className="text-slate-500 font-medium">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans tracking-wide"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded group-hover:border-emerald-500 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all flex items-center justify-center">
                    <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600 select-none">Lembrar de mim</span>
              </label>

              <button type="button" className="text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors">
                Esqueci minha senha
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-2 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 group
                ${loading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] shadow-emerald-500/25 hover:shadow-emerald-500/40'}
              `}
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : (isSignUp ? 'Criar Conta' : 'Entrar no Sistema')}
              {!loading && !isSignUp && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              {!loading && isSignUp && <UserPlus size={20} />}
            </button>

            <div className="relative flex items-center gap-4 my-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">ou</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button 
              type="button" 
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-[18px] h-[18px]" />
              Entrar com Google
            </button>

            <div className="text-center pt-2">
              <p className="text-[15px] font-medium text-slate-600">
                {isSignUp ? 'Já tem uma conta?' : 'Não tem conta?'}{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-emerald-500 font-bold hover:text-emerald-600 transition-colors"
                >
                  {isSignUp ? 'Entre agora' : 'Cadastre-se por R$ 14,90/mês'}
                </button>
              </p>
            </div>

          </form>
        </motion.div>

        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 max-w-[460px] w-full bg-[#f0f4f8] border border-slate-200/60 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm shadow-sm"
        >
          <Info size={20} className="shrink-0 mt-0.5 text-blue-600" />
          <p className="leading-relaxed">O primeiro acesso cria um período de <span className="font-bold">7 dias de teste grátis</span>. Após isso, a assinatura é necessária.</p>
        </motion.div>

        {/* Footer Text */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-slate-400 text-[13px] font-medium tracking-wide"
        >
          © 2024 SmartPOS SaaS. Todos os direitos reservados.
        </motion.div>

      </div>
    </div>
  );
};

