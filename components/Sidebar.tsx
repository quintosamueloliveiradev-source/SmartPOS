import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, ShoppingCart, Package, History, Store, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { user, profile, signOut } = useStore();

  const navItems: { id: ViewState; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'pos', label: 'Ponto de Venda', icon: <ShoppingCart size={20} /> },
    { id: 'inventory', label: 'Estoque', icon: <Package size={20} /> },
    { id: 'history', label: 'Vendas', icon: <History size={20} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
    { 
      id: 'admin', 
      label: 'Painel Admin', 
      icon: <ShieldCheck size={20} />, 
      hidden: user?.email !== 'backup02atelietetemimos@gmail.com' 
    },
  ];

  return (
    <div className="w-20 lg:w-64 bg-dark text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-700">
        <div className="bg-primary p-2 rounded-lg">
          <Store size={24} className="text-white" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <h1 className="text-xl font-bold truncate">Vendeei</h1>
          <p className="text-[10px] text-emerald-400 truncate uppercase tracking-widest font-black">{profile?.role === 'admin' ? 'Super Admin' : 'Pro'}</p>
          <p className="text-[11px] text-white truncate mt-1 font-bold" title={user?.email}>{user?.email}</p>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-2 lg:px-4 space-y-2 overflow-y-auto">
        {navItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-emerald-900/40 ring-1 ring-white/20' 
                : 'text-slate-200 hover:bg-white/10 hover:text-white font-bold'
            }`}
          >
            {item.icon}
            <span className="hidden lg:block font-black tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-4 border-t border-slate-700 mt-auto bg-slate-900/50">
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors font-black"
        >
          <LogOut size={20} />
          <span className="hidden lg:block">Sair</span>
        </button>
        <div className="text-center lg:text-left text-[10px] text-slate-300 font-mono font-bold">
          <span className="hidden lg:block uppercase opacity-70">Build SaaS v2.0.1</span>
        </div>
      </div>
    </div>
  );
};
