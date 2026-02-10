import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import { StatusBadge, OrderTimeline } from '../components/StatusComponents';
import { PaymentStatus, OrderStatus } from '../shared/constants/status';

export const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}?t=${Date.now()}`);
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = () => {
    if (order?.payment_status === 'pending' || order?.payment_status === 'PAYMENT_PENDING') {
      // Salvar orderId no sessionStorage para o checkout saber que é um pagamento de pedido existente
      sessionStorage.setItem('paymentOrderId', orderId as string);
      navigate(`/pedido/${orderId}/pagar`);
    }
  };

  if (loading) return <div className="text-white">Carregando...</div>;
  if (!order) return <div className="text-white">Pedido não encontrado</div>;

  const isPendingPayment = order.payment_status === 'pending' || order.payment_status === 'PAYMENT_PENDING';

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/minha-conta')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Minha Conta
      </button>

      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pedido #{order.id}</h1>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div 
            className={`bg-slate-700 rounded-lg p-4 ${isPendingPayment ? 'cursor-pointer hover:bg-slate-600 transition-colors' : ''}`}
            onClick={handlePaymentClick}
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2">Status do Pedido</h3>
            <StatusBadge status={order.order_status as OrderStatus} type="order" />
          </div>

          <div 
            className={`bg-slate-700 rounded-lg p-4 ${isPendingPayment ? 'cursor-pointer hover:bg-slate-600 transition-colors border-2 border-yellow-500/50' : ''}`}
            onClick={handlePaymentClick}
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2">Status do Pagamento</h3>
            <StatusBadge status={order.payment_status as PaymentStatus} type="payment" />
            {isPendingPayment && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Clique para pagar
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Acompanhamento do Pedido</h3>
          <OrderTimeline 
            orderStatus={order.order_status as OrderStatus} 
            paymentStatus={order.payment_status as PaymentStatus}
          />
        </div>

        {order.order_status === OrderStatus.SHIPPED && order.tracking_code && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-400 mb-2">Pedido Enviado</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Código de Rastreio:</p>
                    <p className="text-white font-mono font-semibold text-lg">{order.tracking_code}</p>
                  </div>
                  {order.delivery_deadline && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Previsão de entrega: <span className="font-semibold">
                          {new Date(order.delivery_deadline).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Total</h3>
          <p className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
          </p>
          {order.payment_id && (
            <p className="text-slate-400 text-xs mt-2">ID Pagamento: {order.payment_id}</p>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Cliente</h3>
            <div className="bg-slate-700 rounded-lg p-4 space-y-1 text-slate-300">
              <p>{order.customer_name}</p>
              <p>{order.customer_phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Endereço de Entrega</h3>
            <div className="bg-slate-700 rounded-lg p-4 text-slate-300">
              <p>{order.customer_address}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Produtos</h3>
            <div className="bg-slate-700 rounded-lg p-4 space-y-3">
              {order.items && order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3 items-center pb-3 border-b border-slate-600 last:border-0 last:pb-0">
                  {item.product_image && (
                    <img 
                      src={item.product_image} 
                      alt={item.product_name} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.product_name}</p>
                    <p className="text-slate-400 text-sm">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="text-white font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Forma de Pagamento</h3>
            <div 
              className={`bg-slate-700 rounded-lg p-4 text-slate-300 ${isPendingPayment ? 'cursor-pointer hover:bg-slate-600 transition-colors border-2 border-yellow-500/50' : ''}`}
              onClick={isPendingPayment ? handlePaymentClick : undefined}
            >
              <p>
                {order.payment_method === 'PIX' ? 'PIX' :
                 order.payment_method === 'CARD' ? 'Cartão de Crédito' :
                 order.payment_method === 'CASH' ? 'Dinheiro' : order.payment_method}
              </p>
              {isPendingPayment && (
                <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Clique para realizar o pagamento
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
