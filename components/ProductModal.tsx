import React, { useState, useEffect } from 'react';
import { Product, FieldDefinition } from '../types';
import { X, ShoppingCart } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);

  useEffect(() => {
    if (product) loadFields();
  }, [product]);

  // Prevent background scroll
  React.useEffect(() => {
    if (!product) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [product]);

  const loadFields = async () => {
    const res = await fetch('http://localhost:3001/api/field-definitions');
    const data = await res.json();
    setFields(data.filter((f: FieldDefinition) => !f.is_default));
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-up border border-slate-700">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-contain max-h-[50vh] md:max-h-full"
            />
          ) : (
            <div className="text-slate-500">Sem Imagem</div>
          )}
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-slate-900 overflow-y-auto">
          <div className="mb-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              {product.name}
            </h2>
            <div className="text-3xl font-bold text-primary mb-6">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Detalhes</h3>
              <p className="whitespace-pre-line leading-relaxed">
                {product.description || "Nenhuma descrição informada."}
              </p>
            </div>

            {/* Custom Fields */}
            {fields.length > 0 && product.fields && Object.keys(product.fields).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-3">Especificações</h3>
                <dl className="space-y-2">
                  {fields.map(field => {
                    const value = product.fields?.[field.id];
                    if (!value) return null;
                    return (
                      <div key={field.id} className="flex justify-between">
                        <dt className="text-slate-400">{field.field_name}:</dt>
                        <dd className="text-white font-medium">
                          {field.field_type === 'currency' 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
                            : value
                          }
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <button 
                className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
            >
               <ShoppingCart className="w-5 h-5" />
               Adicionar ao Carrinho
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              Você poderá escolher como finalizar no carrinho
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
