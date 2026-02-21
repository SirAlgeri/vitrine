import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { api } from '../services/api';
import { Product, AppConfig, FieldDefinition } from '../types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface HomeProps {
  config: AppConfig;
  onAddToCart: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({ config, onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedFilters, setSelectedFilters] = useState<{ [fieldId: string]: string[] }>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadFields();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos');
    }
  };

  const loadFields = async () => {
    try {
      const res = await fetch('/api/field-definitions');
      const data = await res.json();
      // Garantir que data é um array antes de filtrar
      if (Array.isArray(data)) {
        setFields(data.filter((f: FieldDefinition) => f.field_type === 'select'));
      } else {
        console.error('Resposta inválida de field-definitions:', data);
        setFields([]);
      }
    } catch (err) {
      console.error('Erro ao carregar campos');
      setFields([]);
    }
  };

  const toggleFilter = (fieldId: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[fieldId] || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [fieldId]: newValues };
    });
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedFilters({});
  };

  const filtered = products.filter(p => {
    // Filtro de busca
    if (catalogSearch && !p.name.toLowerCase().includes(catalogSearch.toLowerCase())) {
      return false;
    }

    // Filtro de preço
    if (priceRange.min && p.price < parseFloat(priceRange.min)) return false;
    if (priceRange.max && p.price > parseFloat(priceRange.max)) return false;

    // Filtros de campos select
    for (const fieldId in selectedFilters) {
      if (selectedFilters[fieldId].length > 0) {
        const productValue = p.fields?.[fieldId];
        if (!productValue || !selectedFilters[fieldId].includes(productValue)) {
          return false;
        }
      }
    }

    return true;
  });

  const activeFiltersCount = Object.values(selectedFilters).flat().length + (priceRange.min || priceRange.max ? 1 : 0);

  return (
    <>
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-full leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm shadow-lg transition-all"
                placeholder="O que você procura hoje?"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-all shadow-lg flex items-center gap-2"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="mt-4 p-6 bg-slate-800 rounded-lg border border-slate-700 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filtro de Preço */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Faixa de Preço</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={priceRange.min ? `R$ ${parseFloat(priceRange.min).toFixed(2).replace('.', ',')}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setPriceRange({ ...priceRange, min: value ? (parseInt(value) / 100).toString() : '' });
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                    />
                    <span className="text-slate-400">até</span>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={priceRange.max ? `R$ ${parseFloat(priceRange.max).toFixed(2).replace('.', ',')}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setPriceRange({ ...priceRange, max: value ? (parseInt(value) / 100).toString() : '' });
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Filtros de Campos Select */}
                {fields.map(field => {
                  const options = field.options ? JSON.parse(field.options) : [];
                  return (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-slate-400 mb-2">{field.field_name}</label>
                      <select
                        value={selectedFilters[field.id]?.[0] || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedFilters({ ...selectedFilters, [field.id]: [e.target.value] });
                          } else {
                            const { [field.id]: _, ...rest } = selectedFilters;
                            setSelectedFilters(rest);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                      >
                        <option value="">Todos</option>
                        {options.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={(p) => setSelectedProduct(p)}
                onAddToCart={onAddToCart}
                markupPercentage={config.markupPercentage || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-slate-800 mb-4 text-slate-500">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Nada encontrado</h3>
            <p className="text-slate-400">Tente buscar por outro termo.</p>
          </div>
        )}
      </div>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={onAddToCart}
        config={config}
      />
    </>
  );
};
