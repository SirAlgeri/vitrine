import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, ShoppingBag, DollarSign, Package, MessageCircle, Eye, Filter } from 'lucide-react';

interface SalesDashboardProps {
  onBack: () => void;
}

type Period = 'today' | '7days' | '30days' | 'custom';
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'all';

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('30days');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, period, statusFilter, customDates]);

  const loadOrders = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filtro de período
    const now = new Date();
    if (period === 'today') {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (period === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(o => new Date(o.created_at) >= weekAgo);
    } else if (period === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(o => new Date(o.created_at) >= monthAgo);
    } else if (period === 'custom' && customDates.start && customDates.end) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= new Date(customDates.start) && orderDate <= new Date(customDates.end);
      });
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const metrics = {
    total: filteredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
    count: filteredOrders.length,
    avgTicket: filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0) / filteredOrders.length : 0
  };

  const getWhatsAppLink = (phone: string, orderId: number) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = `Olá, tudo bem? Estou entrando em contato sobre o seu pedido nº ${orderId}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Aguardando', color: 'bg-yellow-900/50 text-yellow-300' },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-900/50 text-blue-300' },
    SHIPPED: { label: 'Enviado', color: 'bg-purple-900/50 text-purple-300' },
    DELIVERED: { label: 'Entregue', color: 'bg-green-900/50 text-green-300' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-900/50 text-red-300' }
  };

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ChevronLeft className="w-5 h-5" />
            Voltar para pedidos
          </button>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Pedido #{selectedOrder.id}</h2>
                <p className="text-slate-400 text-sm">
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${statusLabels[selectedOrder.status].color}`}>
                {statusLabels[selectedOrder.status].label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Cliente</h3>
                <div className="space-y-2 text-slate-300">
                  <p>{selectedOrder.customer_name}</p>
                  <div className="flex items-center gap-2">
                    <p>{selectedOrder.customer_phone}</p>
                    <a
                      href={getWhatsAppLink(selectedOrder.customer_phone, selectedOrder.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Pagamento</h3>
                <div className="space-y-2 text-slate-300">
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)}
                  </p>
                  <p className="text-sm">
                    {selectedOrder.payment_method === 'PIX' ? 'PIX' :
                     selectedOrder.payment_method === 'CARD' ? 'Cartão' :
                     selectedOrder.payment_method === 'BOLETO' ? 'Boleto' : selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Endereço de Entrega</h3>
                <p className="text-slate-300">{selectedOrder.customer_address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard de Vendas</h1>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-blue-200" />
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-blue-200 text-sm">Faturamento</p>
            <p className="text-3xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.total)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-green-200" />
            </div>
            <p className="text-green-200 text-sm">Pedidos</p>
            <p className="text-3xl font-bold text-white">{metrics.count}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-200" />
            </div>
            <p className="text-purple-200 text-sm">Ticket Médio</p>
            <p className="text-3xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.avgTicket)}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                <option value="today">Hoje</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Data Inicial</label>
                  <input
                    type="date"
                    value={customDates.start}
                    onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Data Final</label>
                  <input
                    type="date"
                    value={customDates.end}
                    onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value="PENDING">Aguardando</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold">Pedidos ({filteredOrders.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Carregando...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Nenhum pedido encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">#{order.id}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{order.customer_name}</td>
                      <td className="px-6 py-4">
                        <a
                          href={getWhatsAppLink(order.customer_phone, order.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-400 hover:text-green-300"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{order.customer_phone}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusLabels[order.status].color}`}>
                          {statusLabels[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
