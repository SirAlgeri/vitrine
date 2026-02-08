import React, { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, Check } from 'lucide-react';
import { formatPhone } from '../services/validators';

interface PaymentSettingsProps {
  onBack: () => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ onBack }) => {
  const [config, setConfig] = useState({
    enable_online_checkout: true,
    enable_whatsapp_checkout: true,
    payment_methods: ['PIX', 'CARD', 'BOLETO'],
    whatsapp_number: ''
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/config');
      const data = await res.json();
      setConfig({
        enable_online_checkout: data.enable_online_checkout ?? true,
        enable_whatsapp_checkout: data.enable_whatsapp_checkout ?? true,
        payment_methods: data.payment_methods || ['PIX', 'CARD', 'BOLETO'],
        whatsapp_number: data.whatsapp_number || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('http://localhost:3001/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setConfig(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Alerta de Sucesso */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Métodos de Pagamento</h1>
            <p className="text-slate-400">Configure as opções de checkout</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Métodos de Checkout */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Métodos de Checkout</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                <div>
                  <p className="font-medium">Compra Online</p>
                  <p className="text-sm text-slate-400">Cliente finaliza pedido pelo site</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_online_checkout}
                  onChange={(e) => setConfig({ ...config, enable_online_checkout: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-slate-400">Cliente envia pedido via WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_whatsapp_checkout}
                  onChange={(e) => setConfig({ ...config, enable_whatsapp_checkout: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {config.enable_whatsapp_checkout && (
                <div className="ml-4 p-4 bg-slate-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número do WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formatPhone(config.whatsapp_number)}
                    onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value.replace(/[^\d]/g, '') })}
                    placeholder="+55 (11) 99999-9999"
                    maxLength={19}
                    className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-slate-400 mt-1">Formato: +55 (DDD) 99999-9999</p>
                </div>
              )}
            </div>
          </div>

          {/* Formas de Pagamento Online */}
          {config.enable_online_checkout && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Formas de Pagamento (Online)</h2>
              <p className="text-slate-400 text-sm mb-4">Selecione as formas de pagamento disponíveis na compra online</p>
              
              <div className="space-y-3">
                {[
                  { id: 'PIX', label: 'PIX', desc: 'Pagamento instantâneo' },
                  { id: 'CARD', label: 'Cartão de Crédito', desc: 'Parcelamento disponível' },
                  { id: 'BOLETO', label: 'Boleto Bancário', desc: 'Vencimento em 3 dias' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      config.payment_methods.includes(method.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-slate-400">{method.desc}</p>
                    </div>
                    {config.payment_methods.includes(method.id) && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-primary hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};
