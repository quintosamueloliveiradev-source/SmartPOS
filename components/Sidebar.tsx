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
    <div className="w-20 lg:w-64 bg-white text-[#0b1c30] flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-[#e5eeff] transition-all duration-300">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-[#e5eeff]">
        <div className="bg-primary p-2 rounded-lg text-white">
          <Store size={24} />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <h1 className="text-xl font-extrabold text-[#3525cd] tracking-tight">SmartPOS</h1>
          <p className="text-[10px] text-emerald-600 truncate uppercase tracking-widest font-bold">{profile?.role === 'admin' ? 'Super Admin' : 'SaaS Pro'}</p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium" title={user?.email}>{user?.email}</p>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-2 lg:px-4 space-y-1.5 overflow-y-auto">
        {navItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-lg transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-indigo-600/10 font-semibold' 
                : 'text-slate-600 hover:bg-[#f8f9ff] hover:text-primary font-medium'
            }`}
          >
            {item.icon}
            <span className="hidden lg:block tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-4 border-t border-[#e5eeff] mt-auto">
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors font-semibold"
        >
          <LogOut size={20} />
          <span className="hidden lg:block">Sair</span>
        </button>
        <div className="text-center lg:text-left text-[10px] text-slate-400 font-mono">
          <span className="hidden lg:block uppercase opacity-75">Build SaaS v2.0.1</span>
        </div>
      </div>
    </div>
  );
};
