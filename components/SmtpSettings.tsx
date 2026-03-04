import React, { useState, useEffect } from 'react';
import { Mail, Save, Eye, EyeOff, Check, ChevronLeft } from 'lucide-react';

interface SmtpSettingsProps {
  onBack: () => void;
}

export default function SmtpSettings({ onBack }: SmtpSettingsProps) {
  const [config, setConfig] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    smtp_from_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data) {
        setConfig({
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_secure: data.smtp_secure || false,
          smtp_user: data.smtp_user || '',
          smtp_pass: data.smtp_pass || '',
          smtp_from: data.smtp_from || '',
          smtp_from_name: data.smtp_from_name || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Alerta de Sucesso */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5" />
            <span>Configurações SMTP salvas com sucesso!</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações de Email (SMTP)</h1>
            <p className="text-slate-400 text-sm mt-1">Configure o envio de emails por tenant</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
          <div className="space-y-6">
            {/* Servidor SMTP */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Servidor SMTP
              </label>
              <input
                type="text"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ex: smtp.gmail.com, smtp-mail.outlook.com, smtp.zoho.com
              </p>
            </div>

            {/* Porta e Seguro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Porta
                </label>
                <input
                  type="number"
                  value={config.smtp_port}
                  onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">587 (TLS) ou 465 (SSL)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Usar SSL/TLS
                </label>
                <select
                  value={config.smtp_secure ? 'true' : 'false'}
                  onChange={(e) => setConfig({ ...config, smtp_secure: e.target.value === 'true' })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="false">Não (porta 587)</option>
                  <option value="true">Sim (porta 465)</option>
                </select>
              </div>
            </div>

            {/* Usuário */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Usuário / Email
              </label>
              <input
                type="email"
                value={config.smtp_user}
                onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                placeholder="seu-email@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha / Senha de App
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.smtp_pass}
                  onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gmail: use senha de app (16 caracteres)
              </p>
            </div>

            {/* Email Remetente */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Remetente
              </label>
              <input
                type="email"
                value={config.smtp_from}
                onChange={(e) => setConfig({ ...config, smtp_from: e.target.value })}
                placeholder="noreply@sualoja.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Email que aparecerá como remetente
              </p>
            </div>

            {/* Nome Remetente */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome do Remetente
              </label>
              <input
                type="text"
                value={config.smtp_from_name}
                onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value })}
                placeholder="Sua Loja"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Nome que aparecerá como remetente
              </p>
            </div>

            {/* Dicas */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">Dicas:</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• <strong>Gmail:</strong> Use senha de app (não a senha normal)</li>
                <li>• <strong>Outlook:</strong> Use sua senha normal</li>
                <li>• <strong>Porta 587:</strong> TLS (mais comum)</li>
                <li>• <strong>Porta 465:</strong> SSL (marque "Usar SSL/TLS")</li>
              </ul>
            </div>

            {/* Link para criar senha de app */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Como obter senha de app do Gmail:</h3>
              <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                <li>Acesse: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/security</a></li>
                <li>Ative "Verificação em duas etapas"</li>
                <li>Acesse: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/apppasswords</a></li>
                <li>Crie uma senha de app e copie os 16 caracteres</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
