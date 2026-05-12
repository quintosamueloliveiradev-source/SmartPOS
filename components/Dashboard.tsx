
import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Trophy, PieChart } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { products, sales, allTimeStats, loading } = useStore();

  const activeSales = useMemo(() => sales.filter(s => s.status !== 'canceled'), [sales]);
  const totalStockValue = useMemo(() => products.reduce((acc, p) => acc + (p.price * p.stock), 0), [products]);

  const topProducts = useMemo(() => {
    const productCounts: Record<string, number> = {};
    activeSales.forEach(sale => {
      sale.items.forEach(item => {
        productCounts[item.id] = (productCounts[item.id] || 0) + item.quantity;
      });
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        const product = products.find(p => p.id === id);
        return product ? { ...product, soldCount: count } : null;
      })
      .filter((item): item is (typeof products[0] & { soldCount: number }) => item !== null);
  }, [activeSales, products]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Sincronizando com Supabase...</p>
        </div>
      </div>
    );
  }

  const salesData = activeSales.slice(0, 7).reverse().map(sale => ({
    name: new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    valor: sale.total
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral do Negócio</h2>
        <p className="text-slate-600 font-bold">Métricas de faturamento, lucro e estoque em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-black uppercase tracking-wider">Faturamento</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {allTimeStats.revenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-black uppercase tracking-wider">Lucro Estimado</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">R$ {allTimeStats.totalProfit.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-black uppercase tracking-wider">Valor em Estoque</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {totalStockValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative">
          {products.filter(p => p.stock < 5).length > 0 && (
            <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
          )}
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-black uppercase tracking-wider">Alertas de Reposição</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{products.filter(p => p.stock < 5).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Vendas Recentes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-yellow-600" />
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest text-[11px]">Mais Vendidos</h3>
          </div>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <span className="text-xs font-black text-slate-400 w-4">{i + 1}</span>
                <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.soldCount} unidades</p>
                </div>
                <p className="text-sm font-black text-emerald-600">R$ {p.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
