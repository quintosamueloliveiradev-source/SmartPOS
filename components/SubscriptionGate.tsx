import React, { useState } from 'react';
import { CreditCard, ShieldAlert, CheckCircle, Smartphone, ExternalLink, Code, Terminal, Clock, Star, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

export const SubscriptionGate: React.FC = () => {
  const { profile, addToast, signOut } = useStore();
  const [showIntegrationsGuide, setShowIntegrationsGuide] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Simulação de pagamento imediato para fins de testes do MVP
  const simulatePayment = async () => {
    if (!profile) return;
    setLoadingPayment(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      addToast('Sucesso! Assinatura ativada por 30 dias (Modo Simulado).', 'success');
      window.location.reload();
    } catch (err) {
      addToast('Erro ao processar pagamento simulado', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-12">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Esquerda: Informações & Recursos */}
        <div className="p-8 md:p-12 bg-slate-900 text-white flex-1 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Clock size={12} />
              Período de Teste Encerrado
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Seus 7 dias gratuitos <span className="text-emerald-400">chegaram ao fim</span>
            </h2>
            
            <p className="text-slate-400 mb-8 text-sm lg:text-base leading-relaxed">
              Obrigado por usar o SmartPOS para gerenciar seu negócio! Seu período de demonstração gratuita expirou. Escolha um plano para ativar o acesso total.
            </p>
            
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Recursos Inclusos na Assinatura:</p>
              <ul className="space-y-3.5">
                {[
                  { title: 'Controle de Estoque Inteligente', desc: 'Alertas de falta e cálculo automático de custos e margem de lucro.' },
                  { title: 'Ponto de Venda (PDV) Rápido', desc: 'Fluxo ágil de vendas, carrinho persistente e suporte a leitor de código de barras.' },
                  { title: 'Histórico Completo & Estornos', desc: 'Gere cupons térmicos (58mm) e relatórios formatados em PDF A4.' },
                  { title: 'Painel Financeiro Detalhado', desc: 'Estatísticas de receita e margem de lucro com gráficos refinados.' }
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{feature.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between">
            <button 
              onClick={signOut}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              ← Desconectar minha conta
            </button>
            <button 
              onClick={() => setShowIntegrationsGuide(!showIntegrationsGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Code size={14} />
              {showIntegrationsGuide ? 'Ocultar Guia da API' : 'Ver Guia da API / Webhook'}
            </button>
          </div>
        </div>

        {/* Direita: Checkout */}
        <div className="p-8 md:p-12 w-full md:w-[380px] bg-white text-slate-950 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
          <div className="text-center mb-8">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Plano Profissional Completo</span>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-sm font-bold text-slate-400">R$</span>
              <span className="text-5xl font-black text-slate-900 tracking-tight">14,90</span>
              <span className="text-sm font-bold text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Sem fidelidade, cancele a qualquer momento</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={simulatePayment}
              disabled={loadingPayment}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <CreditCard size={18} className="group-hover:translate-x-0.5 transition-transform" />
              {loadingPayment ? 'Ativando...' : 'Assinar Agora (Simulado)'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Ou use o PIX</span>
              </div>
            </div>

            <button 
              onClick={simulatePayment}
              className="w-full py-3.5 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone size={16} className="text-emerald-600" />
              Pagar com PIX Imediato (R$ 14,90)
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mt-8 flex gap-3">
            <div className="text-yellow-600 mt-0.5 shrink-0"><Star size={16} fill="currentColor" /></div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              <strong>Modo de Demonstração:</strong> Atualmente o sistema roda de forma integrada ao Supabase do cliente. Clique nos botões acima para simular o recebimento de pagamento real e prosseguir para usar o painel do PDV imediatamente.
            </p>
          </div>

          <p className="mt-8 text-[10px] text-slate-400 text-center leading-relaxed font-bold uppercase tracking-wide">
            SmartPOS © 2026 • GESTÃO INTELIGENTE MVP
          </p>
        </div>

      </div>

      {/* Caixa de Guia de Integração na API de Pagamento (Developer Mode) */}
      {showIntegrationsGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="max-w-3xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowIntegrationsGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-800 transition-colors text-xs font-bold"
            >
              Fechar Guia
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Guia de Integração Stripe & Asaas</h3>
                <p className="text-xs text-slate-400">Instruções e Boilerplates prontos de checkout e tratamento de Webhooks</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar font-sans text-sm text-slate-300">
              
              {/* Seção Stripe */}
              <div className="space-y-2 border-l-2 border-indigo-500 pl-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Opção A: Gateway Stripe
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para criar um checkout seguro na Stripe e tratar o webhook de retorno de forma automática:
                </p>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed">
{`// 1. Criar Checkout Session (Backend / Supabase Edge Function)
import Stripe from 'stripe';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

async function handleCheckout(userId, userEmail) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Assinatura Mensal SmartPOS' },
        unit_amount: 1490, // R$ 14,90
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    mode: 'subscription',
    client_reference_id: userId,
    customer_email: userEmail,
    success_url: 'https://seusite.com/dashboard?payment=success',
    cancel_url: 'https://seusite.com/dashboard?payment=fail',
  });
  return session.url; // Redirecionar cliente para esta URL!
}`}
                </pre>
              </div>

              {/* Seção Asaas */}
              <div className="space-y-2 border-l-2 border-emerald-500 pl-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Opção B: Gateway ASAAS (Ideal para PIX e Cartão no Brasil)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Criando a cobrança na API do Asaas diretamente:
                </p>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed">
{`// 2. Criando Assinatura no Asaas (POST /v3/subscriptions)
const rawResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
  method: 'POST',
  headers: {
    'access_token': '$YOUR_ASAAS_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer: 'cus_xxxxxx', // ID do cliente criado previamente
    billingType: 'UNDEFINED', // Permite Cartão ou PIX
    value: 14.90,
    nextDueDate: '2026-07-18',
    cycle: 'MONTHLY',
    description: 'Assinatura SmartPOS'
  })
});`}
                </pre>
              </div>

              {/* Seção Webhook Handler */}
              <div className="space-y-2 border-l-2 border-amber-500 pl-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Manipulando Webhook de Entrada
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Endpoint para receber o webhook do gateway e atualizar o status do usuário no banco:
                </p>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed">
{`// 3. Exemplo de Webhook (Supabase Edge Function ou Endpoint Express)
app.post('/api/webhooks/payment', async (req, res) => {
  const event = req.body;
  
  // No caso da Stripe: 'checkout.session.completed' ou 'invoice.paid'
  // No caso do Asaas: 'PAYMENT_RECEIVED' ou 'PAYMENT_CONFIRMED'
  if (event.type === 'invoice.paid' || event.event === 'PAYMENT_CONFIRMED') {
    const customerId = event.data.object.customer || event.payment.customerId;
    const email = event.data.object.customer_email || event.payment.customerEmail;
    
    // Buscar usuário associado ao e-mail ou customerId
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      // Registrar 30 dias de acesso
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          // Armazenar o id do gateway no perfil
          stripe_customer_id: customerId, 
          // Prorroga 30 dias da data de hoje
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', profile.id);
        
      console.log('Assinatura ativada para o usuário:', profile.id);
    }
  }
  return res.status(200).send({ received: true });
});`}
                </pre>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Você pode criar uma Supabase Edge Function rodando <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-indigo-400">deno</code> para automatizar essa lógica com segurança absoluta!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
