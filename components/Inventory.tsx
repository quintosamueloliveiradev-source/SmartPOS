
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
    <div className="space-y-6 animate-fade-in pr-2">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-[#e5eeff] shadow-xs">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">Gerenciamento de Estoque</h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">Controle total sobre seus produtos e margens.</p>
        </div>
        <button 
          onClick={() => { 
            setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); 
            setIsEditing(false); 
            setIsModalOpen(true); 
          }} 
          className="flex items-center gap-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 active:scale-95"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5eeff] overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white min-h-[400px]">
            <div className="w-14 h-14 bg-[#f8f9ff] text-indigo-600 rounded-lg flex items-center justify-center mb-5 border border-[#e5eeff] shadow-xs">
              <Box size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] mb-2 tracking-tight">Nenhum produto cadastrado no estoque</h3>
            <p className="text-slate-500 text-xs max-w-sm mb-6 leading-relaxed">
              Você ainda não cadastrou produtos. Comece adicionando um novo produto neste painel para controlar seu estoque e realizar vendas no PDV.
            </p>
            <button 
              onClick={() => { 
                setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); 
                setIsEditing(false); 
                setIsModalOpen(true); 
              }}
              className="flex items-center gap-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white px-5 py-3 rounded-lg font-semibold text-sm transition-all shadow-md shadow-[#3525cd]/10 active:scale-95"
            >
              <Plus size={16} /> Cadastrar Meu Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 bg-[#f8f9ff] flex flex-col md:flex-row gap-4 border-b border-[#e5eeff]">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome do produto..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e5eeff] rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 shadow-xs" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="relative">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                 <select 
                  className="pl-11 pr-10 py-2.5 bg-white border border-[#e5eeff] rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer min-w-[200px]" 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f9ff] text-slate-700 font-bold border-b border-[#e5eeff] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-5">Produto</th>
                    <th className="p-5">Preço Venda</th>
                    <th className="p-5">Preço Custo</th>
                    <th className="p-5">Margem</th>
                    <th className="p-5">Estoque</th>
                    <th className="p-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eeff] bg-white">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        Nenhum produto correspondente aos filtros de busca encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const margin = p.price - p.costPrice;
                      const marginPercent = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : '0';
                      return (
                        <tr key={p.id} className="hover:bg-[#f8f9ff]/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <img src={p.imageUrl} className="w-12 h-12 rounded-lg object-cover border border-[#e5eeff]" />
                              <div>
                                <p className="font-semibold text-[#0b1c30] text-base">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.category}</p>
                                  {p.barcode && (
                                    <span className="text-[10px] font-mono bg-[#f8f9ff] text-[#3525cd] px-1.5 py-0.5 rounded border border-[#e5eeff] flex items-center gap-1">
                                      <Barcode size={10} /> {p.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-secondary text-base">R$ {p.price.toFixed(2)}</td>
                          <td className="p-4 text-slate-500 font-medium text-sm">R$ {p.costPrice.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${Number(marginPercent) > 30 ? 'bg-emerald-50 text-secondary' : 'bg-amber-50 text-amber-700'}`}>
                              {marginPercent}% Lucro
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Archive size={14} className={p.stock < 5 ? 'text-[#ba1a1a]' : 'text-slate-400'} />
                              <span className={`font-bold text-base ${p.stock < 5 ? 'text-[#ba1a1a]' : 'text-slate-700'}`}>
                                {p.stock} <span className="text-xs font-normal text-slate-400">un</span>
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right space-x-1">
                            <button 
                              onClick={() => { setFormData(p); setIsEditing(true); setIsModalOpen(true); }} 
                              className="p-2 text-slate-400 hover:text-primary hover:bg-[#eff4ff] rounded-lg transition-all"
                            >
                              <Edit2 size={16}/>
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({id: p.id, name: p.name})} 
                              className="p-2 text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 rounded-lg transition-all"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-[#e5eeff]">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 text-[#ba1a1a] rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#0b1c30]">Excluir Produto?</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Você está prestes a remover <strong>{deleteTarget.name}</strong> definitivamente do sistema. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-2.5 bg-[#ba1a1a] hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  Confirmar Exclusão
                </button>
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-2.5 bg-[#f8f9ff] text-slate-600 hover:bg-[#e5eeff] border border-[#e5eeff] rounded-lg font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-[#e5eeff]">
            <div className="p-5 border-b border-[#e5eeff] flex justify-between items-center bg-[#f8f9ff]">
              <div>
                <h3 className="text-lg font-bold text-[#0b1c30]">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
                <p className="text-slate-500 font-medium text-xs mt-0.5">Preencha os dados com atenção para o controle financeiro.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-[#e5eeff] rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-slate-400" /> Nome do Produto
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg text-slate-800 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ex: Café Espresso Especial"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={12} className="text-secondary" /> Preço de Venda
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg text-[#0b1c30] font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={12} className="text-slate-400" /> Preço de Custo
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg text-slate-700 font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    value={formData.costPrice || ''} 
                    onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Barcode size={12} className="text-slate-400" /> Código de Barras
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 p-2.5 bg-white border border-[#e5eeff] rounded-lg text-slate-800 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-slate-300 font-mono" 
                    placeholder="EAN-13, EAN-8, etc."
                    value={formData.barcode || ''} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Box size={12} className="text-slate-400" /> Categoria
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg text-slate-800 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    placeholder="Ex: Bebidas"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Archive size={12} className="text-slate-400" /> Estoque Inicial
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg text-slate-800 font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    value={formData.stock || ''} 
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-slate-400" /> URL da Imagem do Produto
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-white border border-[#e5eeff] rounded-lg font-medium text-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-slate-300" 
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e5eeff]">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2.5 border border-[#e5eeff] rounded-lg font-bold text-slate-500 hover:bg-[#f8f9ff] transition-all uppercase tracking-wider text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-600/10 uppercase tracking-wider text-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
