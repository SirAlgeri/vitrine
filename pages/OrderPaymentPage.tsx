import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Check } from 'lucide-react';
import PaymentForm from '../components/PaymentForm';

export const OrderPaymentPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'payment' | 'review' | 'confirmation'>('payment');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (data.payment_status !== 'pending' && data.payment_status !== 'PAYMENT_PENDING') {
        navigate(`/pedido/${orderId}`);
        return;
      }
      
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (data: any) => {
    setPaymentData(data);
    setCurrentStep('review');
  };

  const handleConfirmOrder = async () => {
    try {
      await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentData.id,
          payment_status: paymentData.status,
          payment_method: paymentData.payment_method_id
        })
      });
      
      setCurrentStep('confirmation');
      
      setTimeout(() => {
        navigate(`/pedido/${orderId}`);
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err);
      alert('Erro ao processar pagamento');
    }
  };

  if (loading) return <div className="text-white">Carregando...</div>;
  if (!order) return <div className="text-white">Pedido não encontrado</div>;

  const total = Number(order.total);

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(`/pedido/${orderId}`)} 
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para detalhes do pedido
      </button>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { id: 'payment', label: 'Pagamento' },
            { id: 'review', label: 'Revisão' },
            { id: 'confirmation', label: 'Confirmação' }
          ].map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                currentStep === step.id ? 'text-primary' : 
                ['payment', 'review'].indexOf(currentStep) > idx ? 'text-green-500' : 'text-slate-500'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step.id ? 'border-primary bg-primary/10' :
                  ['payment', 'review'].indexOf(currentStep) > idx ? 'border-green-500 bg-green-500/10' : 'border-slate-600'
                }`}>
                  {['payment', 'review'].indexOf(currentStep) > idx ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
              {idx < 2 && <div className="w-12 h-0.5 bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Step */}
      {currentStep === 'payment' && (
        <>
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Pedido #{order.id}</h1>
                <p className="text-slate-400 text-sm">
                  Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </p>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Resumo do Pedido</h3>
              <div className="space-y-2">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.quantity}x {item.product_name}</span>
                    <span className="text-white font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-600">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Forma de Pagamento</h2>
            <PaymentForm
              amount={total}
              customerData={{
                email: order.customer_email || '',
                cpf: order.customer_cpf || '',
                name: order.customer_name
              }}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                alert(error);
              }}
            />
          </div>
        </>
      )}

      {/* Review Step */}
      {currentStep === 'review' && (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Revisar Pagamento</h2>
          
          <div className="space-y-6 mb-8">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Pedido</h3>
              <p className="text-white font-semibold">#{order.id}</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Total</h3>
              <p className="text-white font-bold text-2xl">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Forma de Pagamento</h3>
              <p className="text-white">
                {paymentData?.payment_type_id === 'pix' ? 'PIX' :
                 paymentData?.payment_type_id === 'credit_card' ? 'Cartão de Crédito' :
                 paymentData?.payment_type_id === 'ticket' ? 'Boleto' : 'Pagamento'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep('payment')}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmOrder}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              Confirmar Pagamento
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {currentStep === 'confirmation' && (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pagamento Processado!</h2>
          <p className="text-slate-400 mb-6">
            Seu pagamento foi registrado com sucesso.
          </p>
          <p className="text-slate-500 text-sm">
            Redirecionando para detalhes do pedido...
          </p>
        </div>
      )}
    </div>
  );
};
