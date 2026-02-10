import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Loader2, Check, X } from 'lucide-react';
import CreditCardVisual from './CreditCardVisual';
import { getPixPrice } from '../services/pricing';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  customerData: {
    email: string;
    cpf: string;
    name: string;
  };
  markupPercentage?: number;
}

export default function PaymentForm({ amount, onSuccess, onError, customerData, markupPercentage = 0 }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('pix');
  const [loading, setLoading] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [cardForm, setCardForm] = useState<any>(null);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<'number' | 'expiry' | 'cvv' | null>(null);
  
  // Card display data
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  const [installmentsOptions, setInstallmentsOptions] = useState<any[]>([]);
  
  const pixAmount = getPixPrice(amount, markupPercentage);

  // PIX data
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');

  // Boleto data
  const [boletoUrl, setBoletoUrl] = useState('');
  const [boletoPdf, setBoletoPdf] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'card') {
      if (cardForm) {
        cardForm.unmount();
        setCardForm(null);
      }
      // Remover script antigo
      const oldScript = document.querySelector('script[src*="mercadopago"]');
      if (oldScript) oldScript.remove();
      
      setTimeout(() => loadMercadoPago(), 200);
    }
  }, [paymentMethod]);

  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/config');
      const config = await response.json();
      if (config.payment_methods && Array.isArray(config.payment_methods)) {
        setAvailableMethods(config.payment_methods);
        // PIX sempre como padrão se disponível
        if (config.payment_methods.includes('PIX')) {
          setPaymentMethod('pix');
        } else if (config.payment_methods.includes('CARD')) {
          setPaymentMethod('card');
        } else if (config.payment_methods.includes('BOLETO')) {
          setPaymentMethod('boleto');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
    }
  };

  const loadMercadoPago = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mercadopago/public-key');
      const { publicKey } = await response.json();
      
      // Check if script already exists
      if (document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')) {
        initCardForm(publicKey);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        initCardForm(publicKey);
      };
      document.body.appendChild(script);
    } catch (err) {
      onError('Erro ao carregar Mercado Pago');
    }
  };

  const initCardForm = (publicKey: string) => {
    const formElement = document.getElementById('form-checkout');
    if (!formElement) {
      console.error('Form element not found');
      return;
    }
    
    const mercadopago = new (window as any).MercadoPago(publicKey);
    setMp(mercadopago);
    
    const cardFormInstance = mercadopago.cardForm({
      amount: String(amount),
      iframe: true,
      form: {
        id: 'form-checkout',
        cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
        expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
        securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
        cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Nome como está no cartão' },
        issuer: { id: 'form-checkout__issuer', placeholder: 'Banco emissor' },
        installments: { id: 'form-checkout__installments', placeholder: 'Parcelas' },
        identificationType: { id: 'form-checkout__identificationType' },
        identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'CPF' },
        cardholderEmail: { id: 'form-checkout__cardholderEmail' }
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) console.error('Form mounted error:', error);
          else {
            console.log('Card form mounted successfully');
            setupFieldListeners();
          }
        },
        onSubmit: async (event: any) => {
          event.preventDefault();
          await handleCardPayment(cardFormInstance);
        },
        onFetching: (resource: any) => {
          console.log('Fetching:', resource);
        },
        onError: (error: any) => {
          console.error('Card form error:', error);
          setError(error[0]?.message || 'Erro ao processar dados do cartão');
        }
      }
    });
    
    setCardForm(cardFormInstance);
  };

  const setupFieldListeners = () => {
    // Listener para número do cartão
    const cardNumberInput = document.querySelector('#form-checkout__cardNumber iframe');
    if (cardNumberInput) {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'cardNumber') {
          setCardNumber(event.data.value || '');
        } else if (event.data.type === 'expirationDate') {
          setCardExpiry(event.data.value || '');
        } else if (event.data.type === 'securityCode') {
          setCardCvv(event.data.value || '');
        }
      });
    }
  };

  const handleCardPayment = async (formInstance: any) => {
    setLoading(true);
    try {
      const { token, issuerId, paymentMethodId, installments: selectedInstallments } = await formInstance.getCardFormData();
      
      const response = await fetch('http://localhost:3001/api/mercadopago/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          transaction_amount: amount,
          installments: selectedInstallments,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId,
          description: `Pedido - ${customerData.name}`,
          payer: {
            email: customerData.email,
            identification: {
              type: 'CPF',
              number: customerData.cpf.replace(/\D/g, '')
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }
      
      if (result.status === 'approved') {
        onSuccess(result);
      } else {
        onError(`Pagamento ${result.status}: ${result.status_detail}`);
      }
    } catch (err: any) {
      onError(err.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setLoading(true);
    try {
      const [firstName, ...lastNameParts] = customerData.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const response = await fetch('http://localhost:3001/api/mercadopago/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: pixAmount,
          description: `Pedido - ${customerData.name}`,
          payer: {
            email: customerData.email,
            first_name: firstName,
            last_name: lastName,
            identification: {
              number: customerData.cpf.replace(/\D/g, '')
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.point_of_interaction?.transaction_data) {
        setPixQrCode(result.point_of_interaction.transaction_data.qr_code);
        setPixQrCodeBase64(result.point_of_interaction.transaction_data.qr_code_base64);
        onSuccess(result);
      } else {
        onError('Erro ao gerar PIX');
      }
    } catch (err: any) {
      onError(err.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleBoletoPayment = async () => {
    if (!customerData?.name || !customerData?.email || !customerData?.cpf) {
      setError('Dados do cliente incompletos. Verifique nome, email e CPF.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const [firstName, ...lastNameParts] = customerData.name.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const response = await fetch('http://localhost:3001/api/mercadopago/create-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: amount,
          description: `Pedido - ${customerData.name}`,
          payer: {
            email: customerData.email,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: 'CPF',
              number: customerData.cpf.replace(/\D/g, '')
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      
      if (result.transaction_details?.external_resource_url) {
        setBoletoUrl(result.transaction_details.external_resource_url);
        setBoletoPdf(result.transaction_details.external_resource_url);
        onSuccess(result);
      } else {
        onError('Erro ao gerar boleto');
      }
    } catch (err: any) {
      onError(err.message || 'Erro ao gerar boleto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selector */}
      <div className="flex gap-3">
        {/* PIX - Sempre primeiro */}
        {availableMethods.includes('PIX') && (
          <button
            onClick={() => setPaymentMethod('pix')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all text-sm relative ${
              paymentMethod === 'pix'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Recomendado
            </span>
            <QrCode className="w-5 h-5 mx-auto mb-1" />
            <div className="font-medium">PIX</div>
          </button>
        )}

        {/* Cartão - Segundo */}
        {availableMethods.includes('CARD') && (
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all text-sm ${
              paymentMethod === 'card'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <CreditCard className="w-5 h-5 mx-auto mb-1" />
            <div className="font-medium">Cartão</div>
          </button>
        )}

        {/* Boleto - Terceiro */}
        {availableMethods.includes('BOLETO') && (
          <button
            onClick={() => setPaymentMethod('boleto')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all text-sm ${
              paymentMethod === 'boleto'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="font-medium">Boleto</div>
          </button>
        )}
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cartão Visual */}
          <div className="order-2 md:order-1">
            <CreditCardVisual 
              focusedField={focusedField}
              cardNumber={cardNumber}
              cardName={cardName}
              cardExpiry={cardExpiry}
              cardCvv={cardCvv}
            />
          </div>

          {/* Formulário */}
          <form id="form-checkout" className="space-y-4 order-1 md:order-2">
            <input type="hidden" id="form-checkout__cardholderEmail" value={customerData.email} />
            <input type="hidden" id="form-checkout__identificationNumber" value={customerData.cpf.replace(/\D/g, '')} />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Número do Cartão</label>
              <div 
                id="form-checkout__cardNumber" 
                className="h-12"
                onFocus={() => setFocusedField('number')}
                onBlur={() => setFocusedField(null)}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Validade</label>
                <div 
                  id="form-checkout__expirationDate" 
                  className="h-12"
                  onFocus={() => setFocusedField('expiry')}
                  onBlur={() => setFocusedField(null)}
                ></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CVV</label>
                <div 
                  id="form-checkout__securityCode" 
                  className="h-12"
                  onFocus={() => setFocusedField('cvv')}
                  onBlur={() => setFocusedField(null)}
                ></div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome no Cartão</label>
              <input
                id="form-checkout__cardholderName"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full border border-slate-600 bg-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                placeholder="Nome como está no cartão"
              />
            </div>
            
            <div className="hidden">
              <select id="form-checkout__issuer"></select>
              <select id="form-checkout__identificationType"></select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Parcelas</label>
              <select id="form-checkout__installments" className="w-full border border-slate-600 bg-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"></select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar R$ ${amount.toFixed(2)}`
              )}
            </button>
          </form>
        </div>
      )}

      {/* PIX Payment */}
      {paymentMethod === 'pix' && (
        <div className="space-y-4">
          {markupPercentage > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm font-medium mb-1">
                🎉 {markupPercentage}% de desconto no PIX!
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 line-through text-sm">
                  R$ {amount.toFixed(2)}
                </span>
                <span className="text-green-400 font-bold text-xl">
                  R$ {pixAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {!pixQrCode ? (
            <button
              onClick={handlePixPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                `Gerar PIX - R$ ${pixAmount.toFixed(2)}`
              )}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-600">
                <img src={`data:image/png;base64,${pixQrCodeBase64}`} alt="QR Code PIX" className="mx-auto" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Copie o código PIX:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixQrCode}
                    readOnly
                    className="flex-1 border rounded-lg p-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixQrCode);
                      alert('Código copiado!');
                    }}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-400">
                Abra o app do seu banco e pague usando o QR Code ou o código copiado
              </p>
            </div>
          )}
        </div>
      )}

      {/* Boleto Payment */}
      {paymentMethod === 'boleto' && (
        <div className="space-y-4">
          {!boletoUrl ? (
            <button
              onClick={handleBoletoPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Boleto...
                </>
              ) : (
                `Gerar Boleto - R$ ${amount.toFixed(2)}`
              )}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-slate-700 p-6 rounded-lg border-2 border-blue-600">
                <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-white font-medium mb-4">Boleto gerado com sucesso!</p>
                <a
                  href={boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Abrir Boleto
                </a>
              </div>
              
              <p className="text-sm text-slate-400">
                Clique no botão acima para visualizar e imprimir o boleto
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
