import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer, CartItem, AppConfig } from '../types';
import { ShoppingBag, Check } from 'lucide-react';
import { validateCPF, formatCPF, formatCEP, fetchAddressByCEP } from '../services/validators';
import PaymentForm from '../components/PaymentForm';
import { applyMarkup } from '../services/pricing';

interface CheckoutPageProps {
  customer: Customer | null;
  cart: CartItem[];
  config: AppConfig;
  onClearCart: () => void;
  shippingData?: {
    servico: string;
    valor: number;
    prazo: number;
  } | null;
}

type Step = 'identification' | 'address' | 'payment' | 'review' | 'confirmation';

const steps: { id: Step; label: string }[] = [
  { id: 'identification', label: 'Identificação' },
  { id: 'address', label: 'Endereço' },
  { id: 'payment', label: 'Pagamento' },
  { id: 'review', label: 'Revisão' },
  { id: 'confirmation', label: 'Confirmação' }
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ customer, cart, config, onClearCart, shippingData = null }) => {
  const navigate = useNavigate();
  const { orderId: urlOrderId } = useParams();
  const [currentStep, setCurrentStep] = useState<Step>(urlOrderId ? 'payment' : 'identification');
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(urlOrderId ? Number(urlOrderId) : null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [shipping, setShipping] = useState<{ servico: string; valor: number; prazo: number } | null>(null);
  const [formData, setFormData] = useState({
    cpf: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Carregar dados do frete do localStorage
  useEffect(() => {
    const savedShipping = localStorage.getItem('checkout_shipping');
    if (savedShipping) {
      try {
        setShipping(JSON.parse(savedShipping));
      } catch (err) {
        console.error('Erro ao carregar frete:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (customer) {
      setFormData({
        cpf: customer.cpf || '',
        cep: customer.cep || '',
        endereco: customer.endereco || '',
        numero: customer.numero || '',
        complemento: customer.complemento || '',
        bairro: customer.bairro || '',
        cidade: customer.cidade || '',
        estado: customer.estado || ''
      });
    }
  }, [customer]);

  useEffect(() => {
    if (urlOrderId) {
      loadExistingOrder();
    }
  }, [urlOrderId]);

  const loadExistingOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${urlOrderId}`);
      const data = await res.json();
      setExistingOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCEPChange = async (cep: string) => {
    const formatted = formatCEP(cep);
    setFormData({ ...formData, cep: formatted });
    
    const clean = cep.replace(/[^\d]/g, '');
    if (clean.length === 8) {
      setLoadingCEP(true);
      const address = await fetchAddressByCEP(clean);
      if (address) {
        setFormData(prev => ({ ...prev, ...address }));
        setErrors(prev => ({ ...prev, cep: '' }));
      } else {
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
      }
      setLoadingCEP(false);
    }
  };

  const validateCPFStep = () => {
    if (!formData.cpf) {
      setErrors({ cpf: 'CPF obrigatório' });
      return false;
    }
    if (!validateCPF(formData.cpf)) {
      setErrors({ cpf: 'CPF inválido' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateAddressStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.cep) newErrors.cep = 'CEP obrigatório';
    if (!formData.endereco) newErrors.endereco = 'Endereço obrigatório';
    if (!formData.numero) newErrors.numero = 'Número obrigatório';
    if (!formData.bairro) newErrors.bairro = 'Bairro obrigatório';
    if (!formData.cidade) newErrors.cidade = 'Cidade obrigatória';
    if (!formData.estado) newErrors.estado = 'Estado obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 'identification') {
      if (!validateCPFStep()) return;
      setSaving(true);
      try {
        await fetch(`/api/customers/${customer!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_completo: customer!.nome_completo,
            telefone: customer!.telefone,
            aceita_marketing: customer!.aceita_marketing,
            cpf: formData.cpf
          })
        });
        setCurrentStep('address');
      } catch (err) {
        alert('Erro ao salvar CPF');
      } finally {
        setSaving(false);
      }
    } else if (currentStep === 'address') {
      if (!validateAddressStep()) return;
      setSaving(true);
      try {
        await fetch(`/api/customers/${customer!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_completo: customer!.nome_completo,
            telefone: customer!.telefone,
            aceita_marketing: customer!.aceita_marketing,
            cpf: formData.cpf,
            cep: formData.cep,
            endereco: formData.endereco,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado
          })
        });
        setCurrentStep('payment');
      } catch (err) {
        alert('Erro ao salvar endereço');
      } finally {
        setSaving(false);
      }
    } else if (currentStep === 'payment') {
      // Payment handled by PaymentForm component
      return;
    } else if (currentStep === 'review') {
      setSaving(true);
      try {
        if (urlOrderId) {
          // Atualizar pedido existente com dados de pagamento
          await fetch(`/api/orders/${urlOrderId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: paymentData?.id || null,
              payment_status: paymentData?.status || 'pending',
              payment_method: paymentData?.payment_method_id === 'pix' ? 'PIX' : 'CARD'
            })
          });
          
          navigate(`/pedido/${urlOrderId}`);
        } else {
          // Criar novo pedido (fluxo normal do checkout)
          const address = `${formData.endereco}, ${formData.numero}${formData.complemento ? ', ' + formData.complemento : ''} - ${formData.bairro}, ${formData.cidade}/${formData.estado} - CEP: ${formData.cep}`;
          
          let paymentMethod = 'PIX';
          if (paymentData) {
            if (paymentData.payment_method_id === 'pix') {
              paymentMethod = 'PIX';
            } else if (paymentData.payment_method_id) {
              paymentMethod = 'CARD';
            }
          }
          
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: customer!.id,
              customer_name: customer!.nome_completo,
              customer_phone: customer!.telefone,
              customer_address: address,
              payment_method: paymentMethod,
              payment_id: paymentData?.id || null,
              payment_provider_status: paymentData?.status || null,
              total: totalWithShipping,
              frete_servico: currentShipping?.servico || null,
              frete_valor: shippingAmount,
              frete_prazo: currentShipping?.prazo || null,
              items: cart.map(item => ({
                ...item,
                product_id: item.id,
                product_name: item.name,
                product_price: applyMarkup(item.price, config.markupPercentage || 0),
                product_image: item.image,
                subtotal: applyMarkup(item.price, config.markupPercentage || 0) * item.quantity
              }))
            })
          });
          const order = await response.json();
          setOrderId(order.id);
          localStorage.removeItem('checkout_shipping'); // Limpar frete após criar pedido
          onClearCart();
          navigate(`/pedido/${order.id}`);
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar pedido');
      } finally {
        setSaving(false);
      }
    }
  };

  if (!customer) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Login Necessário</h2>
          <p className="text-slate-400 mb-6">Você precisa ter uma conta para comprar online</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              Voltar
            </button>
            <button onClick={() => navigate('/auth?redirect=/checkout')} className="flex-1 px-4 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !urlOrderId) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-3">Carrinho Vazio</h2>
          <p className="text-slate-400 mb-6">Adicione produtos ao carrinho para continuar</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  const total = existingOrder ? Number(existingOrder.total) : cart.reduce((sum, item) => {
    const finalPrice = applyMarkup(item.price, config.markupPercentage || 0);
    return sum + finalPrice * item.quantity;
  }, 0);
  const shippingAmount = shipping?.valor || shippingData?.valor || 0;
  const totalWithShipping = total + shippingAmount;
  const currentShipping = shipping || shippingData;
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const items = existingOrder ? existingOrder.items : cart;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => currentStep !== 'confirmation' && index < currentStepIndex && setCurrentStep(step.id)}
                  disabled={currentStep === 'confirmation' || index >= currentStepIndex}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index < currentStepIndex ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' :
                    index === currentStepIndex ? 'bg-primary text-white' :
                    'bg-slate-700 text-slate-400 cursor-not-allowed'
                  } ${currentStep === 'confirmation' ? 'cursor-not-allowed' : ''}`}
                >
                  {index < currentStepIndex ? <Check className="w-5 h-5" /> : index + 1}
                </button>
                <span className={`text-xs mt-2 text-center ${
                  index === currentStepIndex ? 'text-white font-medium' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                  index < currentStepIndex ? 'bg-green-600' : 'bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'identification' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Identificação</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
              <input type="text" value={customer.nome_completo} disabled className="w-full px-4 py-3 bg-slate-700 text-slate-400 rounded-lg border border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">CPF *</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                maxLength={14}
                placeholder="000.000.000-00"
                className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.cpf ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
              />
              {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
            </div>
            <button onClick={handleNext} disabled={saving} className="w-full px-6 py-3 bg-primary hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              {saving ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 'address' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Endereço de Entrega</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">CEP *</label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                maxLength={9}
                placeholder="00000-000"
                className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.cep ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
              />
              {loadingCEP && <p className="text-blue-400 text-sm mt-1">Buscando endereço...</p>}
              {errors.cep && <p className="text-red-400 text-sm mt-1">{errors.cep}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.endereco ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
                />
                {errors.endereco && <p className="text-red-400 text-sm mt-1">{errors.endereco}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Número *</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.numero ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
                />
                {errors.numero && <p className="text-red-400 text-sm mt-1">{errors.numero}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Complemento</label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Apto, bloco, etc."
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Bairro *</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.bairro ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
                />
                {errors.bairro && <p className="text-red-400 text-sm mt-1">{errors.bairro}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Cidade *</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.cidade ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
                />
                {errors.cidade && <p className="text-red-400 text-sm mt-1">{errors.cidade}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Estado *</label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="SP"
                  className={`w-full px-4 py-3 bg-slate-700 text-white rounded-lg border ${errors.estado ? 'border-red-500' : 'border-slate-600'} focus:outline-none focus:border-primary`}
                />
                {errors.estado && <p className="text-red-400 text-sm mt-1">{errors.estado}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCurrentStep('identification')} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                Voltar
              </button>
              <button onClick={handleNext} disabled={saving} className="flex-1 px-6 py-3 bg-primary hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                {saving ? 'Salvando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'payment' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Forma de Pagamento</h2>
          <PaymentForm
            amount={totalWithShipping}
            shippingAmount={shippingAmount}
            customerData={{
              email: customer.email,
              cpf: formData.cpf,
              name: customer.nome_completo
            }}
            markupPercentage={config.markupPercentage || 0}
            onSuccess={(data) => {
              setPaymentData(data);
              setCurrentStep('review');
            }}
            onError={(error) => {
              alert(error);
            }}
          />
          <button 
            onClick={() => setCurrentStep('address')} 
            className="w-full mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Voltar
          </button>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Revisão do Pedido</h2>
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Dados Pessoais</h3>
              <p className="text-slate-300">{customer.nome_completo}</p>
              <p className="text-slate-300">{customer.email}</p>
              <p className="text-slate-300">{formData.cpf}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Endereço</h3>
              <p className="text-slate-300">{formData.endereco}, {formData.numero}</p>
              {formData.complemento && <p className="text-slate-300">{formData.complemento}</p>}
              <p className="text-slate-300">{formData.bairro} - {formData.cidade}/{formData.estado}</p>
              <p className="text-slate-300">CEP: {formData.cep}</p>
            </div>
            
            {/* Payment Info */}
            {paymentData && (
              <div>
                <h3 className="font-semibold text-white mb-2">Pagamento</h3>
                {paymentData.payment_method_id === 'pix' ? (
                  <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-400 font-medium">PIX - Aguardando Pagamento</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <img 
                        src={`data:image/png;base64,${paymentData.point_of_interaction?.transaction_data?.qr_code_base64}`} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Código PIX:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={paymentData.point_of_interaction?.transaction_data?.qr_code || ''}
                          readOnly
                          className="flex-1 bg-slate-600 text-white text-xs p-2 rounded border border-slate-500"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paymentData.point_of_interaction?.transaction_data?.qr_code || '');
                            alert('Código copiado!');
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs">Escaneie o QR Code ou copie o código para pagar no app do seu banco</p>
                  </div>
                ) : (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {paymentData.status === 'approved' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 font-medium">Cartão de Crédito - Aprovado</span>
                        </>
                      ) : paymentData.status === 'pending' ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-400 font-medium">Cartão de Crédito - Pendente</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-400 font-medium">Cartão de Crédito - Recusado</span>
                        </>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>ID da Transação:</span>
                        <span className="font-mono text-slate-400">{paymentData.id}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Status:</span>
                        <span className="font-medium text-white">{paymentData.status_detail}</span>
                      </div>
                      {paymentData.installments > 1 && (
                        <div className="flex justify-between text-slate-300">
                          <span>Parcelas:</span>
                          <span className="font-medium text-white">{paymentData.installments}x</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-white mb-2">Produtos</h3>
              <div className="space-y-3">
                {items.map((item: any) => {
                  const priceWithMarkup = applyMarkup(item.price, config.markupPercentage || 0);
                  return (
                    <div key={item.id} className="flex gap-3 items-center">
                      <img src={item.image || item.product_image} alt={item.name || item.product_name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.name || item.product_name}</p>
                        <p className="text-slate-400 text-sm">Quantidade: {item.quantity}</p>
                      </div>
                      <span className="text-white font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          item.subtotal || (priceWithMarkup * item.quantity)
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between text-white font-bold">
                <span>Total</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCurrentStep('payment')} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              Voltar
            </button>
            <button onClick={handleNext} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              {saving ? 'Processando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 'confirmation' && (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Pedido Confirmado!</h2>
          <p className="text-slate-300 mb-2">Seu pedido foi realizado com sucesso.</p>
          {orderId && (
            <div className="bg-slate-700 rounded-lg p-4 my-6 text-left">
              <p className="text-slate-400 text-sm mb-2">Número do Pedido</p>
              <p className="text-3xl font-bold text-primary mb-4">#{orderId}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Cliente:</span>
                  <span className="font-medium text-white">{customer!.nome_completo}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total:</span>
                  <span className="font-medium text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Endereço:</span>
                  <span className="font-medium text-white text-right">{formData.endereco}, {formData.numero}</span>
                </div>
              </div>
            </div>
          )}
          <p className="text-slate-400 text-sm mb-6">Você receberá atualizações sobre seu pedido por email.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/minha-conta')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              Ver Meus Pedidos
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Voltar para a Loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
