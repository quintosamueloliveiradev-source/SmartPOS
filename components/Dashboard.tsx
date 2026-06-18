
import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Trophy, PieChart, Sparkles } from 'lucide-react';

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
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        <div className="bg-[#101928] text-white px-4 py-3 rounded-xl border border-slate-700 shadow-xl font-sans text-xs flex flex-col gap-1">
          <p className="font-bold text-[#eff4ff] uppercase tracking-wider text-[10px]">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[10px] text-indigo-300">Faturamento:</span>
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
    <div className="space-y-6 animate-fade-in pr-2">
      <header className="border-b border-[#e5eeff] pb-5">
        <h2 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">Visão Geral do Negócio</h2>
        <p className="text-slate-500 font-medium text-sm mt-0.5">Métricas de faturamento, lucro e estoque em tempo real.</p>
      </header>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#e5eeff] flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="p-3 bg-[#eff4ff] text-primary rounded-lg shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#464555] font-semibold uppercase tracking-wider">Faturamento</p>
            <p className="text-2xl font-black text-[#0b1c30] tracking-tight">R$ {allTimeStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e5eeff] flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="p-3 bg-emerald-50 text-secondary rounded-lg shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#464555] font-semibold uppercase tracking-wider">Lucro Estimado</p>
            <p className="text-2xl font-black text-secondary tracking-tight">R$ {allTimeStats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e5eeff] flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="p-3 bg-[#eff4ff] text-primary rounded-lg shrink-0">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#464555] font-semibold uppercase tracking-wider">Valor em Estoque</p>
            <p className="text-2xl font-black text-[#0b1c30] tracking-tight">R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e5eeff] flex items-center gap-4 relative hover:shadow-xs transition-shadow">
          {products.filter(p => p.stock < 5).length > 0 && (
            <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
          )}
          <div className="p-3 bg-red-50 text-[#ba1a1a] rounded-lg shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#464555] font-semibold uppercase tracking-wider">Erros/Reposição</p>
            <p className="text-2xl font-black text-[#ba1a1a] tracking-tight">{products.filter(p => p.stock < 5).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#e5eeff]">
          <h3 className="text-base font-bold text-[#0b1c30] mb-5 tracking-tight">Vendas Recentes (Últimos 7 dias)</h3>
          {activeSales.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3525cd" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" strokeOpacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#777587', fontSize: 10, fontWeight: 500 }} 
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#777587', fontSize: 10, fontWeight: 500 }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar 
                    dataKey="valor" 
                    fill="url(#barGradient)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#e5eeff] rounded-xl text-slate-400 p-6 text-center">
              <TrendingUp size={40} className="text-slate-300 mb-2" />
              <p className="font-bold text-[#0b1c30] text-sm">Sem dados de faturamento</p>
              <p className="text-slate-500 text-xs max-w-xs mt-1">Realize vendas no módulo PDV para gerar gráficos e estatísticas de vendas em tempo real.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e5eeff]">
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={18} className="text-indigo-600" />
            <h3 className="text-base font-bold text-[#0b1c30] tracking-tight">Mais Vendidos</h3>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3.5">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-[#f8f9ff] rounded-lg transition-colors border border-transparent hover:border-[#e5eeff]">
                  <span className="text-xs font-bold text-slate-400 w-4 font-mono">{i + 1}</span>
                  <img src={p.imageUrl} className="w-9 h-9 rounded-md object-cover border border-[#e5eeff]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0b1c30] truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.soldCount} vendidos</p>
                  </div>
                  <p className="text-sm font-bold text-[#3525cd]">R$ {p.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <Trophy size={32} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">Nenhum ranking disponível</p>
              <p className="text-slate-400 text-xs max-w-[200px] mt-1">Os produtos mais vendidos serão calculados aqui automaticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
