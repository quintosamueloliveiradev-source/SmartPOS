import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../context/StoreContext';
import { LogIn, UserPlus, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
        <div className="bg-primary p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold">SmartPOS SaaS</h2>
          <p className="text-emerald-50 opacity-90">Gestão inteligente para o seu negócio</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2
                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-emerald-600 active:scale-[0.98]'}
              `}
            >
              {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-500 hover:text-primary transition-colors text-center font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Cadastre-se por R$ 14,90/mês'}
            </button>

            <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 text-blue-700 text-sm">
              <Info size={18} className="shrink-0 mt-0.5" />
              <p>O primeiro acesso cria um período de <b>7 dias de teste grátis</b>. Após isso, a assinatura é necessária.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
