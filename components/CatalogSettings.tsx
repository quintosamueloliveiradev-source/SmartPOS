import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Copy, Store, Smartphone, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CatalogSettings: React.FC = () => {
  const { addToast, user } = useStore();
  const [whatsapp, setWhatsapp] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. TRAVA DE AUTENTICAÇÃO:
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value, catalog_open')
          .eq('key', 'catalog_settings_' + user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (data.value) setWhatsapp(data.value.whatsapp_number || '');
          // Garantindo que seja booleano
          setIsCatalogOpen(data.catalog_open ?? true);
        }
      } catch (err) {
        console.error('Erro ao buscar configurações do catálogo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'catalog_settings_' + user.id,
        value: { whatsapp_number: whatsapp },
        catalog_open: isCatalogOpen
      });
      if (error) throw error;
      addToast('Configurações salvas!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      addToast(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Catálogo</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold">Catálogo Online</h2>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <label className="block text-sm font-semibold">WhatsApp para Pedidos</label>
        <div className="flex gap-2">
            <input 
                value={whatsapp} 
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                className="flex-1 p-2 border rounded-lg"
            />
        </div>

        <label className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-semibold text-sm">Catálogo Aberto</span>
            <input type="checkbox" checked={isCatalogOpen} onChange={e => setIsCatalogOpen(e.target.checked)} className="toggle" />
        </label>

        <button onClick={handleSave} className="w-full bg-emerald-600 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2">
            <Save size={18}/> Salvar Configurações
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Store size={18}/> Link do seu Catálogo</h3>
        <code className="bg-slate-100 p-3 rounded-lg block text-sm break-all font-mono">
            {window.location.origin}/catalogo?store={user?.id}
        </code>
        <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/catalogo?store=${user?.id}`); addToast('Link copiado!', 'info');}} className="w-full border p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold">
            <Copy size={16}/> Copiar Link
        </button>
      </div>
    </div>
  );
};
