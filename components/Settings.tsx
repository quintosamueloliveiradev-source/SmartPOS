
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
    a.download = `vendeei-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      <header>
        <h2 className="text-headline-lg font-headline-lg text-slate-900">Configurações do Sistema</h2>
        <p className="text-body-md font-body-md text-slate-500 mt-1">Gerencie segurança, integridade de dados e backups.</p>
      </header>

      <div className="grid gap-8">
        {/* Minha Assinatura & Histórico de Faturas */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Receipt size={28} />
              </div>
              <div>
                <h3 className="text-title-md font-title-md text-slate-800">Minha Assinatura & Histórico</h3>
                <p className="text-body-md font-body-md text-slate-500">Acompanhe seu status e acesse comprovantes de faturas integradas pelo Asaas.</p>
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
                  addToast('Histórico de faturas updated!', 'success');
                } catch {
                  addToast('Erro ao atualizar faturas', 'error');
                } finally {
                  setLoadingPayments(false);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-label-sm font-label-sm font-semibold text-slate-600 transition-colors"
            >
              <RefreshCw size={14} className={loadingPayments ? 'animate-spin' : ''} />
              Atualizar Lista
            </button>
          </div>

          {/* Status Geral */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8 pt-2">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="block text-label-sm font-label-sm text-slate-400 uppercase tracking-wide">Status do Acesso</span>
                <span className="text-body-md font-body-md font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  {profile?.subscriptionStatus === 'active' || profile?.subscription_status === 'active' ? (
                    <span className="text-emerald-600 flex items-center gap-1"><Sparkles size={14} /> Ativo</span>
                  ) : profile?.subscriptionStatus === 'trial' || profile?.subscription_status === 'trial' ? (
                    <span className="text-indigo-600">Período de Testes</span>
                  ) : (
                    <span className="text-rose-600">Expirado / Inativo</span>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <span className="block text-label-sm font-label-sm text-slate-400 uppercase tracking-wide">Validade / Expiração</span>
                <span className="text-body-md font-body-md font-bold font-debug-mono text-slate-800 mt-0.5 block">
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

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <div>
                <span className="block text-label-sm font-label-sm text-slate-400 uppercase tracking-wide">Mapeamento Asaas</span>
                <span className="text-body-md font-body-md font-bold font-debug-mono text-slate-800 mt-0.5 block truncate max-w-[180px]">
                  {profile?.asaasCustomerId || profile?.asaas_customer_id || 'Não vinculado'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela ou Lista de Cobranças */}
          {loadingPayments ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-indigo-600 animate-spin" />
              <p className="text-label-sm font-label-sm text-slate-400">Buscando faturas no Asaas Sandbox...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
              <Receipt size={36} className="text-slate-300 mx-auto mb-3" />
              <h4 className="text-title-md font-title-md text-slate-700">Nenhuma fatura encontrada</h4>
              <p className="text-body-md font-body-md text-slate-500 mt-1 max-w-sm mx-auto">Sua assinatura corporativa ou histórico de lançamentos do Asaas será exibido aqui assim que forem gerados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-label-sm font-label-sm text-slate-400 uppercase tracking-wide">
                    <th className="py-4 px-5">ID Cobrança</th>
                    <th className="py-4 px-5">Emissão</th>
                    <th className="py-4 px-5">Vencimento</th>
                    <th className="py-4 px-5">Valor</th>
                    <th className="py-4 px-5">Método de Pgto</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 text-label-sm font-label-sm font-debug-mono font-bold text-slate-600">
                        {p.id}
                      </td>
                      <td className="py-4 px-5 text-label-sm font-label-sm font-debug-mono font-bold text-slate-600">
                        {p.dateCreated ? new Date(p.dateCreated).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-4 px-5 text-label-sm font-label-sm font-debug-mono font-semibold text-slate-500">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-4 px-5 text-label-sm font-label-sm font-debug-mono font-bold text-slate-900">
                        R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-label-sm font-label-sm font-semibold text-slate-500">
                        {getPaymentMethodLabel(p.billingType)}
                      </td>
                      <td className="py-4 px-5">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {p.invoiceUrl || p.transactionReceiptUrl || p.bankSlipUrl ? (
                          <a 
                            href={p.transactionReceiptUrl || p.invoiceUrl || p.bankSlipUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-label-sm font-label-sm font-semibold tracking-tight transition-colors"
                          >
                            Visualizar <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-label-sm font-label-sm font-semibold text-slate-300">Nenhum</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-100">
           <div className="flex items-start gap-4 mb-8">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="text-title-md font-title-md text-slate-800">Segurança de Acesso</h3>
              <p className="text-body-md font-body-md text-slate-500">Proteja ações críticas alterando sua senha de administrador.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-xl bg-slate-50 p-8 rounded-3xl border-2 border-slate-200 space-y-6">
             {pwdMessage && (
              <div className={`p-4 rounded-xl text-sm font-bold animate-fade-in flex items-center gap-3 ${pwdMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                {pwdMessage.type === 'success' ? <RefreshCw size={16} /> : <AlertTriangle size={16} />}
                {pwdMessage.text}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wider flex items-center gap-2 font-semibold">
                <Key size={14} className="text-indigo-500" /> Senha Atual do Administrador
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={pwdForm.current}
                onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wider font-semibold">Nova Senha</label>
                <input 
                  type="password" 
                  placeholder="Mín. 4 dígitos"
                  value={pwdForm.new}
                  onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                  className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wider font-semibold">Confirmar Nova</label>
                <input 
                  type="password" 
                  placeholder="Repita a nova"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-title-md uppercase tracking-wider text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]">
              Confirmar Alteração de Senha
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-100">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Save size={28} />
            </div>
            <div>
              <h3 className="text-title-md font-title-md text-slate-800">Manutenção de Dados</h3>
              <p className="text-body-md font-body-md text-slate-500">Exporte ou restaure suas informações em arquivos locais.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <button onClick={handleExportBackup} className="flex-1 flex items-center justify-center gap-4 bg-slate-900 text-white px-8 py-6 rounded-3xl hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">
              <Download size={24} className="text-blue-400" />
              <div className="text-left">
                <span className="block font-title-md uppercase tracking-wider text-xs">Fazer Backup</span>
                <span className="text-label-sm font-label-sm text-slate-500 font-bold block mt-0.5">Gerar arquivo .JSON</span>
              </div>
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-4 bg-white border-2 border-slate-300 text-slate-700 px-8 py-6 rounded-3xl hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-[0.98] group">
              <Upload size={24} className="group-hover:text-emerald-500" />
              <div className="text-left">
                <span className="block font-title-md uppercase tracking-wider text-xs">Importar Dados</span>
                <span className="text-label-sm font-label-sm text-slate-400 font-bold block mt-0.5">Substituir dados atuais</span>
              </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </div>

        <div className="bg-red-50 p-8 rounded-3xl border-2 border-red-100 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle size={180} className="text-red-600" />
          </div>
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="p-4 bg-white text-red-600 rounded-2xl shadow-sm">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-title-md font-red-900 font-semibold">Área Crítica</h3>
              <p className="text-body-md font-body-md text-red-700">Ações irreversíveis que limpam todo o histórico de operações.</p>
            </div>
          </div>
          <button onClick={() => setModalType(isDefaultPassword ? 'reset-initial' : 'reset')} className="relative z-10 w-full md:w-auto px-10 py-4 bg-red-600 text-white rounded-2xl font-title-md uppercase tracking-wider text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-3">
            <RefreshCw size={18} /> Reset de Fábrica
          </button>
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isDanger ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              <h3 className="text-title-md font-title-md flex items-center gap-2 uppercase tracking-wide">
                {isDanger ? <AlertTriangle size={20} /> : <Lock size={20} />}
                {modalType === 'restore' ? 'Validar Restauração' : modalType === 'reset-initial' ? 'Primeiro Uso' : 'Confirmar Limpeza'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmitPassword} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl text-body-md font-body-md text-slate-600 border border-slate-100 font-semibold leading-relaxed">
                {modalType === 'reset' && "Esta ação apagará permanentemente todos os produtos e vendas. Confirme com sua senha administrativa."}
                {modalType === 'restore' && "Todos os dados atuais serão removidos e substituídos pelos do arquivo. Confirme com sua senha."}
                {modalType === 'reset-initial' && "Crie sua senha de administrador antes de realizar o primeiro reset total do sistema."}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">{modalType === 'reset-initial' ? 'Nova Senha Admin' : 'Senha do Sistema'}</label>
                  <input 
                    autoFocus
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {modalType === 'reset-initial' && (
                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">Repita a Senha</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-shake"><AlertTriangle size={14} />{error}</div>}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 font-title-md text-xs uppercase tracking-wider transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-4 text-white rounded-2xl font-title-md text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
