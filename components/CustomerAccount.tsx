import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, MapPin, Lock, Package, Trash2, Check } from 'lucide-react';
import { Customer } from '../types';
import { customerAuth } from '../services/customerAuth';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../shared/constants/status';
import { StatusBadge } from './StatusComponents';

interface CustomerAccountProps {
  customer: Customer;
  onBack: () => void;
  onLogout: () => void;
}

export const CustomerAccount: React.FC<CustomerAccountProps> = ({ customer: initialCustomer, onBack, onLogout }) => {
  const [customer, setCustomer] = useState(initialCustomer);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState(customer);
  const [passwordData, setPasswordData] = useState({ senha_atual: '', senha_nova: '', confirmar: '' });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await customerAuth.getOrders(customer.id);
      setOrders(data);
    } catch (err) {
      console.error('Erro ao carregar pedidos');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const updated = await customerAuth.update(customer.id, formData);
      setCustomer(updated);
      customerAuth.saveSession(updated);
      setEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (passwordData.senha_nova !== passwordData.confirmar) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      await customerAuth.changePassword(customer.id, passwordData.senha_atual, passwordData.senha_nova);
      setChangingPassword(false);
      setPasswordData({ senha_atual: '', senha_nova: '', confirmar: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) return;
    try {
      await customerAuth.deleteAccount(customer.id);
      customerAuth.clearSession();
      onLogout();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Alerta de Sucesso */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          <span>Dados atualizados com sucesso!</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Minha Conta</h2>
            <p className="text-slate-400 text-sm">{customer.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">
          Sair
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dados Pessoais */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </h3>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-primary hover:underline text-sm">
                  Editar
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Nome Completo"
                />
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Telefone"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg">
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-slate-300">
                <p><strong>Nome:</strong> {customer.nome_completo}</p>
                <p><strong>Telefone:</strong> {customer.telefone}</p>
                <p><strong>CPF:</strong> {customer.cpf || 'Não informado'}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              Endereço
            </h3>
            <div className="space-y-2 text-slate-300">
              <p>{customer.endereco}, {customer.numero}</p>
              {customer.complemento && <p>{customer.complemento}</p>}
              <p>{customer.bairro}</p>
              <p>{customer.cidade} - {customer.estado}</p>
              <p>CEP: {customer.cep}</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Segurança
              </h3>
              {!changingPassword && (
                <button onClick={() => setChangingPassword(true)} className="text-primary hover:underline text-sm">
                  Alterar Senha
                </button>
              )}
            </div>

            {changingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  value={passwordData.senha_atual}
                  onChange={(e) => setPasswordData({ ...passwordData, senha_atual: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Senha Atual"
                  required
                />
                <input
                  type="password"
                  value={passwordData.senha_nova}
                  onChange={(e) => setPasswordData({ ...passwordData, senha_nova: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Nova Senha"
                  required
                  minLength={6}
                />
                <input
                  type="password"
                  value={passwordData.confirmar}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Confirmar Nova Senha"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg">
                    Alterar
                  </button>
                  <button type="button" onClick={() => setChangingPassword(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-400 text-sm">••••••••</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <button 
              onClick={handleDeleteAccount} 
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Excluir conta
            </button>
          </div>
        </div>

        {/* Pedidos */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" />
            Meus Pedidos
          </h3>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => window.location.href = `/pedido/${order.id}`}
                  className="w-full p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-primary transition-colors text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">Pedido #{order.id}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-white font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                      </p>
                      <div className="flex justify-end">
                        <StatusBadge status={order.order_status as OrderStatus} type="order" />
                      </div>
                    </div>
                  </div>
                  {order.items && (
                    <div className="space-y-1 text-sm text-slate-300">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Nenhum pedido ainda</p>
          )}
        </div>
      </div>
    </div>
  );
};
