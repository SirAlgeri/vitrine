import React from 'react';
import { Product } from '../types';
import { Eye, Info, ShoppingCart } from 'lucide-react';
import { applyMarkup } from '../services/pricing';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  markupPercentage?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart, markupPercentage = 0 }) => {
  const finalPrice = applyMarkup(product.price, markupPercentage);
  
  return (
    <div 
      className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 flex flex-col h-full"
    >
      {/* Image Aspect Ratio Wrapper */}
      <div 
        className="aspect-square w-full overflow-hidden bg-slate-900 relative cursor-pointer"
        onClick={() => onClick(product)}
      >
        {product.image ? (
          <>
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            
            {/* Indicador de múltiplas fotos */}
            {product.images && product.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {product.images.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        
        {/* Overlay on hover (Desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-white/20">
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 
          className="font-semibold text-slate-100 text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-xl font-bold text-white tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
            title="Adicionar ao Carrinho"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
