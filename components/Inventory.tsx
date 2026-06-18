
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
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Estoque</h2>
          <p className="text-slate-500 text-sm">Controle total sobre seus produtos e margens.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
          <Plus size={22} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white min-h-[400px]">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-5 border-2 border-slate-200/60 shadow-sm">
              <Box size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum produto cadastrado no estoque</h3>
            <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
              Você ainda não cadastrou produtos. Comece adicionando um novo produto neste painel para controlar seu estoque e realizar vendas no PDV.
            </p>
            <button 
              onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 text-sm"
            >
              <Plus size={18} /> Cadastrar Meu Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 bg-slate-50 flex flex-col md:flex-row gap-4 border-b-2 border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome do produto..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all font-bold text-slate-900 placeholder:text-slate-500 shadow-sm" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="relative">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                 <select 
                  className="pl-12 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all font-black text-slate-800 appearance-none cursor-pointer min-w-[200px]" 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-200 text-slate-800 font-black border-b border-slate-300 uppercase tracking-widest">
                  <tr>
                    <th className="p-5 text-[11px]">Produto</th>
                    <th className="p-5 text-[11px]">Preço Venda</th>
                    <th className="p-5 text-[11px]">Preço Custo</th>
                    <th className="p-5 text-[11px]">Margem</th>
                    <th className="p-5 text-[11px]">Estoque</th>
                    <th className="p-5 text-right text-[11px]">Ações</th>
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
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                              <div>
                                <p className="font-black text-slate-900 text-base">{p.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.category}</p>
                                  {p.barcode && (
                                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                      <Barcode size={10} /> {p.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 font-black text-emerald-600 text-base">R$ {p.price.toFixed(2)}</td>
                          <td className="p-5 text-slate-500 font-medium">R$ {p.costPrice.toFixed(2)}</td>
                          <td className="p-5">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${Number(marginPercent) > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {marginPercent}% Lucro
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <Archive size={14} className={p.stock < 5 ? 'text-red-500' : 'text-slate-400'} />
                              <span className={`font-black text-base ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock} <span className="text-xs font-medium text-slate-400">un</span></span>
                            </div>
                          </td>
                          <td className="p-5 text-right space-x-3">
                            <button 
                              onClick={() => { setFormData(p); setIsEditing(true); setIsModalOpen(true); }} 
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 size={18}/>
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({id: p.id, name: p.name})} 
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18}/>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Excluir Produto?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Você está prestes a remover <strong>{deleteTarget.name}</strong> definitivamente do sistema. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  Sim, Excluir Produto
                </button>
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
                <p className="text-sm text-slate-500">Preencha os dados com atenção para o controle financeiro.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-800"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto bg-white">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} className="text-slate-400" /> Nome do Produto
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl text-slate-900 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ex: Café Espresso Especial"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} className="text-emerald-500" /> Preço de Venda
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl text-emerald-600 font-black focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} className="text-indigo-500" /> Preço de Custo
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl text-indigo-600 font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all" 
                    value={formData.costPrice || ''} 
                    onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Barcode size={12} /> Código de Barras
                </label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 p-4 bg-white border-2 border-slate-300 rounded-2xl text-slate-800 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300" 
                    placeholder="EAN-13, EAN-8, etc."
                    value={formData.barcode || ''} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Box size={12} /> Categoria
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all" 
                    placeholder="Ex: Bebidas"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Archive size={12} /> Estoque Inicial
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-black focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all" 
                    value={formData.stock || ''} 
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} /> URL da Imagem do Produto
                </label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-medium text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300" 
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
