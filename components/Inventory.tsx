
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, X, Box, Image as ImageIcon, Filter, ChevronDown, ChevronUp, DollarSign, Tag, Archive, AlertCircle, Barcode } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, deleteProduct, addProduct, updateProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(() => {
    return sessionStorage.getItem('inventory_modal_open') === 'true';
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState<Partial<Product>>(() => {
    const saved = sessionStorage.getItem('inventory_form_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' };
  });
  const [isEditing, setIsEditing] = useState(() => {
    return sessionStorage.getItem('inventory_is_editing') === 'true';
  });
  
  // Estado para o modal de confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    sessionStorage.setItem('inventory_modal_open', isModalOpen.toString());
  }, [isModalOpen]);

  useEffect(() => {
    sessionStorage.setItem('inventory_form_data', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem('inventory_is_editing', isEditing.toString());
  }, [isEditing]);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave = {
      ...formData,
      id: isEditing ? formData.id! : Date.now().toString(),
      price: Number(formData.price),
      costPrice: Number(formData.costPrice),
      stock: Number(formData.stock),
      imageUrl: formData.imageUrl || 'https://placehold.co/200x200?text=Sem+Imagem',
      barcode: formData.barcode || ''
    } as Product;

    if (isEditing) {
      await updateProduct(productToSave);
    } else {
      await addProduct(productToSave);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 lg:p-8 rounded-smart border border-neutral-border shadow-sm">
        <div>
          <h2 className="text-xl font-black text-neutral-text">Gerenciamento de Estoque</h2>
          <p className="text-neutral-muted text-sm mt-1">Controle total sobre seus produtos, custos e estoque.</p>
        </div>
        <button 
          onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }} 
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-smart text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-smart border border-neutral-border overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white min-h-[400px]">
            <div className="w-16 h-16 bg-[#f8fafc] text-neutral-muted/70 rounded-smart flex items-center justify-center mb-5 border border-neutral-border shadow-sm">
              <Box size={24} />
            </div>
            <h3 className="text-lg font-black text-neutral-text mb-2">Nenhum produto cadastrado no estoque</h3>
            <p className="text-neutral-muted text-sm max-w-md mb-8 leading-relaxed">
              Você ainda não cadastrou produtos. Comece adicionando um novo produto neste painel para controlar seu estoque e realizar vendas no PDV.
            </p>
            <button 
              onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-smart text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-98 cursor-pointer"
            >
              <Plus size={16} /> Cadastrar Meu Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 bg-[#f8fafc] flex flex-col md:flex-row gap-4 border-b border-neutral-border">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome do produto..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all font-semibold text-neutral-text placeholder:text-neutral-muted shadow-sm" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="relative">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" size={16} />
                 <select 
                  className="pl-11 pr-10 py-2.5 bg-white border border-neutral-border rounded-smart text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all font-bold text-neutral-text appearance-none cursor-pointer min-w-[200px]" 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" size={14} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#f8fafc] text-neutral-muted font-black border-b border-neutral-border uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Preço Venda</th>
                    <th className="px-6 py-4">Preço Custo</th>
                    <th className="px-6 py-4">Margem</th>
                    <th className="px-6 py-4">Estoque</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                        Nenhum produto correspondente aos filtros de busca encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const margin = p.price - p.costPrice;
                      const marginPercent = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : '0';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-neutral-border shadow-sm" />
                              <div>
                                <p className="font-bold text-neutral-text text-sm">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] text-neutral-muted font-extrabold uppercase tracking-wide">{p.category}</p>
                                  {p.barcode && (
                                    <span className="text-[9px] font-bold bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100/80 flex items-center gap-1">
                                      <Barcode size={10} /> {p.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-brand text-sm">R$ {p.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-neutral-muted font-semibold text-xs text-slate-500">R$ {p.costPrice.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${Number(marginPercent) > 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-amber-50 text-amber-700 border-amber-150'}`}>
                              {marginPercent}% Lucro
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Archive size={13} className={p.stock < 5 ? 'text-red-500' : 'text-slate-400'} />
                              <span className={`font-black text-sm ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock} <span className="text-[10px] font-bold text-neutral-muted">un</span></span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button 
                              onClick={() => { setFormData(p); setIsEditing(true); setIsModalOpen(true); }} 
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16}/>
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({id: p.id, name: p.name})} 
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão Customizado */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-smart shadow-sm w-full max-w-sm overflow-hidden border border-neutral-border">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-smart flex items-center justify-center mb-2 border border-red-100 shadow-sm">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-neutral-text">Excluir Produto?</h3>
              <p className="text-neutral-muted text-sm leading-relaxed">
                Você está prestes a remover <strong>{deleteTarget.name}</strong> definitivamente do sistema. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex flex-col gap-2.5 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-smart font-black uppercase tracking-wider text-xs transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  Sim, Excluir Produto
                </button>
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-3 bg-white border border-neutral-border text-neutral-text hover:bg-slate-50 rounded-smart font-black uppercase tracking-wider text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-smart w-full max-w-xl shadow-lg overflow-hidden border border-neutral-border">
            <div className="p-6 border-b border-neutral-border flex justify-between items-center bg-[#f8fafc]">
              <div>
                <h3 className="text-base font-black text-neutral-text">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
                <p className="text-xs text-neutral-muted mt-0.5">Preencha os dados com atenção para o controle financeiro.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-800"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-5 max-h-[75vh] overflow-y-auto bg-white">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                  <Tag size={12} className="text-slate-400" /> Nome do Produto
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                  placeholder="Ex: Café Espresso Especial"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={12} className="text-brand" /> Preço de Venda
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-black text-brand focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={12} className="text-indigo-500" /> Preço de Custo
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-black text-indigo-600 focus:border-indigo-550 focus:ring-2 focus:ring-indigo-550/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                    value={formData.costPrice || ''} 
                    onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                  <Barcode size={12} /> Código de Barras
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                    placeholder="EAN-13, EAN-8, etc."
                    value={formData.barcode || ''} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                    <Box size={12} /> Categoria
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                    placeholder="Ex: Bebidas"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                    <Archive size={12} /> Estoque Inicial
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted shadow-sm" 
                    value={formData.stock || ''} 
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-muted uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={12} /> URL da Imagem do Produto
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-neutral-muted/60 shadow-sm" 
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex gap-4 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-neutral-border rounded-smart font-bold text-neutral-muted hover:bg-slate-50 transition-colors uppercase tracking-wider text-[10px] cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-smart font-bold transition-all shadow-sm uppercase tracking-wider text-[10px] cursor-pointer">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
