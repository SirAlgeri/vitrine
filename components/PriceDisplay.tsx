import React from 'react';

interface PriceDisplayProps {
  basePrice: number;
  pixPrice?: number;
  showPixPrice?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  basePrice, 
  pixPrice,
  showPixPrice = false,
  className = '' 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  if (showPixPrice && pixPrice && pixPrice < basePrice) {
    return (
      <div className={className}>
        <div className="flex items-baseline gap-2">
          <span className="text-lg line-through text-slate-400">{formatPrice(basePrice)}</span>
          <span className="text-2xl font-bold text-green-500">{formatPrice(pixPrice)}</span>
        </div>
        <p className="text-xs text-green-400">
          Desconto no PIX
        </p>
      </div>
    );
  }

  return (
    <span className={className}>{formatPrice(basePrice)}</span>
  );
};
