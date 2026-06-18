
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
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
            <input 
              type="text" 
              placeholder="Buscar produto pelo nome..." 
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-400 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-64">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-700" size={20} />
            <input 
              type="text" 
              placeholder="Escanear Código..." 
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-400 rounded-2xl text-lg font-black placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all shadow-md text-indigo-700"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto text-center p-8">
              <div className="p-8 bg-slate-100 rounded-[2rem] mb-6 border-2 border-slate-200 text-slate-400">
                <ShoppingBasket size={64} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Você precisa cadastrar pelo menos um produto no estoque antes de realizar vendas no PDV.
              </p>
            </div>
          ) : !isSearching ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="p-8 bg-slate-100 rounded-full mb-6 border-2 border-slate-200">
                <Search size={64} className="text-slate-300" />
              </div>
              <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Digite acima para buscar produtos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                  className="flex flex-col text-left border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 group"
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    <img src={p.imageUrl} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-red-600 text-xs">SEM ESTOQUE</div>}
                  </div>
                  <div className="p-3 bg-white">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">{p.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-emerald-600">R$ {p.price.toFixed(2)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock} un</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-800 text-white">
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <ShoppingBasket size={20} className="text-emerald-400" />
            Carrinho
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{cart.length} itens no pedido atual</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ShoppingBasket size={64} className="mb-4 text-slate-200" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                <img src={item.imageUrl} className="w-14 h-14 rounded-lg object-cover shadow-sm border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate leading-tight">{item.name}</p>
                  <p className="text-sm text-emerald-700 font-black mt-0.5">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border-2 border-slate-300">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-white hover:text-red-500 rounded-lg transition-all shadow-sm"><Minus size={14}/></button>
                  <span className="text-sm font-black w-6 text-center text-slate-900">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-white hover:text-emerald-500 rounded-lg transition-all shadow-sm"><Plus size={14}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={18}/></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 space-y-3 shadow-2xl z-10">
          {/* Sessão de Ajustes Rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Cliente" 
                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-400 rounded-xl text-xs focus:border-emerald-500 focus:outline-none transition-all font-bold text-slate-900 placeholder:text-slate-500 shadow-sm"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Tag className="absolute left-[6px] top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors" size={12} />
                <input 
                  type="number" 
                  placeholder="Desc." 
                  className="w-full pl-[22px] pr-1 py-2.5 bg-white border-2 border-slate-400 rounded-xl text-xs font-black text-red-600 focus:border-red-500 focus:outline-none transition-all placeholder:text-slate-500 shadow-sm"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="relative flex-1 group">
                <Percent className="absolute left-[6px] top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={12} />
                <input 
                  type="number" 
                  placeholder="Taxa" 
                  className="w-full pl-[22px] pr-1 py-2.5 bg-white border-2 border-slate-400 rounded-xl text-xs font-black text-indigo-600 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-500 shadow-sm"
                  value={cardTaxPercent || ''}
                  onChange={e => setCardTaxPercent(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10">
            <div className="p-3 bg-emerald-500 text-white flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Total Final</span>
                <span className="text-3xl font-black tracking-tighter">R$ {total.toFixed(2)}</span>
              </div>
              {receivedAmount > total && (
                <div className="bg-slate-600 text-white px-4 py-2 rounded-2xl border-2 border-slate-700 shadow-lg animate-bounce text-right ring-4 ring-slate-500/20">
                  <span className="text-[10px] font-black uppercase tracking-widest block leading-none mb-1 text-slate-200">Troco</span>
                  <span className="text-2xl font-black leading-none">R$ {change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-3 pt-4">
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border-2 border-white/20 rounded-xl text-xl font-black text-white focus:border-emerald-400 focus:outline-none transition-all placeholder:text-slate-500"
                  placeholder="Valor Recebido"
                  value={receivedAmount || ''}
                  onChange={e => setReceivedAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleComplete('pix')} disabled={cart.length === 0} className="py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-2 uppercase tracking-widest border-2 border-slate-900 shadow-xl group">
              <QrCode size={24} className="text-teal-400 group-hover:scale-110 transition-transform" /> Pix
            </button>
            <button onClick={() => handleComplete('credit')} disabled={cart.length === 0} className="py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-2 uppercase tracking-widest border-2 border-slate-900 shadow-xl group">
              <CreditCard size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Cartão
            </button>
            <button onClick={() => handleComplete('cash')} disabled={cart.length === 0} className="py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-2 uppercase tracking-widest border-2 border-slate-900 shadow-xl group">
              <Banknote size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Dinheiro
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
