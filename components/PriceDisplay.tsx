import React from 'react';
import { applyMarkup, getPixPrice } from '../services/pricing';

interface PriceDisplayProps {
  basePrice: number;
  markupPercentage: number;
  showPixPrice?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  basePrice, 
  markupPercentage, 
  showPixPrice = false,
  className = '' 
}) => {
  const finalPrice = applyMarkup(basePrice, markupPercentage);
  const pixPrice = getPixPrice(finalPrice, markupPercentage);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  if (showPixPrice && markupPercentage > 0) {
    return (
      <div className={className}>
        <div className="flex items-baseline gap-2">
          <span className="text-lg line-through text-slate-400">{formatPrice(finalPrice)}</span>
          <span className="text-2xl font-bold text-green-500">{formatPrice(pixPrice)}</span>
        </div>
        <p className="text-xs text-green-400">
          {markupPercentage}% de desconto no PIX
        </p>
      </div>
    );
  }

  return (
    <span className={className}>{formatPrice(finalPrice)}</span>
  );
};
