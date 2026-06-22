import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Minus, X, Trash2, ChevronRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

export const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout State
  const [name, setName] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [catalogSettings, setCatalogSettings] = useState({ isOpen: true });
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get('store');
    
    if (!storeId) {
        setLoading(false);
        return;
    }

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', storeId)
          .gt('stock', 0);
        
        if (error) throw error;
        setProducts(data || []);
        
        const { data: settingsData, error: settingsError } = await supabase
            .from('app_settings')
            .select('value, catalog_open')
            .eq('key', 'catalog_settings_' + storeId)
            .maybeSingle();
            
        if (settingsData) {
            const isOpen = settingsData.catalog_open ?? (settingsData.value?.is_open ?? true);
            setCatalogSettings({ isOpen: Boolean(isOpen) });
            if (settingsData.value) setWhatsappNumber(settingsData.value.whatsapp_number || '');
        }
      } catch (err) {
        console.error('Erro ao buscar produtos/configurações:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('catalog-settings-changes-' + storeId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_settings',
        filter: `key=eq.catalog_settings_${storeId}`
      }, (payload) => {
        const newData = payload.new as any;
        const isOpen = newData.catalog_open ?? (newData.value?.is_open ?? true);
        setCatalogSettings({ isOpen: Boolean(isOpen) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const total = cart.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const itemCount = cart.reduce((sum, p) => sum + p.quantity, 0);

  const sendWhatsAppOrder = () => {
    const cleanPhone = whatsappNumber.replace(/\D/g, ''); 
    
    if (!cleanPhone || cleanPhone === '5511999999999' || cleanPhone.length < 10) {
        alert('O número de WhatsApp da loja não está configurado corretamente.');
        return;
    }

    const addressStr = deliveryType === 'delivery' 
        ? `\n*Endereço:* ${address}, ${number} - ${neighborhood}${reference ? ` (${reference})` : ''}` 
        : '';
    
    const paymentStr = paymentMethod === 'cash' 
        ? `Dinheiro${changeFor ? ` (Troco para R$ ${changeFor})` : ''}`
        : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);

    const message = `*🛍️ NOVO PEDIDO - Vendeei Shop*\n` +
      `--------------------------------\n` +
      `*Cliente:* ${name}\n` +
      `*Entrega:* ${deliveryType === 'pickup' ? 'Retirada no Balcão' : 'Entrega em Casa'}` +
      `${addressStr}\n` +
      `--------------------------------\n` +
      `*ITENS DO PEDIDO:*\n` +
      cart.map(i => `• ${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})`).join('\n') +
      `\n--------------------------------\n` +
      `*Total:* R$ ${total.toFixed(2)}\n` +
      `*Forma de Pagamento:* ${paymentStr}`;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
  }

  if (!catalogSettings.isOpen) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Lock className="text-white" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Loja Fechada</h2>
                  <p className="text-slate-500 mb-6 font-medium">Catálogo Fechado no Momento. Esta loja não está recebendo pedidos agora.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold font-vendeei">Vendeei Shop</h1>
          <span className="text-[10px] uppercase px-2 py-1 rounded-full font-bold bg-green-600">
             Aberto
          </span>
        </div>
        <div className="max-w-4xl mx-auto mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="Buscar produtos..."
              className="w-full bg-slate-800 text-white placeholder:text-slate-500 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
                  <div className="h-40 bg-slate-200 rounded-xl mb-2 flex items-center justify-center text-slate-400 overflow-hidden">
                      <img 
                          src={p.imageUrl || (p as any).image_url || (p as any).image || 'https://placehold.co/200x200?text=Sem+Imagem'}
                          alt={p.name} 
                          className="w-full h-full object-cover" 
                      />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase text-sm">{p.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                      <span className="text-green-600 font-black text-lg">R$ {p.price.toFixed(2)}</span>
                      <button 
                       onClick={() => addToCart(p)}
                       className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition">
                          <Plus size={18} />
                      </button>
                  </div>
              </div>
            ))}
         </div>
      </main>

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-sm h-full overflow-y-auto p-6 animate-slide-in-right">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">Seu Pedido</h2>
                    <button onClick={() => setIsCartOpen(false)}><X size={24}/></button>
                </div>
                
                <div className="space-y-4 mb-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <span className="text-green-600 font-bold">R$ {item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 border rounded"><Minus size={14}/></button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 border rounded"><Plus size={14}/></button>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 border-t pt-4">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" className="w-full border p-2 rounded-lg" />
                    
                    <div className="flex gap-2">
                        <button onClick={() => setDeliveryType('pickup')} className={`flex-1 p-2 rounded-lg ${deliveryType === 'pickup' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>Retirada</button>
                        <button onClick={() => setDeliveryType('delivery')} className={`flex-1 p-2 rounded-lg ${deliveryType === 'delivery' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>Entrega</button>
                    </div>

                    {deliveryType === 'delivery' && (
                        <div className="space-y-2">
                            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua / Avenida" className="w-full border p-2 rounded-lg" />
                            <div className="flex gap-2">
                                <input value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº" className="w-full border p-2 rounded-lg" />
                                <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full border p-2 rounded-lg" />
                            </div>
                            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ponto de referência" className="w-full border p-2 rounded-lg" />
                        </div>
                    )}

                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full border p-2 rounded-lg">
                        <option value="pix">Pagamento: Pix</option>
                        <option value="cash">Pagamento: Dinheiro</option>
                        <option value="card">Pagamento: Cartão</option>
                    </select>

                    {paymentMethod === 'cash' && (
                        <input value={changeFor} onChange={e => setChangeFor(e.target.value)} placeholder="Precisa de troco para quanto?" className="w-full border p-2 rounded-lg" />
                    )}

                    <button 
                        onClick={sendWhatsAppOrder}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        Finalizar via WhatsApp <ChevronRight size={18}/>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Cart Float */}
      {itemCount > 0 && (
        <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold z-30"
        >
           <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>{itemCount} itens</span>
           </div>
           <span>Total: R$ {total.toFixed(2)}</span>
        </button>
      )}
    </div>
  );
};
