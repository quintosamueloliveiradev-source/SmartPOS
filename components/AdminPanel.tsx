import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Trash2,
  UserCog,
  Plus,
  Activity,
  TrendingUp,
  RefreshCcw,
  Copy,
  Mail,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useStore } from '../context/StoreContext';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const { addToast } = useStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [filterType, setFilterType] = useState<'all' | 'inactive' | 'expiring' | 'pro'>('all');
  const [pricing, setPricing] = useState({ price: 14.90, announcement: '' });
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    trialsToday: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchSettings();

    // Close menu on click outside
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('*');
      if (data) {
        const price = data.find(s => s.key === 'subscription_price')?.value || 14.90;
        const announcement = data.find(s => s.key === 'global_announcement')?.value || '';
        setPricing({ price, announcement });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async () => {
    try {
      await supabase.from('app_settings').upsert([
        { key: 'subscription_price', value: pricing.price },
        { key: 'global_announcement', value: pricing.announcement }
      ]);
      addToast('Configurações salvas com sucesso', 'success');
    } catch (err) {
      addToast('Erro ao salvar configurações', 'error');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      
      // Calculate Stats
      const active = data?.filter(u => u.subscription_status === 'active').length || 0;
      setStats({
        totalUsers: data?.length || 0,
        activeSubscriptions: active,
        monthlyRevenue: active * pricing.price,
        trialsToday: data?.filter(u => {
          const created = new Date(u.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length || 0
      });

      // Prepare Chart Data (Evolution last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
      }).reverse();

      const evolution = last30Days.map(dateStr => {
        const count = data?.filter(u => new Date(u.created_at).toLocaleDateString() === dateStr).length || 0;
        const mrr = (data?.filter(u => 
          u.subscription_status === 'active' && 
          new Date(u.created_at) <= new Date(dateStr.split('/').reverse().join('-'))
        ).length || 0) * pricing.price;

        return { 
          name: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], 
          cadastros: count,
          mrr: mrr
        };
      });
      setChartData(evolution);

    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: newStatus,
          subscription_expiry: newStatus === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_status: newStatus as any } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, subscription_status: newStatus as any } : null);
      }
      const statusLabel = newStatus === 'active' ? 'Ativo' : 'Inativo';
      addToast(`Status alterado para ${statusLabel}`, 'success');
      fetchUsers(); // Refresh stats
    } catch (err) {
      addToast('Erro ao atualizar assinatura', 'error');
    }
  };

  const changeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole as any } : null);
      }
      const roleLabel = newRole === 'admin' ? 'Administrador' : 'Cliente';
      addToast(`Nível de acesso alterado para ${roleLabel}`, 'success');
    } catch (err) {
      addToast('Erro ao atualizar nível de acesso', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este usuário? Todos os produtos e vendas dele serão APAGADOS.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      addToast('Usuário e dados excluídos com sucesso', 'success');
      fetchUsers(); // Refresh stats
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir usuário. Verifique se você tem permissão.', 'error');
    }
  };

  const extendTrial = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trial'
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, subscription_status: 'trial' as any } : null);
      }

      addToast('Teste extendido por +7 dias', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Erro ao extender teste', 'error');
    }
  };

  const formatLastSeen = (date: string | undefined) => {
    if (!date) return 'Nunca';
    const lastSeen = new Date(date);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    
    if (diff < 1000 * 60 * 5) return 'Agora mesmo';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / 3600000)}h atrás`;
    return lastSeen.toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('E-mail copiado para a área de transferência', 'success');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.store_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'inactive') return matchesSearch && u.subscription_status === 'inactive';
    if (filterType === 'pro') return matchesSearch && u.subscription_status === 'active';
    if (filterType === 'expiring') {
      if (!u.subscription_expiry) return false;
      const expiry = new Date(u.subscription_expiry);
      const now = new Date();
      const diffHrs = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return matchesSearch && diffHrs > 0 && diffHrs <= 48;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 lg:p-8 rounded-smart border border-neutral-border shadow-sm">
        <div>
          <h2 className="text-xl font-black text-neutral-text">Painel do Administrador</h2>
          <p className="text-neutral-muted text-sm mt-1">Gestão de assinaturas corporativas, usuários e faturamentos SaaS.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-smart text-xs font-bold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-brand text-white shadow-sm border border-brand/20' : 'bg-[#f8fafc] text-neutral-text border border-neutral-border hover:bg-slate-100'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-smart text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-brand text-white shadow-sm border border-brand/20' : 'bg-[#f8fafc] text-neutral-text border border-neutral-border hover:bg-slate-100'}`}
          >
            Configurações SaaS
          </button>
          <button 
            onClick={fetchUsers}
            className="px-3.5 py-1.5 bg-brand hover:bg-[#059669] text-white rounded-smart flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Recarregar Dados
          </button>
        </div>
      </header>

      {activeTab === 'users' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de Usuários', value: stats.totalUsers, icon: Users, bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
              { label: 'Assinaturas Ativas', value: stats.activeSubscriptions, icon: CreditCard, bg: 'bg-emerald-50 text-brand border border-emerald-100' },
              { label: 'MRR (Mensal)', value: `R$ ${stats.monthlyRevenue.toFixed(2)}`, icon: ArrowUpRight, bg: 'bg-purple-50 text-purple-650 border border-purple-100' },
              { label: 'Novos Hoje', value: stats.trialsToday, icon: ShieldCheck, bg: 'bg-amber-50 text-amber-650 border border-amber-100' }
            ].map((item, i) => (
              <div key={i} className="group relative bg-white p-6 rounded-smart border border-neutral-border shadow-sm hover:border-brand/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-smart ${item.bg}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-neutral-muted uppercase tracking-wider">Status</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse mt-1" />
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-neutral-muted mb-0.5">{item.label}</p>
                  <p className="text-xl font-black text-neutral-text tracking-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-smart border border-neutral-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-text flex items-center gap-2 uppercase tracking-wider">
                    <TrendingUp className="text-brand" size={16} />
                    Evolução da Plataforma
                  </h3>
                  <p className="text-xs text-neutral-muted mt-0.5">Cadastros de Clientes vs Faturamento Equivalente (30 dias)</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand"></div>
                    <span className="text-neutral-text">Cadastros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-neutral-text">MRR (R$)</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                      interval={4}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-smart shadow-lg border border-neutral-border">
                              <p className="text-[10px] font-black text-neutral-muted mb-2 uppercase tracking-wider">{label}</p>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-neutral-text flex items-center gap-1.5 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                                    Novos Usuários
                                  </span>
                                  <span className="font-extrabold text-neutral-text">{payload[0].value}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-neutral-text flex items-center gap-1.5 font-bold font-mono">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    Faturamento Equivalente
                                  </span>
                                  <span className="font-black text-indigo-700">R$ {Number(payload[1].value).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="cadastros" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCadastros)" 
                      animationDuration={1500}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMRR)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-neutral-text mb-5 flex items-center gap-2 uppercase tracking-wider">
                  <Filter className="text-brand" size={16} />
                  Filtros Disponíveis
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'Todos os Usuários', icon: Users, count: stats.totalUsers },
                    { id: 'pro', label: 'Assinantes ATIVOS', icon: CreditCard, count: stats.activeSubscriptions },
                    { id: 'inactive', label: 'Inativos / Cancelados', icon: XCircle, count: users.filter(u => u.subscription_status === 'inactive').length },
                    { id: 'expiring', label: 'Vencendo em 48h', icon: Clock, count: users.filter(u => {
                      if (!u.subscription_expiry) return false;
                      const expiry = new Date(u.subscription_expiry);
                      const diffHrs = (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                      return diffHrs > 0 && diffHrs <= 48;
                    }).length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id as any)}
                      className={`w-full flex items-center justify-between p-3 rounded-smart border transition-all text-left cursor-pointer ${filterType === f.id ? 'bg-brand text-white border-brand shadow-sm font-bold' : 'bg-[#f8fafc] text-neutral-text border-neutral-border hover:bg-slate-100 font-semibold mb-0.5'}`}
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <f.icon size={14} className={filterType === f.id ? 'text-white' : 'text-neutral-muted'} />
                        {f.label}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-smart font-black ${filterType === f.id ? 'bg-white/20' : 'bg-white border border-neutral-border text-neutral-text'}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 p-4 bg-emerald-50 rounded-smart border border-emerald-150">
                <p className="text-[10px] text-brand font-black uppercase tracking-wider mb-0.5">Previsão Faturamento SaaS</p>
                <p className="text-lg font-black text-neutral-text">R$ {stats.monthlyRevenue.toFixed(2)} <span className="text-xs font-bold text-neutral-muted">/ mês</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-smart border border-neutral-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar por e-mail ou nome da loja..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-neutral-border rounded-smart text-sm font-semibold text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="text-xs font-bold text-neutral-muted uppercase tracking-wider">
                Exibindo <span className="text-neutral-text font-black">{filteredUsers.length}</span> usuários cadastrados
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-neutral-border">
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider">Usuário / Loja</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider">Último Acesso</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider">Última Venda</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider">Validade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-muted uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-10 text-center text-neutral-muted text-xs font-semibold">Carregando usuários...</td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-neutral-muted text-xs font-semibold">Nenhum registro de usuário correspondente encontrado</td>
                    </tr>
                  ) : filteredUsers.map((userProfile) => (
                    <tr key={userProfile.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-text text-sm">{userProfile.email}</span>
                          <span className="text-[10px] text-neutral-muted font-black uppercase tracking-wider mt-0.5">{userProfile.store_name || 'Loja sem nome definido'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-smart text-[10px] font-black uppercase tracking-wider border
                          ${userProfile.subscription_status === 'active' ? 'bg-emerald-55 text-brand border-emerald-100' : 
                            userProfile.subscription_status === 'trial' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}
                        `}>
                          {userProfile.subscription_status === 'active' ? 'Ativo' : 
                           userProfile.subscription_status === 'trial' ? 'Demonstração' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-neutral-text">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${userProfile.last_seen_at && (new Date().getTime() - new Date(userProfile.last_seen_at).getTime() < 300000) ? "bg-brand animate-pulse" : "bg-slate-350"}`} />
                          {formatLastSeen(userProfile.last_seen_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-neutral-text">
                        {userProfile.last_sale_at ? new Date(userProfile.last_sale_at).toLocaleDateString('pt-BR') : <span className="text-slate-300">Nenhuma</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-neutral-text">
                        {userProfile.subscription_expiry ? new Date(userProfile.subscription_expiry).toLocaleDateString('pt-BR') : <span className="text-slate-300">Indeterminado</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(userProfile)}
                          className="inline-flex items-center justify-center p-1.5 bg-[#f8fafc] hover:bg-slate-100 rounded-smart border border-neutral-border text-neutral-muted hover:text-neutral-text transition-all cursor-pointer"
                          title="Gerenciar Contrato"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Management Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div 
                className="bg-white w-full max-w-xl rounded-smart shadow-xl overflow-hidden border border-neutral-border animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-neutral-border bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand text-white rounded-smart">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-neutral-text uppercase tracking-wider">Gestão de Conta</h3>
                      <p className="text-[11px] text-neutral-muted font-bold mt-0.5">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-neutral-text cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#f8fafc] rounded-smart border border-neutral-border text-center">
                      <p className="text-[9px] font-black text-neutral-muted uppercase tracking-widest mb-1 leading-none">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-smart text-[9px] font-black uppercase
                        ${selectedUser.subscription_status === 'active' ? 'bg-emerald-50 text-brand border border-emerald-100' : 
                          selectedUser.subscription_status === 'trial' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100'}
                      `}>
                        {selectedUser.subscription_status}
                      </span>
                    </div>
                    <div className="p-3.5 bg-[#f8fafc] rounded-smart border border-neutral-border text-center">
                      <p className="text-[9px] font-black text-neutral-muted uppercase tracking-widest mb-1 leading-none">Cargo</p>
                      <p className="text-xs font-black text-neutral-text uppercase leading-tight mt-1">{selectedUser.role === 'admin' ? 'Admin' : 'Cliente'}</p>
                    </div>
                    <div className="p-3.5 bg-[#f8fafc] rounded-smart border border-neutral-border text-center">
                      <p className="text-[9px] font-black text-neutral-muted uppercase tracking-widest mb-1 leading-none">Loja</p>
                      <p className="text-xs font-black text-neutral-text truncate leading-tight mt-1">{selectedUser.store_name || 'N/A'}</p>
                    </div>
                    <div className="p-3.5 bg-[#f8fafc] rounded-smart border border-neutral-border text-center">
                      <p className="text-[9px] font-black text-neutral-muted uppercase tracking-widest mb-1 leading-none">Expiração</p>
                      <p className="text-xs font-black text-neutral-text leading-tight mt-1">
                        {selectedUser.subscription_expiry ? new Date(selectedUser.subscription_expiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-neutral-muted uppercase tracking-wider">Ações Administrativas</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => { toggleSubscription(selectedUser.id, selectedUser.subscription_status); }}
                        className={`flex items-center gap-3 p-3.5 rounded-smart border transition-all text-left cursor-pointer group ${
                          selectedUser.subscription_status === 'active' 
                          ? 'border-red-150 bg-red-50/30 hover:bg-red-50' 
                          : 'border-emerald-150 bg-emerald-50/30 hover:bg-emerald-50'
                        }`}
                      >
                        <div className={`p-2 rounded-smart ${
                          selectedUser.subscription_status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-brand'
                        }`}>
                          <CreditCard size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-text">
                            {selectedUser.subscription_status === 'active' ? 'Suspender Assinatura' : 'Ativar Assinatura PRO'}
                          </p>
                          <p className="text-[10px] text-neutral-muted font-medium mt-0.5">Alternar status financeiro</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { extendTrial(selectedUser.id); }}
                        className="flex items-center gap-3 p-3.5 rounded-smart border border-blue-150 bg-blue-50/30 hover:bg-blue-50 transition-all text-left cursor-pointer group"
                      >
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-smart">
                          <Plus size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-text">Estender Teste</p>
                          <p className="text-[10px] text-neutral-muted font-medium mt-0.5">Adicionar +7 dias bônus</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { changeRole(selectedUser.id, selectedUser.role); }}
                        className="flex items-center gap-3 p-3.5 rounded-smart border border-purple-150 bg-purple-50/30 hover:bg-purple-50 transition-all text-left cursor-pointer group"
                      >
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-smart">
                          <UserCog size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-text">Alterar Cargo</p>
                          <p className="text-[10px] text-neutral-muted font-medium mt-0.5">Alternar Administrador</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { copyToClipboard(selectedUser.email); }}
                        className="flex items-center gap-3 p-3.5 rounded-smart border border-neutral-border bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
                      >
                        <div className="p-2 bg-slate-100 text-neutral-muted rounded-smart">
                          <Copy size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-text">Copiar Contato</p>
                          <p className="text-[10px] text-neutral-muted font-medium mt-0.5">E-mail para suporte</p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-4 border-t border-neutral-border">
                      <button
                        onClick={() => { if(confirm('Esta ação removerá todos os dados deste usuário permanentemente. Continuar?')) { deleteUser(selectedUser.id); } }}
                        className="w-full flex items-center justify-between p-4 rounded-smart bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/50 group-hover:bg-red-700 group-hover:text-white rounded-smart text-red-750">
                            <Trash2 size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black">Remover Conta do Sistema</p>
                            <p className="text-[10px] opacity-80 mt-0.5">Exclusão imediata, definitiva e irreversível.</p>
                          </div>
                        </div>
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-emerald-50 text-brand rounded-smart flex items-center justify-center mb-4">
                <CreditCard size={20} />
              </div>
              <h3 className="text-sm font-black text-neutral-text uppercase tracking-wider mb-1">Preço da Assinatura</h3>
              <p className="text-xs text-neutral-muted mb-6">Defina o valor base cobrado na geração automática de faturas do Pix.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-sm">R$</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-neutral-border rounded-smart text-base font-black text-neutral-text focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                    value={pricing.price}
                    onChange={(e) => setPricing({ ...pricing, price: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={updateSettings}
                className="w-full py-2.5 bg-brand hover:bg-[#059669] text-white rounded-smart font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                Atualizar Preço
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-smart border border-neutral-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-smart flex items-center justify-center mb-4">
                <Activity size={20} />
              </div>
              <h3 className="text-sm font-black text-neutral-text uppercase tracking-wider mb-1">Aviso Global</h3>
              <p className="text-xs text-neutral-muted mb-6">Transmita comunicados para todos os administradores logados em tempo real.</p>
              
              <div className="space-y-4">
                <textarea 
                  className="w-full p-3 bg-[#f8fafc] border border-neutral-border rounded-smart focus:border-amber-500 focus:bg-white focus:outline-none h-24 text-xs font-semibold text-neutral-text transition-all leading-relaxed placeholder:text-slate-350"
                  placeholder="Ex: Instabilidade no provedor identificada. Nova atualização às 23:00..."
                  value={pricing.announcement}
                  onChange={(e) => setPricing({ ...pricing, announcement: e.target.value })}
                />
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={updateSettings}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-smart font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                Publicar Aviso Global
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-smart text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 blur-[60px] rounded-full -mr-24 -mt-24 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 text-white rounded-smart flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-black mb-1 uppercase tracking-wider text-slate-100">Resumo Operacional</h3>
              <p className="text-xs text-slate-400 mb-6">Mapeamento dinâmico de performance financeira.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-smart border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Taxa Churn</p>
                  <p className="text-base font-black">{(users.filter(u => u.subscription_status === 'inactive').length / users.length * 100 || 0).toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-white/5 rounded-smart border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ticket Médio</p>
                  <p className="text-base font-black">R$ {pricing.price.toFixed(0)}</p>
                </div>
                <div className="col-span-2 p-3 bg-emerald-500/10 rounded-smart border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-0.5">Novos Testes (Trial)</p>
                    <p className="text-xl font-black text-brand">{users.filter(u => u.subscription_status === 'trial').length}</p>
                  </div>
                  <div className="text-brand">
                    <TrendingUp size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
