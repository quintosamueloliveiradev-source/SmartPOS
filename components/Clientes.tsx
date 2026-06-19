import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, X, User, Phone, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import { supabase } from '../lib/supabase';
import { useStore } from '../context/StoreContext';

export const Clientes: React.FC = () => {
  const { user, loading } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [cpf, setCpf] = useState('');

  const fetchCustomers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return;
    }

    if (data) {
      setCustomers(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        contact: c.phone,
        cpf: c.cpf,
        createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
        totalSpent: Number(c.total_spent)
      })));
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || !user) return;

    try {
      if (editingCustomerId) {
        // Update
        const { error } = await supabase
          .from('customers')
          .update({
            name: name.toUpperCase().trim(),
            phone: contact,
            cpf
          })
          .eq('id', editingCustomerId);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('customers')
          .insert([{
            user_id: user.id,
            name: name.toUpperCase().trim(),
            phone: contact,
            cpf
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingCustomerId(null);
      setName('');
      setContact('');
      setCpf('');
      fetchCustomers();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      alert("Erro ao salvar cliente: " + (error.message || JSON.stringify(error)));
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerToDelete.id);
      
      if (error) {
        alert("Erro do Supabase ao deletar: " + error.message);
      } else {
        fetchCustomers(); // Atualiza a lista
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
      }
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      alert("Erro ao deletar cliente: " + (error.message || JSON.stringify(error)));
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setName(customer.name);
    setContact(customer.contact);
    setCpf(customer.cpf);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Gestão de Clientes</h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">Gerencie seus clientes e acompanhe histórico de compras.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomerId(null);
            setName('');
            setContact('');
            setCpf('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total de Clientes', value: customers.length.toString() },
          { label: 'Clientes Ativos', value: customers.length.toString() },
          { label: 'Melhor Cliente', value: customers.length > 0 ? customers.reduce((max, c) => c.totalSpent > (max.totalSpent || 0) ? c : max, customers[0]).name : '-' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{card.label}</p>
            <p className="font-medium font-mono text-lg lg:text-xl text-slate-900 whitespace-nowrap leading-tight mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Lista de Clientes</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="pb-3 font-semibold">Nome</th>
                <th className="pb-3 font-semibold">Contato</th>
                <th className="pb-3 font-semibold">CPF</th>
                <th className="pb-3 font-semibold">Data de Cadastro</th>
                <th className="pb-3 font-semibold">Total Gasto</th>
                <th className="pb-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="py-4">{c.contact}</td>
                    <td className="py-4">{c.cpf}</td>
                    <td className="py-4">{c.createdAt}</td>
                    <td className="py-4 font-mono font-medium text-emerald-600">R$ {c.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteCustomer(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-6">{editingCustomerId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <User size={10} className="text-slate-400" /> Nome Completo
                </label>
                <div className="relative">
                  <input 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva Santos"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium uppercase focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <Phone size={10} className="text-slate-400" /> WhatsApp / Telefone
                </label>
                <div className="relative">
                  <input 
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <CreditCard size={10} className="text-slate-400" /> CPF
                </label>
                <div className="relative">
                  <input 
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="Ex: 000.000.000-00"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Cliente?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Você está prestes a remover o cliente <span className="font-bold text-slate-900">{customerToDelete.name}</span> definitivamente do sistema. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteCustomer}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                SIM, EXCLUIR CLIENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
