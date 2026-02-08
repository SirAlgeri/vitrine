import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { CustomerRegister, CustomerLogin } from '../types';
import { customerAuth } from '../services/customerAuth';

interface CustomerAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState<CustomerLogin>({ email: '', senha: '' });
  const [registerData, setRegisterData] = useState<CustomerRegister>({
    nome_completo: '',
    email: '',
    senha: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    aceita_marketing: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const customer = await customerAuth.login(loginData);
      customerAuth.saveSession(customer);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const customer = await customerAuth.register(registerData);
      customerAuth.saveSession(customer);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCepBlur = async () => {
    if (registerData.cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${registerData.cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRegisterData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Não tem conta?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline">
                  Cadastre-se
                </button>
              </p>
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
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
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={registerData.senha}
                  onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">CEP</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={registerData.cep}
                  onChange={(e) => setRegisterData({ ...registerData, cep: e.target.value.replace(/\D/g, '') })}
                  onBlur={handleCepBlur}
                  placeholder="00000000"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Rua</label>
                  <input
                    type="text"
                    required
                    value={registerData.rua}
                    onChange={(e) => setRegisterData({ ...registerData, rua: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Número</label>
                  <input
                    type="text"
                    required
                    value={registerData.numero}
                    onChange={(e) => setRegisterData({ ...registerData, numero: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Bairro</label>
                  <input
                    type="text"
                    required
                    value={registerData.bairro}
                    onChange={(e) => setRegisterData({ ...registerData, bairro: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cidade</label>
                  <input
                    type="text"
                    required
                    value={registerData.cidade}
                    onChange={(e) => setRegisterData({ ...registerData, cidade: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Estado</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={registerData.estado}
                  onChange={(e) => setRegisterData({ ...registerData, estado: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={registerData.aceita_marketing}
                  onChange={(e) => setRegisterData({ ...registerData, aceita_marketing: e.target.checked })}
                  className="w-4 h-4"
                />
                Aceito receber novidades por email
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Já tem conta?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
                  Entrar
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
