
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Clock, CreditCard, Banknote, QrCode, AlertTriangle, X, RotateCcw, Ban, ShieldCheck, ShieldAlert, Key, Info, Calendar, Filter, ChevronRight, FileDown, User, PlusCircle, Printer, Ticket, FileText, Search } from 'lucide-react';
import { printReceipt } from '../services/receiptService';

export const SalesHistory: React.FC = () => {
  const { sales, cancelSale, isDefaultPassword, updateAdminPassword, exportSalesToCSV } = useStore();
  const [saleToCancel, setSaleToCancel] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'24h' | 'custom'>('24h');
  const [startDate, setStartDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    return sales.filter(sale => {
      let matchesTime = false;
      if (filterMode === '24h') {
        matchesTime = sale.timestamp >= twentyFourHoursAgo;
      } else {
        const selectedStart = new Date(startDate + 'T00:00:00').getTime();
        matchesTime = sale.timestamp >= selectedStart;
      }

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        sale.id.toLowerCase().includes(searchLower) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchLower));
        
      return matchesTime && matchesSearch;
    });
  }, [sales, filterMode, startDate, searchTerm]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'credit': return <CreditCard size={16} className="text-blue-500" />;
      case 'debit': return <CreditCard size={16} className="text-sky-500" />;
      case 'cash': return <Banknote size={16} className="text-emerald-500" />;
      case 'pix': return <QrCode size={16} className="text-teal-500" />;
      default: return <CreditCard size={16} />;
    }
  };

  const handleCancelSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;
    setError('');
    if (isDefaultPassword) {
      if (password.length < 4) { setError('Mínimo 4 caracteres.'); return; }
      if (password !== confirmPassword) { setError('Senhas não conferem.'); return; }
      if (cancelSale(saleToCancel, 'admin').success) {
        updateAdminPassword('admin', password);
        closeModals();
      } else setError('Erro ao estornar.');
    } else {
      if (cancelSale(saleToCancel, password).success) closeModals();
      else setError('Senha incorreta.');
    }
  };

  const closeModals = () => {
    setSaleToCancel(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const stats = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      if (sale.status === 'completed') {
        acc.revenue += sale.total;
        acc.profit += sale.profit;
        acc.items += sale.items.reduce((sum, i) => sum + i.quantity, 0);
        acc.count += 1;
      }
      return acc;
    }, { revenue: 0, profit: 0, items: 0, count: 0 });
  }, [filteredSales]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 lg:p-8 rounded-smart border border-neutral-border shadow-sm shadow-slate-100/50">
        <div>
          <h2 className="text-xl font-black text-neutral-text">Histórico de Movimentação</h2>
          <p className="text-neutral-muted text-sm mt-1">Consulte vendas, estorne pagamentos e gere relatórios comerciais.</p>
        </div>
        <button onClick={exportSalesToCSV} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-smart text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-98">
          <FileDown size={16} className="text-brand" /> Relatório CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm hover:border-brand/30 transition-all">
          <p className="text-[10px] font-black text-neutral-muted uppercase tracking-wider mb-1">Vendas (Período)</p>
          <p className="text-2xl font-bold text-neutral-text">{stats.count}</p>
        </div>
        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm hover:border-brand/30 transition-all">
          <p className="text-[10px] font-black text-neutral-muted uppercase tracking-wider mb-1">Faturamento</p>
          <p className="text-2xl font-bold text-brand">R$ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm hover:border-brand/30 transition-all">
          <p className="text-[10px] font-black text-neutral-muted uppercase tracking-wider mb-1">Itens Vendidos</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.items}</p>
        </div>
        <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm hover:border-indigo-200 transition-all">
          <p className="text-[10px] font-black text-neutral-muted uppercase tracking-wider mb-1">Lucro Estimado</p>
          <p className="text-2xl font-bold text-indigo-600">R$ {stats.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-smart border border-neutral-border shadow-sm flex flex-col xl:flex-row items-center gap-6">
        <div className="flex items-center gap-3 text-neutral-muted font-bold text-xs uppercase tracking-wider min-w-[150px]">
          <Filter size={16} className="text-brand" /> Filtros de Busca
        </div>

        <div className="relative flex-1 w-full min-w-[200px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por ID (ex: #1778) ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-6 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all shadow-sm placeholder:text-neutral-muted"
          />
        </div>

        <div className="flex p-1 bg-[#f8fafc] rounded-smart border border-neutral-border w-full md:w-auto">
          <button onClick={() => setFilterMode('24h')} className={`px-5 py-2 rounded-smart text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${filterMode === '24h' ? 'bg-white text-brand shadow-sm border border-neutral-border/55' : 'text-neutral-muted hover:text-neutral-text'}`}>Últimas 24h</button>
          <button onClick={() => setFilterMode('custom')} className={`px-5 py-2 rounded-smart text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${filterMode === 'custom' ? 'bg-white text-brand shadow-sm border border-neutral-border/55' : 'text-neutral-muted hover:text-neutral-text'}`}>Personalizado</button>
        </div>

        {filterMode === 'custom' && (
          <div className="flex items-center gap-4 w-full md:w-auto animate-fade-in">
            <ChevronRight size={18} className="text-slate-300 hidden md:block" />
            <div className="relative flex-1 md:flex-none group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={16} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-12 pr-6 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all cursor-pointer shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-neutral-border rounded-smart min-h-[350px]">
          <div className="w-14 h-14 bg-[#f8fafc] text-neutral-muted/70 rounded-smart flex items-center justify-center mb-4 border border-neutral-border">
            <Clock size={24} />
          </div>
          <h3 className="text-base font-black text-neutral-text mb-2">Nenhuma venda registrada</h3>
          <p className="text-neutral-muted text-sm max-w-sm">Suas vendas finalizadas no PDV aparecerão aqui com o histórico detalhado e relatórios financeiros.</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="p-8 text-center bg-white border border-neutral-border rounded-smart text-neutral-muted font-bold text-sm">
          Nenhuma venda encontrada correspondente aos filtros de busca ou período.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.map(sale => {
            const isCanceled = sale.status === 'canceled';
            return (
              <div key={sale.id} className={`bg-white border ${isCanceled ? 'border-red-150 bg-red-50/10 grayscale opacity-60' : 'border-neutral-border'} rounded-smart p-5 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center relative transition-all hover:border-brand/35`}>
                <div className="flex items-center gap-4 min-w-[180px]">
                  <div className={`w-10 h-10 rounded-smart flex items-center justify-center border ${isCanceled ? 'bg-red-50 border-red-200 text-red-400' : 'bg-slate-50 border-neutral-border text-slate-500'}`}><Clock size={16} /></div>
                  <div>
                    <p className="font-bold text-neutral-text leading-tight">#{sale.id}</p>
                    <p className="text-[10px] text-neutral-muted font-bold uppercase mt-1">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(sale.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {sale.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-[#f8fafc] border border-neutral-border rounded-md text-[10px] font-bold text-neutral-muted">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {sale.customerName && <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-neutral-muted uppercase tracking-wide"><User size={11} className="text-indigo-400" /> Cliente: {sale.customerName}</div>}
                    {sale.surcharge > 0 && <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-500 uppercase tracking-wide"><PlusCircle size={11} /> Taxa Cartão: R$ {sale.surcharge.toFixed(2)}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t border-neutral-border lg:border-none pt-4 lg:pt-0">
                  <div className="bg-[#f8fafc] px-2.5 py-1 rounded-smart border border-neutral-border flex items-center gap-1.5">
                     {getPaymentIcon(sale.paymentMethod)}
                     <span className="text-[9px] font-black uppercase tracking-wider text-neutral-muted">{sale.paymentMethod}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-neutral-muted font-black uppercase mb-0.5">Total Recebido</p>
                    <p className={`text-lg font-black ${isCanceled ? 'text-red-400 line-through' : 'text-brand'}`}>R$ {sale.total.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    {!isCanceled && (
                      <>
                        <button 
                          onClick={() => printReceipt(sale, 'thermal')} 
                          className="p-2 text-brand hover:bg-emerald-50 border border-emerald-100 rounded-smart transition-all shadow-sm group relative cursor-pointer"
                          title="Imprimir Cupom 58mm"
                        >
                          <Ticket size={16} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Térmica 58mm</span>
                        </button>
                        
                        <button 
                          onClick={() => printReceipt(sale, 'a4')} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-smart transition-all shadow-sm group relative cursor-pointer"
                          title="Imprimir A4"
                        >
                          <FileText size={16} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Relatório A4</span>
                        </button>
                        
                        <button 
                          onClick={() => setSaleToCancel(sale.id)} 
                          className="p-2 text-amber-500 hover:bg-amber-50 border border-amber-100 rounded-smart transition-all shadow-sm group relative cursor-pointer"
                          title="Estornar Venda"
                        >
                          <RotateCcw size={16} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Estornar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-smart shadow-sm w-full max-w-md overflow-hidden border border-neutral-border animate-scale-in">
            <div className={`p-5 px-6 border-b border-neutral-border flex justify-between items-center ${isDefaultPassword ? 'bg-indigo-50/50 text-indigo-800' : 'bg-amber-50/50 text-amber-800'}`}>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                {isDefaultPassword ? <ShieldCheck size={18} /> : <RotateCcw size={18} />}
                {isDefaultPassword ? 'Segurança Administrativa' : 'Confirmar Estorno'}
              </h3>
              <button onClick={closeModals} className="p-1.5 hover:bg-white/60 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCancelSale} className="p-6 space-y-5">
              <div className="p-4 bg-[#f8fafc] rounded-smart border border-neutral-border text-xs text-neutral-muted leading-relaxed font-semibold">
                {isDefaultPassword 
                  ? "Como este é seu primeiro estorno, você precisa criar sua senha administrativa personalizada para prosseguir com segurança." 
                  : <>Você está removendo R$ {sales.find(s=>s.id===saleToCancel)?.total.toFixed(2)} do faturamento. O estoque dos itens do pedido #{saleToCancel} será devidamente devolvido.</>
                }
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider">{isDefaultPassword ? 'Nova Senha Admin' : 'Sua Senha Mestre'}</label>
                  <input 
                    autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-border rounded-smart text-base font-bold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-200"
                    placeholder="••••••••" required
                  />
                </div>
                {isDefaultPassword && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider">Confirmar Senha</label>
                    <input 
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-neutral-border rounded-smart text-base font-bold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-200"
                      placeholder="••••••••" required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-2.5 bg-red-50 text-red-600 rounded-smart text-xs font-bold border border-red-100 flex items-center gap-1.5">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModals} className="flex-1 py-2 rounded-smart border border-neutral-border text-neutral-muted hover:bg-slate-50 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" className={`flex-1 py-2 text-white rounded-smart font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${isDefaultPassword ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Estornar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
