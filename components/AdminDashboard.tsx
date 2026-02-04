import React, { useState } from 'react';
import { Product, AppConfig } from '../types';
import { Plus, Edit2, Trash2, Settings, Palette, Save } from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  config: AppConfig;
  onEditProduct: (product?: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  config,
  onEditProduct,
  onDeleteProduct,
  onUpdateConfig
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveConfig = () => {
    onUpdateConfig(tempConfig);
    setShowConfig(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Painel Administrativo</h2>
          <p className="text-slate-400 text-sm">Gerencie seus produtos e aparência da loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2.5 rounded-lg border transition-colors ${showConfig ? 'bg-primary border-primary text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEditProduct(undefined)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Novo Produto</span>
            <span className="md:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Theme Configuration Panel */}
      {showConfig && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl mb-8">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <Palette className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Personalização Visual</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Loja</label>
              <input
                type="text"
                value={tempConfig.storeName}
                onChange={(e) => setTempConfig({...tempConfig, storeName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp (com DDI e DDD)</label>
              <input
                type="text"
                value={tempConfig.whatsappNumber || ''}
                onChange={(e) => setTempConfig({...tempConfig, whatsappNumber: e.target.value})}
                placeholder="5511999999999"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Exemplo: 5511999999999 (55 = Brasil, 11 = DDD, número)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Cor Principal (Destaque)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={tempConfig.primaryColor}
                  onChange={(e) => setTempConfig({...tempConfig, primaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none p-0"
                />
                <span className="text-slate-300 font-mono text-sm">{tempConfig.primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Cor Secundária</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={tempConfig.secondaryColor}
                  onChange={(e) => setTempConfig({...tempConfig, secondaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none p-0"
                />
                <span className="text-slate-300 font-mono text-sm">{tempConfig.secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Seus Produtos ({filteredProducts.length})</h3>
            <input 
                type="text" 
                placeholder="Buscar produto..." 
                className="bg-slate-800 border border-slate-700 text-sm rounded-md px-3 py-1.5 text-white focus:outline-none focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
              <p className="text-slate-500">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-slate-600 transition-colors"
              >
                <div className="w-16 h-16 bg-slate-900 rounded-lg flex-shrink-0 overflow-hidden border border-slate-700">
                   {product.image ? (
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-slate-800" />
                   )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className="font-medium text-white truncate">{product.name}</h4>
                  <p className="text-primary font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditProduct(product)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                        if(window.confirm('Tem certeza que deseja excluir este produto?')) {
                            onDeleteProduct(product.id);
                        }
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
