import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { SubscriptionGate } from './components/SubscriptionGate';
import { ViewState } from './types';
import { X, CheckCircle, AlertCircle, Info, Loader2, Megaphone, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { PixCheckoutModal } from './components/PixCheckoutModal';

const GlobalBanner = () => {
  const [announcement, setAnnouncement] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('*').eq('key', 'global_announcement').maybeSingle();
        if (data?.value) setAnnouncement(data.value);
      } catch (err) {
        console.error('Erro ao buscar aviso global:', err);
      }
    };
    fetchAnnouncement();
  }, []);

  if (!announcement || !visible) return null;

  return (
    <div className="bg-amber-500 text-white py-2 px-4 shadow-md sticky top-0 z-[60] flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <Megaphone size={18} className="animate-bounce" />
        <p className="text-sm font-bold">{announcement}</p>
      </div>
      <button onClick={() => setVisible(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-slide-in bg-white
            ${toast.type === 'success' ? 'border-emerald-100 text-emerald-800' : ''}
            ${toast.type === 'error' ? 'border-red-100 text-red-800' : ''}
            ${toast.type === 'info' ? 'border-blue-100 text-blue-800' : ''}
          `}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
          
          <span className="text-sm font-semibold flex-1">{toast.message}</span>
          
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainContent: React.FC = () => {
  const { user, profile, loading, checkSubscription } = useStore();
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = sessionStorage.getItem('pos_current_view');
    return (saved as ViewState) || 'dashboard';
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('pos_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    const isMasterAdmin = user?.email === 'backup02atelietetemimos@gmail.com';
    if (isMasterAdmin && profile?.role === 'admin' && currentView === 'dashboard') {
      setCurrentView('admin');
    }
  }, [profile?.role, user?.email, currentView]);

  const getTrialDaysRemaining = () => {
    if (!profile) return null;
    const status = profile.subscriptionStatus || profile.subscription_status;
    const expiry = profile.trialEndDate || profile.subscription_expiry;
    if (status !== 'trial') return null;
    if (!expiry) return null;
    
    const expiryDate = new Date(expiry);
    const diffTime = expiryDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-slate-900 tracking-tight">SmartPOS SaaS</p>
          <p className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Preparando seu ambiente seguro</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  
  if (!checkSubscription()) return <SubscriptionGate />;

  const daysRemaining = getTrialDaysRemaining();
  const showTrialBanner = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory />;
      case 'history': return <SalesHistory />;
      case 'settings': return <Settings />;
      case 'admin': {
        const isMasterAdmin = user?.email === 'backup02atelietetemimos@gmail.com';
        return isMasterAdmin ? <AdminPanel /> : <Dashboard />;
      }
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GlobalBanner />
      <div className="flex flex-1">
        <Sidebar currentView={currentView} setView={setCurrentView} />
        
        <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300 flex flex-col">
          {/* Warning Pre-Expiry Trial Banner */}
          {showTrialBanner && (
            <div className="mb-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-orange-500/30 animate-fade-in animate-pulse-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <AlertTriangle size={20} className="animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight leading-snug">
                    Sua demonstração gratuita do SmartPOS expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.
                  </p>
                  <p className="text-xs text-white/85 mt-0.5 font-semibold">
                    Evite bloqueios indesejados e ative sua assinatura mensal por apenas R$ 14,90!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="px-5 py-2.5 bg-white hover:bg-amber-50 text-orange-700 hover:text-orange-800 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-orange-500" />
                <span>Ativar Agora</span>
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto w-full flex-1">
            {renderView()}
          </div>
          
          <footer className="w-full text-center pt-8 pb-4 text-sm text-slate-500 mt-auto">
            2026 – © Todos os direitos reservados
          </footer>
        </main>
      </div>

      <PixCheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainContent />
      <ToastContainer />
    </StoreProvider>
  );
};

export default App;
