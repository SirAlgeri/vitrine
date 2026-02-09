import { useState, useEffect } from 'react';

interface CreditCardVisualProps {
  focusedField: 'number' | 'expiry' | 'cvv' | null;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export default function CreditCardVisual({ focusedField, cardNumber = '', cardName = '', cardExpiry = '', cardCvv = '' }: CreditCardVisualProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(focusedField === 'cvv');
  }, [focusedField]);

  // Formatar número do cartão em grupos de 4
  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    const groups = [];
    for (let i = 0; i < 4; i++) {
      const group = cleaned.slice(i * 4, (i + 1) * 4);
      groups.push(group.padEnd(4, '•'));
    }
    return groups;
  };

  const displayNumber = formatCardNumber(cardNumber);
  const displayName = cardName.toUpperCase() || 'SEU NOME AQUI';
  const displayExpiry = cardExpiry || 'MM/AA';
  const displayCvv = cardCvv.padEnd(3, '•');

  return (
    <div className="w-full max-w-sm mx-auto perspective-1000">
      <div 
        className={`relative w-full h-52 transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Frente do Cartão */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-600">
            {/* Chip */}
            <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md mb-6"></div>
            
            {/* Número do Cartão */}
            <div 
              className={`mb-6 transition-all duration-300 ${
                focusedField === 'number' 
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 rounded-lg p-2 -m-2' 
                  : ''
              }`}
            >
              <div className="flex gap-3 text-slate-300 text-lg font-mono tracking-wider">
                {displayNumber.map((group, i) => (
                  <span key={i}>{group}</span>
                ))}
              </div>
            </div>
            
            {/* Nome e Validade */}
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-slate-500 mb-1">Nome no Cartão</div>
                <div className="text-sm text-slate-300 font-medium">{displayName}</div>
              </div>
              
              <div 
                className={`transition-all duration-300 ${
                  focusedField === 'expiry' 
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 rounded-lg p-2 -m-2' 
                    : ''
                }`}
              >
                <div className="text-xs text-slate-500 mb-1">Validade</div>
                <div className="text-sm text-slate-300 font-mono">{displayExpiry}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verso do Cartão */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-2xl border border-slate-600 overflow-hidden">
            {/* Tarja Magnética */}
            <div className="w-full h-12 bg-slate-950 mt-6"></div>
            
            {/* Área de Assinatura e CVV */}
            <div className="p-6">
              <div className="bg-slate-200 h-10 rounded flex items-center justify-end px-3 mb-4">
                <div 
                  className={`transition-all duration-300 ${
                    focusedField === 'cvv' 
                      ? 'ring-2 ring-blue-500 rounded px-2 py-1' 
                      : ''
                  }`}
                >
                  <span className="text-slate-800 font-mono text-sm">{displayCvv}</span>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 text-center">
                Código de Segurança
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dica Visual */}
      {focusedField && (
        <div className="mt-4 text-center text-sm text-slate-400 animate-fade-in">
          {focusedField === 'number' && '💳 Digite o número do cartão'}
          {focusedField === 'expiry' && '📅 Informe a data de validade'}
          {focusedField === 'cvv' && '🔒 Código de 3 dígitos no verso'}
        </div>
      )}
    </div>
  );
}
