import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';

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
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white">Carregando...</div>;
  if (!order) return <div className="text-white">Pedido não encontrado</div>;

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
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              order.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-300' :
              order.status === 'CONFIRMED' ? 'bg-blue-900/50 text-blue-300' :
              order.status === 'SHIPPED' ? 'bg-purple-900/50 text-purple-300' :
              order.status === 'DELIVERED' ? 'bg-green-900/50 text-green-300' :
              'bg-red-900/50 text-red-300'
            }`}>
              {order.status === 'PENDING' ? 'Pendente' :
               order.status === 'CONFIRMED' ? 'Confirmado' :
               order.status === 'SHIPPED' ? 'Enviado' :
               order.status === 'DELIVERED' ? 'Entregue' : 'Cancelado'}
            </span>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Total</h3>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
            </p>
          </div>
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
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-600 last:border-0 last:pb-0">
                  <div>
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
            <div className="bg-slate-700 rounded-lg p-4 text-slate-300">
              <p>
                {order.payment_method === 'PIX' ? 'PIX' :
                 order.payment_method === 'CARD' ? 'Cartão de Crédito' :
                 order.payment_method === 'CASH' ? 'Dinheiro' : order.payment_method}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
