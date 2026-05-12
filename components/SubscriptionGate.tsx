import React from 'react';
import { CreditCard, ShieldAlert, CheckCircle, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

export const SubscriptionGate: React.FC = () => {
  const { profile, addToast, signOut } = useStore();

  const simulatePayment = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      addToast('Pagamento confirmado! Aproveite o SmartPOS.', 'success');
      window.location.reload();
    } catch (err) {
      addToast('Erro ao processar pagamento simulado', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 bg-primary text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Assinatura Necessária</h2>
              <p className="text-emerald-50 mb-8 opacity-90 leading-relaxed">
                Seu período de teste expirou ou sua assinatura está inativa. Continue gerindo seu negócio com o melhor PDV.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Estoque Ilimitado',
                  'Relatórios Detalhados',
                  'Suporte Prioritário',
                  'Multi-dispositivo'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <CheckCircle size={18} className="text-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={signOut}
              className="mt-12 text-sm text-white/70 hover:text-white transition-colors"
            >
              Sair da conta
            </button>
          </div>

          <div className="p-8 flex flex-col justify-center text-center">
            <div className="mb-8">
              <span className="text-slate-500 text-sm font-medium">Plano Mensal</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-bold text-slate-400">R$</span>
                <span className="text-5xl font-black text-slate-900 tracking-tight">14,90</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={simulatePayment}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
              >
                <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                Assinar Agora (Simulado)
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Ou use o PIX</span></div>
              </div>

              <button className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Pagar com PIX
              </button>
            </div>

            <p className="mt-8 text-xs text-slate-400 leading-relaxed">
              Ao assinar, você concorda com nossos Termos de Uso. 
              Cobrança recorrente mensal. Cancele quando quiser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
