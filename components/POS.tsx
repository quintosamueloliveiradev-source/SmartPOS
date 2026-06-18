
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ShoppingBasket, User, Tag, Percent, Barcode, Printer, CheckCircle2, Ticket, FileText, X } from 'lucide-react';
import { printReceipt } from '../services/receiptService';
import { Sale } from '../types';

export const POS: React.FC = () => {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, completeSale, addToast } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [cardTaxPercent, setCardTaxPercent] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isSearching = searchTerm.trim().length > 0;
  const filteredProducts = isSearching 
    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Cálculo da taxa baseado no subtotal após desconto
  const baseForTax = Math.max(0, subtotal - discount);
  const surchargeValue = (baseForTax * (cardTaxPercent / 100));
  
  const total = baseForTax + surchargeValue;
  const change = receivedAmount > total ? receivedAmount - total : 0;

  const handleComplete = async (method: 'credit' | 'debit' | 'cash' | 'pix') => {
    // Aplicamos a taxa apenas se for cartão (credit/debit) ou se o lojista desejar para outros
    // Neste caso, se o método for dinheiro, ignoramos a taxa informada
    const finalSurcharge = (method === 'credit' || method === 'debit') ? surchargeValue : 0;
    
    const sale = await completeSale(method, discount, customerName, finalSurcharge);
    if (sale) {
      setLastSale(sale);
      setShowSuccessModal(true);
    }

    setCustomerName('');
    setDiscount(0);
    setCardTaxPercent(0);
    setSearchTerm('');
    setReceivedAmount(0);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeSearch.trim()) return;

    const product = products.find(p => p.barcode === barcodeSearch.trim());
    if (product) {
      if (product.stock > 0) {
        addToCart(product);
        addToast(`${product.name} adicionado!`, 'success');
      } else {
        addToast(`Produto sem estoque!`, 'error');
      }
    } else {
      addToast(`Produto não encontrado!`, 'error');
    }
    setBarcodeSearch('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6 overflow-hidden">
      <div className="flex-1 flex flex-col bg-white rounded-smart shadow-sm border border-neutral-border overflow-hidden">
        <div className="p-4 border-b border-neutral-border bg-[#f8fafc] flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto pelo nome..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-border rounded-smart text-base font-bold text-neutral-text placeholder:text-neutral-muted focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-64">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
            <input 
              type="text" 
              placeholder="Escanear Código..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-border rounded-smart text-base font-black placeholder:text-neutral-muted focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all shadow-sm text-indigo-600"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-muted max-w-sm mx-auto text-center p-8">
              <div className="p-6 bg-neutral-bg rounded-smart mb-6 border border-neutral-border text-neutral-muted/70">
                <ShoppingBasket size={48} />
              </div>
              <h3 className="text-lg font-black text-neutral-text mb-2">Nenhum produto cadastrado</h3>
              <p className="text-neutral-muted text-sm mb-6 leading-relaxed">
                Você precisa cadastrar pelo menos um produto no estoque antes de realizar vendas no PDV.
              </p>
            </div>
          ) : !isSearching ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-muted">
              <div className="p-6 bg-neutral-bg rounded-full mb-6 border border-neutral-border">
                <Search size={48} className="text-neutral-muted/60" />
              </div>
              <p className="text-sm font-black text-neutral-muted uppercase tracking-wider">Digite acima para buscar produtos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                  className="flex flex-col text-left border border-neutral-border rounded-smart overflow-hidden hover:border-brand hover:shadow-md transition-all active:scale-98 disabled:opacity-50 bg-white group"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-slate-50">
                    <img src={p.imageUrl} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-red-600 text-xs">SEM ESTOQUE</div>}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-neutral-text truncate">{p.name}</h4>
                    <p className="text-[10px] text-neutral-muted mb-2 uppercase font-bold tracking-wider">{p.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-brand">R$ {p.price.toFixed(2)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${p.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock} un</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-smart shadow-sm border border-neutral-border overflow-hidden">
        <div className="p-5 bg-slate-900 text-white">
          <h2 className="font-bold flex items-center gap-2 text-base">
            <ShoppingBasket size={18} className="text-brand" />
            Carrinho
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{cart.length} itens no pedido atual</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-muted text-center py-20">
              <ShoppingBasket size={48} className="mb-3 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted/70">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-neutral-border rounded-smart shadow-sm hover:border-brand/40 transition-all">
                <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-neutral-text truncate leading-tight">{item.name}</p>
                  <p className="text-xs text-brand font-black mt-0.5">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-smart border border-neutral-border">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-0.5 hover:bg-white hover:text-red-500 rounded-md transition-all shadow-sm"><Minus size={12}/></button>
                  <span className="text-xs font-black w-5 text-center text-neutral-text">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-0.5 hover:bg-white hover:text-brand rounded-md transition-all shadow-sm"><Plus size={12}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={16}/></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-neutral-border space-y-3.5 z-10">
          {/* Sessão de Ajustes Rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted focus-within:text-brand" size={14} />
              <input 
                type="text" 
                placeholder="Cliente" 
                className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-border rounded-smart text-xs focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all font-semibold text-neutral-text placeholder:text-neutral-muted shadow-sm"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Tag className="absolute left-[6px] top-1/2 -translate-y-1/2 text-neutral-muted focus-within:text-red-500" size={12} />
                <input 
                  type="number" 
                  placeholder="Desc." 
                  className="w-full pl-[22px] pr-1 py-2 bg-white border border-neutral-border rounded-smart text-xs font-black text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="relative flex-1 group">
                <Percent className="absolute left-[6px] top-1/2 -translate-y-1/2 text-neutral-muted focus-within:text-indigo-500" size={12} />
                <input 
                  type="number" 
                  placeholder="Taxa" 
                  className="w-full pl-[22px] pr-1 py-2 bg-white border border-neutral-border rounded-smart text-xs font-black text-indigo-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm"
                  value={cardTaxPercent || ''}
                  onChange={e => setCardTaxPercent(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-smart overflow-hidden shadow-sm">
            <div className="p-4 bg-brand text-white flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider leading-none opacity-80">Total Final</span>
                <span className="text-2xl font-black tracking-tight mt-0.5">R$ {total.toFixed(2)}</span>
              </div>
              {receivedAmount > total && (
                <div className="bg-white/10 text-white px-3 py-1.5 rounded-smart border border-white/10 shadow-lg text-right animate-pulse-subtle">
                  <span className="text-[8px] font-black uppercase tracking-wider block leading-none mb-1 text-slate-200">Troco</span>
                  <span className="text-lg font-black leading-none">R$ {change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="number" 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-smart text-sm font-bold text-white focus:border-brand focus:outline-none transition-all placeholder:text-slate-500"
                  placeholder="Valor Recebido"
                  value={receivedAmount || ''}
                  onChange={e => setReceivedAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <button onClick={() => handleComplete('pix')} disabled={cart.length === 0} className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-smart text-[10px] font-black hover:bg-black transition-all active:scale-98 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm group cursor-pointer">
              <QrCode size={18} className="text-brand group-hover:scale-105 transition-transform" /> Pix
            </button>
            <button onClick={() => handleComplete('credit')} disabled={cart.length === 0} className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-smart text-[10px] font-black hover:bg-black transition-all active:scale-98 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm group cursor-pointer">
              <CreditCard size={18} className="text-indigo-400 group-hover:scale-105 transition-transform" /> Cartão
            </button>
            <button onClick={() => handleComplete('cash')} disabled={cart.length === 0} className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-smart text-[10px] font-black hover:bg-black transition-all active:scale-98 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm group cursor-pointer">
              <Banknote size={18} className="text-emerald-400 group-hover:scale-105 transition-transform" /> Dinheiro
            </button>
          </div>
        </div>
      </div>

      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-scale-in">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-50">
                <CheckCircle2 size={56} className="animate-bounce" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Venda Concluída!</h3>
              <p className="text-slate-600 font-bold tracking-tight text-lg">O pedido <span className="text-indigo-600 font-black">#{lastSale.id}</span> foi registrado.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => printReceipt(lastSale, 'thermal')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm active:scale-95"
                >
                  <Ticket size={40} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  <div className="text-left w-full text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-700">Cupom Não Fiscal</p>
                    <p className="text-base font-black text-slate-900">Térmica 58mm</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => printReceipt(lastSale, 'a4')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group shadow-sm active:scale-95"
                >
                  <FileText size={40} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  <div className="text-left w-full text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-700">Relatório Completo</p>
                    <p className="text-base font-black text-slate-900">Impressora A4</p>
                  </div>
                </button>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Novo Pedido
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
