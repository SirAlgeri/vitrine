import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, ShoppingBag, DollarSign, Package, MessageCircle, Eye, Filter, Plus } from 'lucide-react';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../shared/constants/status';
import { ManualOrderForm } from './ManualOrderForm';
import { AdminOrderDetails } from './AdminOrderDetails';

interface SalesDashboardProps {
  onBack: () => void;
}

type Period = 'today' | '7days' | '30days' | 'custom';
type StatusFilter = OrderStatus | 'all';

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('30days');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, period, statusFilter, searchText, customDates]);

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
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    } else if (period === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      weekAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter(o => new Date(o.created_at) >= weekAgo);
    } else if (period === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      monthAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter(o => new Date(o.created_at) >= monthAgo);
    } else if (period === 'custom' && customDates.start && customDates.end) {
      const startDate = new Date(customDates.start + 'T00:00:00');
      const endDate = new Date(customDates.end + 'T23:59:59');
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.order_status === statusFilter);
    }

    // Filtro de busca (ID ou nome do cliente)
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter(o => 
        o.id.toString().includes(search) ||
        o.customer_name.toLowerCase().includes(search)
      );
    }

    // Ordenar por ID (número do pedido) decrescente
    filtered.sort((a, b) => b.id - a.id);

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

  if (selectedOrder?.isNew) {
    return <ManualOrderForm onClose={() => setSelectedOrder(null)} onSave={loadOrders} />;
  }

  if (selectedOrder) {
    return <AdminOrderDetails orderId={selectedOrder.id} onBack={() => setSelectedOrder(null)} onSave={loadOrders} />;
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Buscar</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ID ou nome do cliente"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              />
            </div>

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
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value={OrderStatus.PENDING_PAYMENT}>Aguardando pagamento</option>
                <option value={OrderStatus.PAID}>Pago</option>
                <option value={OrderStatus.PREPARING}>Preparando envio</option>
                <option value={OrderStatus.SHIPPED}>Enviado</option>
                <option value={OrderStatus.DELIVERED}>Concluído</option>
                <option value={OrderStatus.CANCELED}>Cancelado</option>
                <option value={OrderStatus.REFUNDED}>Estornado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pedidos ({filteredOrders.length})</h2>
            <button
              onClick={() => setSelectedOrder({ isNew: true })}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registro Manual
            </button>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.order_status as OrderStatus]}`}>
                          {ORDER_STATUS_LABELS[order.order_status as OrderStatus]}
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
