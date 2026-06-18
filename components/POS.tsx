
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6.5rem)] gap-6 overflow-hidden pr-2">
      {/* Catalog / Search Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#e5eeff] overflow-hidden">
        <div className="p-4 border-b border-[#e5eeff] bg-[#f8f9ff]/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto pelo nome..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#e5eeff] rounded-lg text-base font-semibold text-slate-850 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-64">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3525cd]" size={18} />
            <input 
              type="text" 
              placeholder="Código de barras..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#e5eeff] rounded-lg text-base font-bold placeholder:text-slate-400 focus:border-[#3525cd] focus:ring-1 focus:ring-[#3525cd] focus:outline-none transition-all shadow-xs text-[#3525cd] font-mono"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto text-center p-8">
              <div className="p-6 bg-[#f8f9ff] rounded-xl mb-4 border border-[#e5eeff] text-[#3525cd]">
                <ShoppingBasket size={40} />
              </div>
              <h3 className="text-lg font-bold text-[#0b1c30] mb-1 tracking-tight">Nenhum produto cadastrado</h3>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                Você precisa cadastrar pelo menos um produto no estoque antes de realizar vendas no PDV.
              </p>
            </div>
          ) : !isSearching ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="p-6 bg-[#f8f9ff] rounded-full mb-4 border border-[#e5eeff] text-[#3525cd]/70">
                <Search size={40} />
              </div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Digite acima para buscar produtos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                  className="flex flex-col text-left border border-[#e5eeff] bg-white rounded-xl overflow-hidden hover:border-[#3525cd] hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 group"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-slate-50">
                    <img src={p.imageUrl} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/70 flex items-center justify-center font-bold text-[#ba1a1a] text-xs">SEM ESTOQUE</div>}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-[#0b1c30] truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-450 mb-2 uppercase font-medium tracking-wider">{p.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#3525cd]">R$ {p.price.toFixed(2)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.stock < 5 ? 'bg-red-50 text-[#ba1a1a]' : 'bg-[#f8f9ff] text-slate-600'}`}>{p.stock} un</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-xs border border-[#e5eeff] overflow-hidden">
        <div className="p-4 border-b border-[#e5eeff] bg-[#f8f9ff]/50">
          <h2 className="font-bold flex items-center gap-2 text-base text-[#0b1c30] tracking-tight">
            <ShoppingBasket size={18} className="text-[#3525cd]" />
            Carrinho
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{cart.length} itens no pedido atual</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9ff]/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBasket size={48} className="mb-3 text-[#cbdbf5]" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-[#e5eeff] rounded-xl shadow-xs hover:border-[#3525cd]/40 transition-colors">
                <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover border border-[#e5eeff]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0b1c30] truncate leading-tight">{item.name}</p>
                  <p className="text-sm text-[#3525cd] font-bold mt-0.5">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-[#f8f9ff] p-1.5 rounded-lg border border-[#e5eeff]">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-0.5 hover:bg-white hover:text-[#ba1a1a] rounded transition-all"><Minus size={12}/></button>
                  <span className="text-xs font-bold w-5 text-center text-slate-800 font-mono">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-0.5 hover:bg-white hover:text-secondary rounded transition-all"><Plus size={12}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-[#ba1a1a] p-1 transition-colors"><Trash2 size={16}/></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-[#e5eeff] space-y-4">
          {/* Customer / Discount / Taxes Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Identificar Cliente" 
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5eeff] rounded-lg text-xs focus:border-[#3525cd] focus:ring-1 focus:ring-[#3525cd] focus:outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400 shadow-xs"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#ba1a1a]" size={12} />
                <input 
                  type="number" 
                  placeholder="Desc." 
                  className="w-full pl-[22px] pr-1 py-2 bg-white border border-[#e5eeff] rounded-lg text-xs font-bold text-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a] focus:outline-none transition-all placeholder:text-slate-400 shadow-xs"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="relative flex-1">
                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3525cd]" size={12} />
                <input 
                  type="number" 
                  placeholder="Taxa" 
                  className="w-full pl-[22px] pr-1 py-2 bg-white border border-[#e5eeff] rounded-lg text-xs font-bold text-[#3525cd] focus:border-[#3525cd] focus:ring-1 focus:ring-[#cbdbf5] focus:outline-none transition-all placeholder:text-slate-400 shadow-xs"
                  value={cardTaxPercent || ''}
                  onChange={e => setCardTaxPercent(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#101928] rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#3525cd] text-white flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-indigo-200">Total Final</span>
                <span className="text-2xl font-black mt-1">R$ {total.toFixed(2)}</span>
              </div>
              {receivedAmount > total && (
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-xs text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">Troco</span>
                  <span className="text-lg font-bold font-mono">R$ {change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
                <input 
                  type="number" 
                  className="w-full pl-9 pr-4 py-2 bg-[#1d2739] border border-slate-700 rounded-lg text-base font-bold text-white focus:border-[#4d44e3] focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                  placeholder="Valor Recebido (Troco)"
                  value={receivedAmount || ''}
                  onChange={e => setReceivedAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Quick Payment Options */}
          <div className="grid grid-cols-3 gap-2.5">
            <button 
              onClick={() => handleComplete('pix')} 
              disabled={cart.length === 0} 
              className="py-3 bg-[#f8f9ff] text-[#0b1c30] border border-[#e5eeff] hover:border-[#3525cd] hover:text-[#3525cd] rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs group"
            >
              <QrCode size={20} className="text-[#3525cd] group-hover:scale-105 transition-transform" /> Pix
            </button>
            <button 
              onClick={() => handleComplete('credit')} 
              disabled={cart.length === 0} 
              className="py-3 bg-[#f8f9ff] text-[#0b1c30] border border-[#e5eeff] hover:border-[#3525cd] hover:text-[#3525cd] rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs group"
            >
              <CreditCard size={20} className="text-[#3525cd] group-hover:scale-105 transition-transform" /> Cartão
            </button>
            <button 
              onClick={() => handleComplete('cash')} 
              disabled={cart.length === 0} 
              className="py-3 bg-[#f8f9ff] text-[#0b1c30] border border-[#e5eeff] hover:border-[#3525cd] hover:text-[#3525cd] rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs group"
            >
              <Banknote size={20} className="text-secondary group-hover:scale-105 transition-transform" /> Dinheiro
            </button>
          </div>
        </div>
      </div>

      {/* Success Receipt Modal */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#e5eeff] p-6 relative">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-secondary rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-bold text-[#0b1c30]">Venda Concluída!</h3>
              <p className="text-slate-500 text-sm">O pedido <span className="text-[#3525cd] font-bold font-mono">#{lastSale.id}</span> foi registrado.</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => printReceipt(lastSale, 'thermal')}
                  className="flex flex-col items-center gap-2.5 p-4 bg-white border border-[#e5eeff] rounded-xl hover:border-primary hover:bg-[#f8f9ff] transition-all group shadow-xs active:scale-95"
                >
                  <Ticket size={28} className="text-slate-450 group-hover:text-primary transition-colors" />
                  <div className="text-center w-full">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cupom Não Fiscal</p>
                    <p className="text-sm font-bold text-[#0b1c30]">Térmica 58mm</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => printReceipt(lastSale, 'a4')}
                  className="flex flex-col items-center gap-2.5 p-4 bg-white border border-[#e5eeff] rounded-xl hover:border-primary hover:bg-[#f8f9ff] transition-all group shadow-xs active:scale-95"
                >
                  <FileText size={28} className="text-slate-450 group-hover:text-primary transition-colors" />
                  <div className="text-center w-full">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Relatório Completo</p>
                    <p className="text-sm font-bold text-[#0b1c30]">Impressora A4</p>
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t border-[#e5eeff] mt-4">
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md active:scale-95"
                >
                  Novo Pedido
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-500 rounded-full hover:bg-[#f8f9ff] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
