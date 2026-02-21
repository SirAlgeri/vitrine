import React, { useState, useEffect } from 'react';
import { Mail, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Configurações SMTP salvas com sucesso!' });
      } else {
        setMessage({ type: 'error', text: '❌ Erro ao salvar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao salvar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <Mail className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Configurações de Email (SMTP)</h2>
      </div>

      <div className="space-y-4">
        {/* Servidor SMTP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servidor SMTP
          </label>
          <input
            type="text"
            value={config.smtp_host}
            onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
            placeholder="smtp.gmail.com"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ex: smtp.gmail.com, smtp-mail.outlook.com, smtp.zoho.com
          </p>
        </div>

        {/* Porta e Seguro */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porta
            </label>
            <input
              type="number"
              value={config.smtp_port}
              onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">587 (TLS) ou 465 (SSL)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usar SSL/TLS
            </label>
            <select
              value={config.smtp_secure ? 'true' : 'false'}
              onChange={(e) => setConfig({ ...config, smtp_secure: e.target.value === 'true' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">Não (porta 587)</option>
              <option value="true">Sim (porta 465)</option>
            </select>
          </div>
        </div>

        {/* Usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuário / Email
          </label>
          <input
            type="email"
            value={config.smtp_user}
            onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
            placeholder="seu-email@gmail.com"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha / Senha de App
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={config.smtp_pass}
              onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gmail: use senha de app (16 caracteres)
          </p>
        </div>

        {/* Email Remetente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Remetente
          </label>
          <input
            type="email"
            value={config.smtp_from}
            onChange={(e) => setConfig({ ...config, smtp_from: e.target.value })}
            placeholder="noreply@sualoja.com"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email que aparecerá como remetente
          </p>
        </div>

        {/* Nome Remetente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Remetente
          </label>
          <input
            type="text"
            value={config.smtp_from_name}
            onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value })}
            placeholder="Sua Loja"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nome que aparecerá como remetente
          </p>
        </div>

        {/* Mensagem */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Botão Salvar */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Gmail:</strong> Use senha de app (não a senha normal)</li>
            <li>• <strong>Outlook:</strong> Use sua senha normal</li>
            <li>• <strong>Porta 587:</strong> TLS (mais comum)</li>
            <li>• <strong>Porta 465:</strong> SSL (marque "Usar SSL/TLS")</li>
          </ul>
        </div>

        {/* Link para criar senha de app */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">🔑 Como obter senha de app do Gmail:</h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Acesse: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">myaccount.google.com/security</a></li>
            <li>Ative "Verificação em duas etapas"</li>
            <li>Acesse: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">myaccount.google.com/apppasswords</a></li>
            <li>Crie uma senha de app e copie os 16 caracteres</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
