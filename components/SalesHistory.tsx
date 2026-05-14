
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Movimentação</h2>
          <p className="text-slate-500">Consulte vendas, estorne pagamentos e gere relatórios.</p>
        </div>
        <button onClick={exportSalesToCSV} className="flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-md font-black text-xs uppercase tracking-widest active:scale-95">
          <FileDown size={18} className="text-emerald-400" /> Relatório CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendas (Período)</p>
          <p className="text-2xl font-black text-slate-800">{stats.count}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento</p>
          <p className="text-2xl font-black text-emerald-600">R$ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens Vendidos</p>
          <p className="text-2xl font-black text-indigo-600">{stats.items}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Estimado</p>
          <p className="text-2xl font-black text-blue-600">R$ {stats.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col xl:flex-row items-center gap-6">
        <div className="flex items-center gap-3 text-slate-500 font-black text-xs uppercase tracking-widest min-w-[150px]">
          <Filter size={18} className="text-indigo-500" /> Filtros de Busca
        </div>

        <div className="relative flex-1 w-full min-w-[200px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 group-focus-within:scale-110 transition-all" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID (ex: #1778) ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto border border-slate-200">
          <button onClick={() => setFilterMode('24h')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === '24h' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Últimas 24h</button>
          <button onClick={() => setFilterMode('custom')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'custom' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Personalizado</button>
        </div>

        {filterMode === 'custom' && (
          <div className="flex items-center gap-4 w-full md:w-auto animate-fade-in">
            <ChevronRight size={20} className="text-slate-300 hidden md:block" />
            <div className="relative flex-1 md:flex-none group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 group-focus-within:scale-110 transition-transform" size={18} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-12 pr-6 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all cursor-pointer shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredSales.map(sale => {
          const isCanceled = sale.status === 'canceled';
          return (
            <div key={sale.id} className={`bg-white border-2 ${isCanceled ? 'border-red-100 bg-red-50/20 grayscale opacity-60' : 'border-slate-100'} rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center relative transition-all hover:shadow-md`}>
              <div className="flex items-center gap-4 min-w-[180px]">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${isCanceled ? 'bg-red-50 border-red-200 text-red-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}><Clock size={24} /></div>
                <div>
                  <p className="font-black text-slate-900 leading-tight">#{sale.id}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(sale.timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {sale.items.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  {sale.customerName && <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider"><User size={12} className="text-indigo-400" /> Cliente: {sale.customerName}</div>}
                  {sale.surcharge > 0 && <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 uppercase tracking-wider"><PlusCircle size={12} /> Taxa Cartão: R$ {sale.surcharge.toFixed(2)}</div>}
                </div>
              </div>

              <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t border-slate-100 lg:border-none pt-4 lg:pt-0">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
                   {getPaymentIcon(sale.paymentMethod)}
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sale.paymentMethod}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Total Recebido</p>
                  <p className={`text-xl font-black ${isCanceled ? 'text-red-400 line-through' : 'text-emerald-600'}`}>R$ {sale.total.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-2">
                  {!isCanceled && (
                    <>
                      <button 
                        onClick={() => printReceipt(sale, 'thermal')} 
                        className="p-3 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-2xl transition-all shadow-sm group relative"
                        title="Imprimir Cupom 58mm"
                      >
                        <Ticket size={20} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Térmica 58mm</span>
                      </button>
                      
                      <button 
                        onClick={() => printReceipt(sale, 'a4')} 
                        className="p-3 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-2xl transition-all shadow-sm group relative"
                        title="Imprimir A4"
                      >
                        <FileText size={20} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Relatório A4</span>
                      </button>
                      
                      <button 
                        onClick={() => setSaleToCancel(sale.id)} 
                        className="p-3 text-amber-500 hover:bg-amber-50 border border-amber-100 rounded-2xl transition-all shadow-sm group relative"
                        title="Estornar Venda"
                      >
                        <RotateCcw size={20} />
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

      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isDefaultPassword ? 'bg-indigo-50 text-indigo-800' : 'bg-amber-50 text-amber-800'}`}>
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                {isDefaultPassword ? <ShieldCheck size={22} /> : <RotateCcw size={22} />}
                {isDefaultPassword ? 'Segurança Administrativa' : 'Confirmar Estorno'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleCancelSale} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                {isDefaultPassword 
                  ? "Como este é seu primeiro estorno, você precisa criar sua senha administrativa personalizada para prosseguir com segurança." 
                  : <>Você está removendo R$ {sales.find(s=>s.id===saleToCancel)?.total.toFixed(2)} do faturamento. O estoque dos itens do pedido #{saleToCancel} será devolvido.</>
                }
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isDefaultPassword ? 'Nova Senha Admin' : 'Sua Senha Mestre'}</label>
                  <input 
                    autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-xl font-black focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200"
                    placeholder="••••••••" required
                  />
                </div>
                {isDefaultPassword && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmar Senha</label>
                    <input 
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-xl font-black focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200"
                      placeholder="••••••••" required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">{error}</div>}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 px-4 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${isDefaultPassword ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}>Estornar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
