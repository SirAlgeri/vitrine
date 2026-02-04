import React, { useState } from 'react';
import { CartItem, AppConfig, CustomerInfo, ShippingInfo } from '../types';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle, MessageCircle, Truck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  config: AppConfig;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  config,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [step, setStep] = useState<'CART' | 'METHOD' | 'CHECKOUT' | 'SUCCESS'>('CART');
  const [purchaseMethod, setPurchaseMethod] = useState<'WHATSAPP' | 'ONLINE' | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    cpf: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'PIX'
  });
  const [shipping, setShipping] = useState<ShippingInfo>({ value: 0, days: 0 });
  const [loadingCep, setLoadingCep] = useState(false);
  const [cpfError, setCpfError] = useState('');

  // Reset step when reopening
  React.useEffect(() => {
    if (isOpen && step === 'SUCCESS') {
      setStep('CART');
      setPurchaseMethod(null);
    }
  }, [isOpen]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = total;
  const totalWithShipping = total; // Frete sempre grátis

  const validateCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // Todos dígitos iguais
    
    let sum = 0;
    let remainder;
    
    // Valida primeiro dígito
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
    
    // Valida segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
    
    return true;
  };

  const handleCpfChange = (cpf: string) => {
    setCustomer(prev => ({ ...prev, cpf }));
    setCpfError('');
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      if (!validateCPF(cpf)) {
        setCpfError('CPF inválido');
      }
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setCustomer(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
        // Simula cálculo de frete (sempre grátis)
        setTimeout(() => {
          setShipping({ value: 0, days: 0 });
        }, 500);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (cep: string) => {
    setCustomer(prev => ({ ...prev, cep }));
    if (cep.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(cep);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CPF antes de finalizar
    if (!validateCPF(customer.cpf)) {
      setCpfError('CPF inválido');
      return;
    }
    
    setStep('SUCCESS');
    onClearCart();
  };

  const getWhatsappLink = () => {
    const itemsList = cart.map(item => 
      `• ${item.quantity}x ${item.name} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}`
    ).join('\n');

    const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    
    const whatsappNumber = config.whatsappNumber || '5511999999999';

    const message = `*NOVO PEDIDO - ${config.storeName}*\n\n` +
      `*Itens:*\n${itemsList}\n\n` +
      `*TOTAL: ${totalFormatted}*`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppCheckout = () => {
    window.open(getWhatsappLink(), '_blank');
    setStep('SUCCESS');
    onClearCart();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-primary w-5 h-5" />
            <h2 className="text-xl font-bold text-white">
              {step === 'CART' && 'Seu Carrinho'}
              {step === 'METHOD' && 'Forma de Compra'}
              {step === 'CHECKOUT' && 'Finalizar Compra'}
              {step === 'SUCCESS' && 'Pedido Realizado'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-5">
          
          {/* STEP 1: CART LIST */}
          {step === 'CART' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p>Seu carrinho está vazio.</p>
                  <button 
                    onClick={onClose}
                    className="text-primary hover:underline text-sm"
                  >
                    Voltar as compras
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-slate-800 rounded-xl p-3 flex gap-4 border border-slate-700">
                      <div className="w-20 h-20 bg-slate-900 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800" />
                        )}
                      </div>
                      
                      <div className="flex-grow flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-medium text-white line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-slate-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-slate-700">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => onRemoveItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: METHOD SELECTION */}
          {step === 'METHOD' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-slate-400 text-center mb-6">Como você deseja finalizar sua compra?</p>
              
              {/* WhatsApp */}
              <button
                onClick={() => {
                  setPurchaseMethod('WHATSAPP');
                  handleWhatsAppCheckout();
                }}
                className="w-full p-6 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold flex items-center gap-4 transition-all shadow-lg hover:shadow-emerald-900/30"
              >
                <MessageCircle className="w-8 h-8 flex-shrink-0" />
                <div className="text-left flex-grow">
                  <div className="text-lg">Comprar via WhatsApp</div>
                  <div className="text-sm font-normal opacity-90">Fale direto com o vendedor</div>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>

              {/* Online */}
              <button
                onClick={() => {
                  setPurchaseMethod('ONLINE');
                  setStep('CHECKOUT');
                }}
                className="w-full p-6 bg-primary hover:bg-blue-600 rounded-xl text-white font-semibold flex items-center gap-4 transition-all shadow-lg hover:shadow-primary/30"
              >
                <ShoppingBag className="w-8 h-8 flex-shrink-0" />
                <div className="text-left flex-grow">
                  <div className="text-lg">Compra Online</div>
                  <div className="text-sm font-normal opacity-90">Preencher dados de entrega</div>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* STEP 3: CHECKOUT FORM */}
          {step === 'CHECKOUT' && (
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 animate-fade-in">
              
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Dados Pessoais
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="João da Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">CPF</label>
                    <input 
                      type="text" 
                      required
                      value={customer.cpf}
                      onChange={e => handleCpfChange(e.target.value)}
                      className={`w-full bg-slate-800 border ${cpfError ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {cpfError && <p className="text-xs text-red-400">{cpfError}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Telefone</label>
                    <input 
                      type="tel" 
                      required
                      value={customer.phone}
                      onChange={e => setCustomer({...customer, phone: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Endereço de Entrega
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">CEP</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={customer.cep}
                      onChange={e => handleCepChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Digite o CEP para buscar o endereço automaticamente</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Rua / Logradouro</label>
                  <input 
                    type="text" 
                    required
                    value={customer.street}
                    onChange={e => setCustomer({...customer, street: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="Rua das Flores"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Número</label>
                    <input 
                      type="text" 
                      required
                      value={customer.number}
                      onChange={e => setCustomer({...customer, number: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="123"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Complemento</label>
                    <input 
                      type="text"
                      value={customer.complement}
                      onChange={e => setCustomer({...customer, complement: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="Apto 45"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Bairro</label>
                  <input 
                    type="text" 
                    required
                    value={customer.neighborhood}
                    onChange={e => setCustomer({...customer, neighborhood: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="Centro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Cidade</label>
                    <input 
                      type="text" 
                      required
                      value={customer.city}
                      onChange={e => setCustomer({...customer, city: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="São Paulo"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Estado</label>
                    <select 
                      required
                      value={customer.state}
                      onChange={e => setCustomer({...customer, state: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">UF</option>
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
                </div>

                {/* Resumo do Frete */}
                {customer.cep.replace(/\D/g, '').length === 8 && (
                  <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Frete</span>
                      <span className="font-semibold text-emerald-400">GRÁTIS</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="font-semibold text-white">Forma de Pagamento</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'CARD', 'CASH'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCustomer({...customer, paymentMethod: method})}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${customer.paymentMethod === method 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {method === 'PIX' ? 'Pix' : method === 'CARD' ? 'Cartão' : 'Dinheiro'}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                   <CheckCircle className="w-12 h-12" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-white mb-2">
                     {purchaseMethod === 'WHATSAPP' ? 'WhatsApp Aberto!' : 'Pedido Recebido!'}
                   </h3>
                   <p className="text-slate-400 max-w-xs mx-auto">
                     {purchaseMethod === 'WHATSAPP' 
                       ? 'Continue a conversa no WhatsApp para finalizar sua compra.'
                       : 'Seu pedido foi registrado com sucesso!'}
                   </p>
                </div>
                
                {purchaseMethod === 'ONLINE' && (
                  <a 
                     href={getWhatsappLink()}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all w-full justify-center"
                  >
                     <MessageCircle className="w-6 h-6" />
                     Enviar no WhatsApp
                  </a>
                )}

                <button 
                  onClick={onClose}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                   Fechar e continuar comprando
                </button>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 'SUCCESS' && cart.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
            
            {/* Resumo da Compra */}
            {step === 'CHECKOUT' && (
              <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Frete</span>
                  <span className="text-emerald-400 font-semibold">
                    {customer.cep.replace(/\D/g, '').length === 8 ? 'GRÁTIS' : 'Calcular'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Total</span>
              <span className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  step === 'CHECKOUT' ? totalWithShipping : total
                )}
              </span>
            </div>
            
            {step === 'CART' ? (
              <button
                onClick={() => setStep('METHOD')}
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                Continuar Compra <ArrowRight className="w-5 h-5" />
              </button>
            ) : step === 'METHOD' ? (
              <button
                onClick={() => setStep('CART')}
                className="w-full px-6 py-4 rounded-xl font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Voltar ao Carrinho
              </button>
            ) : (
              <div className="flex gap-3">
                 <button
                  type="button"
                  onClick={() => setStep('METHOD')}
                  className="px-6 py-4 rounded-xl font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-900/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Confirmar Pedido
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
