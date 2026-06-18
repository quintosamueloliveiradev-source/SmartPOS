import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  Star 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

// Controle visual para Produção - quando true, esconde botões/mensagens de simulação/debug
const isProduction = true;

// Helper for dynamic formatting: CPF / CNPJ 
const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

// Real CPF validation
const isValidCPF = (cpf: string): boolean => {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

// Real CNPJ validation
const isValidCNPJ = (cnpj: string): boolean => {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({ isOpen, onClose }) => {
  const { profile, addToast } = useStore();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initial' | 'pix_details' | 'success'>('initial');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [copiaCola, setCopiaCola] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [pollingErrorCount, setPollingErrorCount] = useState(0);

  // Polling hook
  useEffect(() => {
    let intervalId: any;

    if (pollingActive && paymentId && isOpen) {
       intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/asaas/check-payment/${paymentId}`);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro de validação:', errorText);
            throw new Error(`Falha ao comunicar com o servidor (${response.status})`);
          }
          
          const data = await response.json();
          if (data.success && (data.status === 'CONFIRMED' || data.status === 'RECEIVED')) {
            setPollingActive(false);
            clearInterval(intervalId);
            
            // Ativa 30 dias de acesso no Supabase
            const { error } = await supabase
              .from('profiles')
              .update({ 
                subscription_status: 'active',
                subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
               })
              .eq('id', profile!.id);

            if (error) throw error;
            
            addToast('Pagamento confirmado com sucesso!', 'success');
            setPaymentStep('success');
            
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        } catch (err) {
          console.error('Erro ao verificar pagamento:', err);
          setPollingErrorCount(prev => prev + 1);
          if (pollingErrorCount > 15) {
            setPollingActive(false);
            addToast('Poller inativo devido a erros consecutivos.', 'error');
          }
        }
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, paymentId, profile, addToast, pollingErrorCount, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const rawCpfCnpj = cpfCnpj.replace(/\D/g, '');
    if (rawCpfCnpj.length === 11) {
      if (!isValidCPF(rawCpfCnpj)) {
        addToast('CPF inválido. Verifique os dígitos.', 'error');
        return;
      }
    } else if (rawCpfCnpj.length === 14) {
      if (!isValidCNPJ(rawCpfCnpj)) {
        addToast('CNPJ inválido. Verifique os dígitos.', 'error');
        return;
      }
    } else {
      addToast('Digite um CPF ou CNPJ válido.', 'error');
      return;
    }

    setLoadingPayment(true);
    try {
      addToast('Conectando ao gateway Asaas Sandbox...', 'info');
      
      const response = await fetch('/api/asaas/create-pix', {
        method: 'POST',
         headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.store_name || 'Assinante SmartPOS',
          email: profile.email,
          cpfCnpj: rawCpfCnpj,
          userId: profile.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no servidor (${response.status}): ${errorText.substring(0, 150)}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro inesperado.');
      }

      setPaymentId(data.paymentId);
      setQrCodeBase64(data.encodedImage);
      setCopiaCola(data.payload);
      setIsSimulated(!!data.simulated);
      setPaymentStep('pix_details');
      setPollingActive(true);
      
      if (data.simulated) {
        addToast('Modo demonstração/Simulado ativo!', 'success');
      } else {
        addToast('Cobrança emitida com sucesso no Asaas Sandbox!', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Falha ao integrar com Pix.', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCopyCode = () => {
    if (!copiaCola) return;
    navigator.clipboard.writeText(copiaCola);
    setCopied(true);
    addToast('Chave Copia e Cola copiada!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePaymentApproval = async () => {
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
      addToast('Assinatura liberada no modo de teste!', 'success');
      setPaymentStep('success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      addToast('Erro ao simular liberação', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-[#e5eeff] overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5eeff] flex items-center justify-between bg-[#f8f9ff]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <p className="text-sm font-bold text-[#0b1c30]">Assinatura SmartPOS Mensal</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#e5eeff] rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          {paymentStep === 'initial' && (
            <div className="space-y-5">
              <div className="text-center bg-[#f8f9ff] border border-[#e5eeff] p-5 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Assinatura Mensal</span>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-extrabold text-[#0b1c30] tracking-tight">14,90</span>
                  <span className="text-sm font-bold text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Acesso completo sem anúncios ou taxas extras.</p>
              </div>

              <form onSubmit={handleGeneratePix} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    CPF ou CNPJ do Pagador *
                  </label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setCpfCnpj(formatCpfCnpj(digitsOnly));
                    }}
                    required
                    maxLength={18}
                    className="w-full px-4 py-2.5 bg-white border border-[#e5eeff] focus:border-[#3525cd] rounded-lg text-sm font-semibold transition-all outline-none text-[#0b1c30] placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    * Requerido pela regulamentação do Banco Central para emissão de Pix nominal.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button 
                    type="submit"
                    disabled={loadingPayment}
                    className="w-full py-3 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-lg font-bold text-sm shadow-md shadow-indigo-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingPayment ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Gerando Pix...
                      </>
                    ) : (
                      <>
                        <Smartphone size={14} />
                        Pagar com PIX Imediato 
                      </>
                    )}
                  </button>

                  {!isProduction && (
                    <button 
                      type="button"
                      onClick={handleSimulatePaymentApproval}
                      className="w-full py-2 bg-[#f8f9ff] hover:bg-[#e5eeff] text-slate-600 border border-[#e5eeff] rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      Ativar Modo de Demonstração (Simulado)
                    </button>
                  )}
                </div>
              </form>

              {!isProduction && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
                  <div className="text-amber-600 mt-0.5 shrink-0"><Star size={14} fill="currentColor" /></div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    <strong>Gateway Asaas Ativo:</strong> Se sua API Key estiver configurada, o PIX será gerado na Sandbox real com atualização por Polling.
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentStep === 'pix_details' && (
            <div className="space-y-5 text-center animate-fade-in">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#3525cd] bg-[#f8f9ff] px-2.5 py-1 rounded-full border border-[#e5eeff]">
                  Aguardando Confirmação Pix
                </span>
                <p className="text-xs font-semibold text-slate-600 mt-3">Escaneie o QR Code abaixo no seu aplicativo bancário:</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="relative p-3 bg-[#f8f9ff] border border-[#e5eeff] rounded-xl mb-3">
                  {qrCodeBase64 ? (
                    <img 
                      src={`data:image/png;base64,${qrCodeBase64}`} 
                      alt="Asaas QR Code" 
                      className="w-40 h-40 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-lg animate-pulse text-slate-400 text-xs font-medium">
                      Buscando QR Code...
                    </div>
                  )}
                  {isSimulated && !isProduction && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded shadow-xs">
                      MOCK ACTIVE
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-center font-medium">
                  <RefreshCw size={12} className="animate-spin text-secondary" />
                  <span>Sincronizando com Asaas em tempo real...</span>
                </div>
              </div>

              {/* Copy / Paste */}
              <div className="bg-[#f8f9ff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center justify-between gap-2 text-left">
                <div className="max-w-[200px] overflow-hidden">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pix Copia e Cola</p>
                  <p className="text-[10px] font-mono font-bold text-[#0b1c30] truncate mt-0.5">{copiaCola || 'PIX_PAYLOAD'}</p>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] transition-all active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-200 text-[#006c49]' 
                      : 'bg-white border-[#e5eeff] text-slate-650 hover:bg-[#f8f9ff]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={11} className="text-[#006c49]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-[#e5eeff]">
                {!isProduction && (
                  <button 
                    onClick={handleSimulatePaymentApproval}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1 mb-1.5"
                  >
                    <CheckCircle size={12} />
                    Simular Confirmação
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPollingActive(false);
                    setPaymentStep('initial');
                  }}
                  className="w-full py-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold transition-colors"
                >
                  ← Voltar e alterar documento
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-6 space-y-4 animate-fade-in flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-emerald-50 text-secondary border border-emerald-100 rounded-xl flex items-center justify-center animate-bounce">
                <CheckCircle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0b1c30] tracking-tight">Assinatura Ativada!</h3>
                <p className="text-slate-500 text-[11px] mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                  Perfeito! O Asaas processou sua transação com sucesso. Sua licença foi ativada por mais 30 dias.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-widest animate-pulse pt-2">
                <RefreshCw size={10} className="animate-spin" />
                Recarregando sistema...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
