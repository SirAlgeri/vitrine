import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Package, MessageCircle } from 'lucide-react';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PaymentStatus, PAYMENT_STATUS_LABELS } from '../shared/constants/status';
import { StatusBadge, OrderTimeline } from './StatusComponents';

interface AdminOrderDetailsProps {
  orderId: number;
  onBack: () => void;
  onSave: () => void;
}

export const AdminOrderDetails: React.FC<AdminOrderDetailsProps> = ({ orderId, onBack, onSave }) => {
  const [order, setOrder] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    order_status: '',
    tracking_code: '',
    delivery_deadline: ''
  });

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    setOrder(data);
    setFormData({
      order_status: data.order_status,
      tracking_code: data.tracking_code || '',
      delivery_deadline: data.delivery_deadline || ''
    });
  };

  const handleSave = async () => {
    if (formData.order_status === OrderStatus.SHIPPED && (!formData.tracking_code || !formData.delivery_deadline)) {
      alert('Código de rastreio e prazo de entrega são obrigatórios para status "Enviado"');
      return;
    }

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: formData.order_status,
          tracking_code: formData.tracking_code,
          delivery_deadline: formData.delivery_deadline,
          notes: 'Atualizado pelo admin'
        })
      });
      setEditing(false);
      loadOrder();
      onSave();
    } catch (err) {
      alert('Erro ao atualizar pedido');
    }
  };

  const getWhatsAppLink = (phone: string, orderId: number) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = `Olá, tudo bem? Estou entrando em contato sobre o seu pedido nº ${orderId}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (!order) return <div className="text-white p-6">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ChevronLeft className="w-5 h-5" />
          Voltar para pedidos
        </button>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Pedido #{order.id}</h2>
                <p className="text-slate-400 text-sm">
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={order.payment_status as PaymentStatus} type="payment" />
                <StatusBadge status={order.order_status as OrderStatus} type="order" />
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Editar Status
              </button>
            ) : (
              <div className="space-y-4 bg-slate-700 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status do Pedido</label>
                  <select
                    value={formData.order_status}
                    onChange={(e) => setFormData({ ...formData, order_status: e.target.value as OrderStatus })}
                    className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:border-primary"
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {formData.order_status === OrderStatus.SHIPPED && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Código de Rastreio *</label>
                      <input
                        type="text"
                        required
                        value={formData.tracking_code}
                        onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:border-primary"
                        placeholder="Ex: BR123456789BR"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Prazo de Entrega *</label>
                      <input
                        type="date"
                        required
                        value={formData.delivery_deadline}
                        onChange={(e) => setFormData({ ...formData, delivery_deadline: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="font-semibold text-white mb-4">Acompanhamento</h3>
            <OrderTimeline 
              orderStatus={order.order_status as OrderStatus} 
              paymentStatus={order.payment_status as PaymentStatus}
            />
          </div>

          {/* Rastreio */}
          {order.tracking_code && (
            <div className="p-6 border-b border-slate-700 bg-blue-500/10">
              <h3 className="font-semibold text-white mb-2">Rastreamento</h3>
              <p className="text-slate-300">Código: <span className="font-mono font-bold">{order.tracking_code}</span></p>
              {order.delivery_deadline && (
                <p className="text-slate-400 text-sm mt-1">
                  Previsão de entrega: {new Date(order.delivery_deadline).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Cliente */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="font-semibold text-white mb-3">Cliente</h3>
            <div className="bg-slate-700 rounded-lg p-4 space-y-2">
              <p className="text-slate-300">{order.customer_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-slate-300">{order.customer_phone}</p>
                <a
                  href={getWhatsAppLink(order.customer_phone, order.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              {order.customer_address && (
                <p className="text-slate-400 text-sm">{order.customer_address}</p>
              )}
            </div>
          </div>

          {/* Produtos */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="font-semibold text-white mb-3">Produtos</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 bg-slate-700 rounded-lg p-4">
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.product_name}</p>
                    <p className="text-slate-400 text-sm">ID: {item.product_id}</p>
                    <p className="text-slate-400 text-sm">Quantidade: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product_price)} cada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamento */}
          <div className="p-6">
            <h3 className="font-semibold text-white mb-3">Pagamento</h3>
            <div className="bg-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Método:</span>
                <span className="text-white font-medium">
                  {order.payment_method === 'PIX' ? 'PIX' :
                   order.payment_method === 'CARD' ? 'Cartão' :
                   order.payment_method === 'BOLETO' ? 'Boleto' : order.payment_method}
                </span>
              </div>
              {order.payment_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Pagamento:</span>
                  <span className="text-white text-sm font-mono">{order.payment_id}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-600">
                <span className="text-slate-300 font-medium">Total:</span>
                <span className="text-white font-bold text-xl">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
