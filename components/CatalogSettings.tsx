import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Copy, Store, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CatalogSettings: React.FC = () => {
  const { addToast } = useStore();
  const [whatsapp, setWhatsapp] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'catalog_settings').maybeSingle();
      if (data?.value) {
        setWhatsapp(data.value.whatsapp_number || '');
        setIsOpen(data.value.is_open !== false);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'catalog_settings',
        value: { whatsapp_number: whatsapp, is_open: isOpen }
      });
      if (error) throw error;
      addToast('Configurações salvas!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  };

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
            <input type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} className="toggle" />
        </label>

        <button onClick={handleSave} className="w-full bg-emerald-600 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2">
            <Save size={18}/> Salvar Configurações
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Store size={18}/> Link do seu Catálogo</h3>
        <code className="bg-slate-100 p-3 rounded-lg block text-sm break-all font-mono">
            {window.location.origin}/catalogo
        </code>
        <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/catalogo`); addToast('Link copiado!', 'info');}} className="w-full border p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold">
            <Copy size={16}/> Copiar Link
        </button>
      </div>
    </div>
  );
};
