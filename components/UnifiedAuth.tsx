import React, { useState } from 'react';
import { ChevronLeft, Mail, Lock, Shield } from 'lucide-react';
import { CustomerRegister } from '../types';
import { customerAuth } from '../services/customerAuth';
import { api } from '../services/api';

interface UnifiedAuthProps {
  onBack: () => void;
  onCustomerSuccess: () => void;
  onAdminSuccess: () => void;
}

export const UnifiedAuth: React.FC<UnifiedAuthProps> = ({ onBack, onCustomerSuccess, onAdminSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', senha: '' });
  const [registerData, setRegisterData] = useState<CustomerRegister>({
    nome_completo: '',
    email: '',
    senha: '',
    telefone: '',
    aceita_marketing: false
  });
  const [confirmSenha, setConfirmSenha] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      try {
        await api.login(loginData.email, loginData.senha);
        sessionStorage.setItem('vitrine_session', 'true');
        onAdminSuccess();
        return;
      } catch (adminErr) {
        const customer = await customerAuth.login(loginData);
        customerAuth.saveSession(customer);
        onCustomerSuccess();
      }
    } catch (err: any) {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (registerData.senha !== confirmSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    try {
      // Enviar código de verificação
      const res = await fetch('/api/customers/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar código');
      }
      
      setEmailToVerify(registerData.email);
      setMode('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Verificar código
      const verifyRes = await fetch('/api/customers/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: verificationCode })
      });
      
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Código inválido');
      }
      
      // Registrar cliente
      const customer = await customerAuth.register({ ...registerData, email_verified: true });
      customerAuth.saveSession(customer);
      onCustomerSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in py-8">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
        {mode !== 'verify' && (
          <div className="flex mb-6 bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              style={{
                backgroundColor: mode === 'login' ? 'var(--primary)' : 'transparent'
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fazer Login
            </button>
            <button
              onClick={() => setMode('register')}
              style={{
                backgroundColor: mode === 'register' ? 'var(--primary)' : 'transparent'
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie sua conta' : 'Verificar Email'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {mode === 'login' ? 'Acesse sua conta' : mode === 'register' ? 'Cadastre-se para fazer pedidos' : 'Digite o código enviado para seu email'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {mode === 'verify' ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="text-slate-300 text-sm">
                Enviamos um código de 6 dígitos para<br />
                <strong className="text-white">{emailToVerify}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Código de Verificação</label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar e Criar Conta'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setVerificationCode(''); setError(''); }}
              className="w-full py-2 text-slate-400 hover:text-white text-sm"
            >
              Voltar
            </button>
          </form>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={loginData.senha}
                  onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
              <input
                type="text"
                required
                value={registerData.nome_completo}
                onChange={(e) => setRegisterData({ ...registerData, nome_completo: e.target.value })}
                placeholder="João da Silva"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Telefone</label>
              <input
                type="tel"
                required
                value={registerData.telefone}
                onChange={(e) => setRegisterData({ ...registerData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={registerData.senha}
                onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Confirmar Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
