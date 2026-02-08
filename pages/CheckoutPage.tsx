import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, CartItem, AppConfig } from '../types';
import { ShoppingBag, Check } from 'lucide-react';
import { validateCPF, formatCPF, formatCEP, fetchAddressByCEP } from '../services/validators';

interface CheckoutPageProps {
  customer: Customer | null;
  cart: CartItem[];
  config: AppConfig;
  onClearCart: () => void;
}

type Step = 'identification' | 'address' | 'payment' | 'review' | 'confirmation';

const steps: { id: Step; label: string }[] = [
  { id: 'identification', label: 'Identificação' },
  { id: 'address', label: 'Endereço' },
  { id: 'payment', label: 'Pagamento' },
  { id: 'review', label: 'Revisão' },
  { id: 'confirmation', label: 'Confirmação' }
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ customer, cart, config, onClearCart }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('identification');
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
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
        await fetch(`http://localhost:3001/api/customers/${customer!.id}`, {
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
        await fetch(`http://localhost:3001/api/customers/${customer!.id}`, {
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
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setSaving(true);
      try {
        const address = `${formData.endereco}, ${formData.numero}${formData.complemento ? ', ' + formData.complemento : ''} - ${formData.bairro}, ${formData.cidade}/${formData.estado} - CEP: ${formData.cep}`;
        const response = await fetch('http://localhost:3001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customer!.id,
            customer_name: customer!.nome_completo,
            customer_phone: customer!.telefone,
            customer_address: address,
            payment_method: 'PIX',
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
            items: cart
          })
        });
        const order = await response.json();
        setOrderId(order.id);
        onClearCart();
        setCurrentStep('confirmation');
      } catch (err) {
        console.error(err);
        alert('Erro ao criar pedido');
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

  if (cart.length === 0) {
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

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
          <p className="text-slate-400 mb-6">Selecione a forma de pagamento (em desenvolvimento)</p>
          <div className="flex gap-3">
            <button onClick={() => setCurrentStep('address')} className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              Voltar
            </button>
            <button onClick={handleNext} className="flex-1 px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Continuar
            </button>
          </div>
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
              <p className="text-slate-300">{formData.bairro} - {formData.cidade}/{formData.estado}</p>
              <p className="text-slate-300">CEP: {formData.cep}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Produtos</h3>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-slate-400 text-sm">Quantidade: {item.quantity}</p>
                    </div>
                    <span className="text-white font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</span>
                  </div>
                ))}
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
