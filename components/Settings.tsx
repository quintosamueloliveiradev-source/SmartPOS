
import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  X, 
  Lock, 
  Shield, 
  Key, 
  Receipt, 
  CreditCard, 
  ExternalLink, 
  Calendar, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { products, sales, importData, resetSystem, updateAdminPassword, isDefaultPassword, profile, addToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modalType, setModalType] = useState<'restore' | 'reset' | 'reset-initial' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingFileContent, setPendingFileContent] = useState<any>(null);
  const [error, setError] = useState('');

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdMessage, setPwdMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Estados do histórico de faturas
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!profile?.id) return;
      setLoadingPayments(true);
      try {
        const response = await fetch(`/api/asaas/payments/${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPayments(data.payments || []);
          }
        }
      } catch (err) {
        console.error("Erro ao obter cobranças:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [profile?.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED':
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-black uppercase rounded-full tracking-wide">PAGO</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-black uppercase rounded-full tracking-wide">AGUARDANDO PAGAMENTO</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black uppercase rounded-full tracking-wide">VENCIDO</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-150 text-[10px] font-black uppercase rounded-full tracking-wide">{status || 'PENDENTE'}</span>;
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    if (type?.toUpperCase() === 'PIX') return 'Pix Imediato';
    if (type?.toUpperCase() === 'CREDIT_CARD') return 'Cartão de Crédito';
    if (type?.toUpperCase() === 'BOLETO') return 'Boleto Bancário';
    return type || 'Pix';
  };

  const handleExportBackup = () => {
    const data = { timestamp: Date.now(), version: 1, products, sales };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartpos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.products || !parsed.sales) throw new Error("Inválido");
        setPendingFileContent(parsed);
        setModalType('restore');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Erro no backup."); }
    };
    reader.readAsText(file);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (modalType === 'restore') {
      const { importData } = useStore() as any; 
      if (await importData(pendingFileContent, password)) closeModal();
      else setError('Senha incorreta ou erro técnico.');
    } else if (modalType === 'reset') {
      if (await resetSystem(password)) closeModal();
      else setError('Senha incorreta.');
    } else if (modalType === 'reset-initial') {
      if (password.length < 4) { setError('Mínimo 4 caracteres.'); return; }
      if (password !== confirmPassword) { setError('Senhas não conferem.'); return; }
      if (await resetSystem('admin') && await updateAdminPassword('admin', password)) closeModal();
      else setError('Erro crítico.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    if (pwdForm.new.length < 4) { setPwdMessage({ type: 'error', text: 'Mínimo 4 caracteres.' }); return; }
    if (pwdForm.new !== pwdForm.confirm) { setPwdMessage({ type: 'error', text: 'Confirmação não confere.' }); return; }
    if (await updateAdminPassword(pwdForm.current, pwdForm.new)) {
      setPwdMessage({ type: 'success', text: 'Senha alterada no Supabase!' });
      setPwdForm({ current: '', new: '', confirm: '' });
    } else setPwdMessage({ type: 'error', text: 'Senha atual incorreta.' });
  };

  const closeModal = () => {
    setModalType(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setPendingFileContent(null);
  };

  const isDanger = modalType === 'reset' || modalType === 'reset-initial';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 lg:p-8 rounded-smart border border-neutral-border shadow-sm">
        <div>
          <h2 className="text-xl font-black text-neutral-text">Configurações do Sistema</h2>
          <p className="text-neutral-muted text-sm mt-1">Gerencie segurança, faturamentos, integridade de dados e backups locais.</p>
        </div>
      </header>

      <div className="grid gap-6">
        {/* Minha Assinatura & Histórico de Faturas */}
        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-brand rounded-smart border border-emerald-100">
                <Receipt size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-text">Minha Assinatura & Histórico</h3>
                <p className="text-xs text-neutral-muted mt-0.5">Acompanhe seu status e acesse comprovantes de faturas integradas pelo Asaas.</p>
              </div>
            </div>
            
            <button 
              onClick={async () => {
                if (!profile?.id) return;
                setLoadingPayments(true);
                try {
                  const r = await fetch(`/api/asaas/payments/${profile.id}`);
                  if (r.ok) {
                    const d = await r.json();
                    if (d.success) setPayments(d.payments || []);
                  }
                  addToast('Histórico de faturas atualizado!', 'success');
                } catch {
                  addToast('Erro ao atualizar faturas', 'error');
                } finally {
                  setLoadingPayments(false);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] hover:bg-slate-100 border border-neutral-border text-xs font-semibold text-neutral-muted transition-colors rounded-smart cursor-pointer"
            >
              <RefreshCw size={12} className={loadingPayments ? 'animate-spin' : ''} />
              Atualizar Lista
            </button>
          </div>

          {/* Status Geral */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#f8fafc] p-4 rounded-smart border border-neutral-border flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-smart border border-indigo-100">
                <CreditCard size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-neutral-muted font-bold uppercase tracking-wider">Status do Acesso</span>
                <span className="text-xs font-black text-neutral-text flex items-center gap-1.5 mt-0.5">
                  {profile?.subscriptionStatus === 'active' || profile?.subscription_status === 'active' ? (
                    <span className="text-brand flex items-center gap-0.5"><Sparkles size={11} /> Ativo</span>
                  ) : profile?.subscriptionStatus === 'trial' || profile?.subscription_status === 'trial' ? (
                    <span className="text-indigo-600">Demonstração</span>
                  ) : (
                    <span className="text-rose-600">Inativo</span>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-smart border border-neutral-border flex items-center gap-3">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-smart border border-sky-100">
                <Calendar size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-neutral-muted font-bold uppercase tracking-wider">Validade / Expiração</span>
                <span className="text-xs font-bold text-neutral-text mt-0.5 block">
                  {profile?.subscription_expiry ? (
                    new Date(profile.subscription_expiry).toLocaleDateString('pt-BR')
                  ) : profile?.trialEndDate ? (
                    new Date(profile.trialEndDate).toLocaleDateString('pt-BR')
                  ) : (
                    'N/D'
                  )}
                </span>
              </div>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-smart border border-neutral-border flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-smart border border-amber-100">
                <AlertCircle size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-neutral-muted font-bold uppercase tracking-wider">Mapeamento Asaas</span>
                <span className="text-xs font-bold text-neutral-text mt-0.5 block truncate max-w-[170px]">
                  {profile?.asaasCustomerId || profile?.asaas_customer_id || 'Pendente de ativação'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela ou Lista de Cobranças */}
          {loadingPayments ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="text-brand animate-spin" />
              <p className="text-xs font-bold text-neutral-muted">Buscando faturas no gateway Asaas...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-[#f8fafc] p-8 rounded-smart border border-dashed border-neutral-border text-center">
              <Receipt size={32} className="text-slate-350 mx-auto mb-2" />
              <h4 className="text-xs font-black text-neutral-text">Nenhuma fatura encontrada</h4>
              <p className="text-xs text-neutral-muted mt-1 max-w-sm mx-auto">Sua assinatura corporativa ou histórico de lançamentos do Asaas será exibido aqui assim que forem gerados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-smart border border-neutral-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-neutral-border text-[9px] font-black text-neutral-muted uppercase tracking-wider">
                    <th className="py-3 px-5">ID Cobrança</th>
                    <th className="py-3 px-5">Emissão</th>
                    <th className="py-3 px-5">Vencimento</th>
                    <th className="py-3 px-5">Valor</th>
                    <th className="py-3 px-5">Método de Pgto</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-xs font-bold text-neutral-text">
                        {p.id}
                      </td>
                      <td className="py-3 px-5 text-xs font-bold text-neutral-muted">
                        {p.dateCreated ? new Date(p.dateCreated).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-5 text-xs font-semibold text-neutral-muted">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-5 text-xs font-black text-neutral-text">
                        R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-5 text-xs font-semibold text-neutral-muted">
                        {getPaymentMethodLabel(p.billingType)}
                      </td>
                      <td className="py-3 px-5">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        {p.invoiceUrl || p.transactionReceiptUrl || p.bankSlipUrl ? (
                          <a 
                            href={p.transactionReceiptUrl || p.invoiceUrl || p.bankSlipUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-smart text-[10px] font-black tracking-tight transition-colors"
                          >
                            Visualizar <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-300">Nenhum</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm">
           <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-smart border border-indigo-100">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-text">Segurança de Acesso</h3>
              <p className="text-xs text-neutral-muted mt-0.5">Proteja ações críticas alterando sua senha de administrador.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-xl bg-[#f8fafc] p-6 rounded-smart border border-neutral-border space-y-4">
             {pwdMessage && (
              <div className={`p-3.5 rounded-smart text-xs font-bold animate-fade-in flex items-center gap-3 ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-brand border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {pwdMessage.type === 'success' ? <RefreshCw size={14} /> : <AlertTriangle size={14} />}
                {pwdMessage.text}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                <Key size={12} className="text-indigo-500" /> Senha Atual do Administrador
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={pwdForm.current}
                onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-300"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Nova Senha</label>
                <input 
                  type="password" 
                  placeholder="Mín. 4 dígitos"
                  value={pwdForm.new}
                  onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-300"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Confirmar Nova</label>
                <input 
                  type="password" 
                  placeholder="Repita a nova"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-smart font-bold uppercase tracking-wider text-xs transition-all cursor-pointer">
              Confirmar Alteração de Senha
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-smart border border-blue-100">
              <Save size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-text">Manutenção de Dados</h3>
              <p className="text-xs text-neutral-muted mt-0.5">Exporte ou restaure suas informações em arquivos locais.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button onClick={handleExportBackup} className="flex-1 flex items-center justify-center gap-3 bg-neutral-text text-white px-6 py-4 rounded-smart hover:bg-neutral-text/92 transition-all cursor-pointer">
              <Download size={18} className="text-[#10b981]" />
              <div className="text-left">
                <span className="block font-black uppercase tracking-wider text-[11px]">Fazer Backup</span>
                <span className="text-[10px] text-zinc-400 font-bold">Gerar backup .JSON</span>
              </div>
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 bg-white border border-neutral-border text-neutral-text px-6 py-4 rounded-smart hover:border-[#10b981] hover:text-[#10b981] transition-all cursor-pointer group">
              <Upload size={18} className="group-hover:text-[#10b981]" />
              <div className="text-left">
                <span className="block font-black uppercase tracking-wider text-[11px]">Importar Dados</span>
                <span className="text-[10px] text-neutral-muted font-bold">Substituir dados atuais</span>
              </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </div>

        <div className="bg-rose-50/40 p-6 rounded-smart border border-red-150 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <AlertTriangle size={150} className="text-red-650" />
          </div>
          <div className="flex items-start gap-4 mb-4 relative z-10">
            <div className="p-2.5 bg-white text-red-650 rounded-smart shadow-sm border border-red-100">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-950">Área Crítica</h3>
              <p className="text-xs text-red-750 mt-0.5">Ações irreversíveis que limpam todo o histórico de operações com retorno financeiro do sistema.</p>
            </div>
          </div>
          <button onClick={() => setModalType(isDefaultPassword ? 'reset-initial' : 'reset')} className="relative z-10 w-full md:w-auto px-6 py-2.5 bg-red-600 text-white rounded-smart font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <RefreshCw size={14} /> Reset de Fábrica
          </button>
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-smart shadow-xl w-full max-w-md overflow-hidden border border-neutral-border">
            <div className={`p-4 border-b border-neutral-border flex justify-between items-center ${isDanger ? 'bg-red-50 text-red-900 border-b-red-200' : 'bg-indigo-50 text-indigo-900 border-b-indigo-200'}`}>
              <h3 className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider">
                {isDanger ? <AlertTriangle size={16} /> : <Lock size={16} />}
                {modalType === 'restore' ? 'Validar Restauração' : modalType === 'reset-initial' ? 'Primeiro Uso' : 'Confirmar Limpeza'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-white/50 rounded-full transition-colors text-slate-500 cursor-pointer"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmitPassword} className="p-6 space-y-4">
              <div className="p-3.5 bg-[#f8fafc] rounded-smart text-xs text-neutral-muted border border-neutral-border font-medium leading-relaxed">
                {modalType === 'reset' && "Esta ação apagará permanentemente todos os produtos e vendas. Confirme com sua senha administrativa."}
                {modalType === 'restore' && "Todos os dados atuais serão removidos e substituídos pelos do arquivo. Confirme com sua senha."}
                {modalType === 'reset-initial' && "Crie sua senha de administrador antes de realizar o primeiro reset total do sistema."}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-widest">{modalType === 'reset-initial' ? 'Nova Senha Admin' : 'Senha do Sistema'}</label>
                  <input 
                    autoFocus
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {modalType === 'reset-initial' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-muted uppercase tracking-widest">Repita a Senha</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-2.5 bg-red-50 text-red-600 rounded-smart text-xs font-bold border border-red-100 flex items-center gap-2 animate-shake"><AlertTriangle size={12} />{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-neutral-border text-neutral-muted rounded-smart hover:bg-[#f8fafc] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-2 text-white rounded-smart font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer ${isDanger ? 'bg-red-650 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
