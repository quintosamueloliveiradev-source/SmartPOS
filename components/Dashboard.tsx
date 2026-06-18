
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

  const salesData = useMemo(() => {
    // Agrupa e soma as vendas dos últimos 7 dias corridos
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    return days.map(day => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dailyTotal = activeSales
        .filter(sale => sale.timestamp >= dayStart && sale.timestamp < dayEnd)
        .reduce((sum, sale) => sum + sale.total, 0);

      const dayOfWeek = day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayAndMonth = day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const label = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} (${dayAndMonth})`;

      return {
        name: label,
        valor: parseFloat(dailyTotal.toFixed(2))
      };
    });
  }, [activeSales]);

  // Componente de Tooltip Moderno Customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-slate-800 shadow-xl font-sans text-xs flex flex-col gap-1">
          <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-emerald-400 font-bold">Faturamento:</span>
            <span className="font-extrabold text-white text-sm">
              R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

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
          {activeSales.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} 
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar 
                    dataKey="valor" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 p-6 text-center">
              <TrendingUp size={40} className="text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Sem dados de faturamento</p>
              <p className="text-slate-400 text-xs max-w-xs mt-1">Realize vendas no módulo PDV para gerar gráficos e estatísticas de vendas em tempo real.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-yellow-600" />
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest text-[11px]">Mais Vendidos</h3>
          </div>
          {topProducts.length > 0 ? (
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
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <Trophy size={32} className="text-slate-200 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nenhum ranking disponível</p>
              <p className="text-slate-400 text-xs max-w-[200px] mt-1">Os produtos mais vendidos serão calculados aqui automaticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
