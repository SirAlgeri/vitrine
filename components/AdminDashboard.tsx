import React, { useState } from 'react';
import { Product, AppConfig } from '../types';
import { Plus, Edit2, Trash2, Settings, Palette, Save, Tag, CreditCard, BarChart3 } from 'lucide-react';
import { formatPhone } from '../services/validators';

interface AdminDashboardProps {
  products: Product[];
  config: AppConfig;
  onEditProduct: (product?: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onManageCategories: () => void;
  onManagePayments: () => void;
  onViewSales: () => void;
  successMessage?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  config,
  onEditProduct,
  onDeleteProduct,
  onUpdateConfig,
  onManageCategories,
  onManagePayments,
  onViewSales,
  successMessage
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveConfig = () => {
    onUpdateConfig(tempConfig);
    setShowConfig(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempConfig({...tempConfig, logo_url: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alerta de Sucesso */}
      {(showSuccess || successMessage) && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Save className="w-5 h-5" />
          <span>{successMessage || 'Configurações salvas com sucesso!'}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Painel Administrativo</h2>
          {/*<p className="text-slate-400 text-sm">Gerencie seus produtos e aparência da loja.</p>*/}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewSales}
            className="p-2.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Dashboard de Vendas"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={onManageCategories}
            className="p-2.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Gerenciar Campos"
          >
            <Tag className="w-5 h-5" />
          </button>
          <button
            onClick={onManagePayments}
            className="p-2.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Métodos de Pagamento"
          >
            <CreditCard className="w-5 h-5" />
          </button>
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
              <label className="block text-sm font-medium text-slate-400 mb-2">Logo da Loja</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-primary rounded-lg p-4 transition-colors"
              >
                {tempConfig.logo_url ? (
                  <div className="flex items-center gap-4">
                    <img src={tempConfig.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-white text-sm">Logo carregada</p>
                      <p className="text-slate-400 text-xs">Clique para alterar</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempConfig({...tempConfig, logo_url: ''});
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Clique para fazer upload da logo</p>
                    <p className="text-slate-500 text-xs mt-1">PNG, JPG ou SVG</p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp</label>
              <input
                type="text"
                value={formatPhone(tempConfig.whatsappNumber || '')}
                onChange={(e) => setTempConfig({...tempConfig, whatsappNumber: e.target.value.replace(/[^\d]/g, '')})}
                placeholder="+55 (11) 99999-9999"
                maxLength={19}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Formato: +55 (DDD) 99999-9999</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">CEP de Origem</label>
              <input
                type="text"
                maxLength={9}
                placeholder="00000-000"
                value={tempConfig.cepOrigem || ''}
                onChange={(e) => {
                  const cep = e.target.value.replace(/\D/g, '');
                  setTempConfig({...tempConfig, cepOrigem: cep});
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">CEP para cálculo de frete</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Margem de Lucro (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={tempConfig.markupPercentage || 0}
                onChange={(e) => setTempConfig({...tempConfig, markupPercentage: Number(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Margem aplicada sobre o preço base. PIX terá desconto igual à margem. (0% a 100%)
              </p>
            </div>

            {/* Cores do Tema */}
            <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">🎨 Personalização de Cores</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cor Principal (Destaque)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.primaryColor}
                      onChange={(e) => setTempConfig({...tempConfig, primaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cor Secundária</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.secondaryColor}
                      onChange={(e) => setTempConfig({...tempConfig, secondaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.secondaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Fundo</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.background_color || '#0f172a'}
                      onChange={(e) => setTempConfig({...tempConfig, background_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.background_color || '#0f172a'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cards</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.card_color || '#1e293b'}
                      onChange={(e) => setTempConfig({...tempConfig, card_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.card_color || '#1e293b'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Superfície</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.surface_color || '#334155'}
                      onChange={(e) => setTempConfig({...tempConfig, surface_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.surface_color || '#334155'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Texto Principal</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.text_primary_color || '#ffffff'}
                      onChange={(e) => setTempConfig({...tempConfig, text_primary_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.text_primary_color || '#ffffff'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Texto Secundário</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.text_secondary_color || '#94a3b8'}
                      onChange={(e) => setTempConfig({...tempConfig, text_secondary_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.text_secondary_color || '#94a3b8'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Bordas</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.border_color || '#475569'}
                      onChange={(e) => setTempConfig({...tempConfig, border_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.border_color || '#475569'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Botão Primário</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.button_primary_color || '#3b82f6'}
                      onChange={(e) => setTempConfig({...tempConfig, button_primary_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.button_primary_color || '#3b82f6'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Botão Primário Hover</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.button_primary_hover_color || '#2563eb'}
                      onChange={(e) => setTempConfig({...tempConfig, button_primary_hover_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.button_primary_hover_color || '#2563eb'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Botão Secundário</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.button_secondary_color || '#64748b'}
                      onChange={(e) => setTempConfig({...tempConfig, button_secondary_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.button_secondary_color || '#64748b'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Botão Secundário Hover</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tempConfig.button_secondary_hover_color || '#475569'}
                      onChange={(e) => setTempConfig({...tempConfig, button_secondary_hover_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{tempConfig.button_secondary_hover_color || '#475569'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview das Cores */}
            <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-700">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">👁️ Preview das Cores</h4>
              <div 
                className="rounded-lg p-6 space-y-4"
                style={{ backgroundColor: tempConfig.background_color || '#0f172a' }}
              >
                {/* Card de Produto */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{ 
                    backgroundColor: tempConfig.card_color || '#1e293b',
                    borderColor: tempConfig.border_color || '#475569'
                  }}
                >
                  <h3 
                    className="font-semibold text-lg mb-2"
                    style={{ color: tempConfig.text_primary_color || '#ffffff' }}
                  >
                    Produto Exemplo
                  </h3>
                  <p 
                    className="text-sm mb-3"
                    style={{ color: tempConfig.text_secondary_color || '#94a3b8' }}
                  >
                    Descrição do produto com texto secundário
                  </p>
                  
                  {/* Input Example */}
                  <div 
                    className="rounded px-3 py-2 mb-3 text-sm"
                    style={{ 
                      backgroundColor: tempConfig.surface_color || '#334155',
                      color: tempConfig.text_primary_color || '#ffffff',
                      border: `1px solid ${tempConfig.border_color || '#475569'}`
                    }}
                  >
                    Campo de entrada (superfície)
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded text-white text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: tempConfig.button_primary_color || '#3b82f6'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tempConfig.button_primary_hover_color || '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tempConfig.button_primary_color || '#3b82f6'}
                    >
                      Botão Primário
                    </button>
                    <button
                      className="px-4 py-2 rounded text-white text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: tempConfig.button_secondary_color || '#64748b'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tempConfig.button_secondary_hover_color || '#475569'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tempConfig.button_secondary_color || '#64748b'}
                    >
                      Botão Secundário
                    </button>
                  </div>
                </div>

                {/* Badge com cores principais */}
                <div className="flex gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tempConfig.primaryColor }}
                  >
                    Cor Principal
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tempConfig.secondaryColor }}
                  >
                    Cor Secundária
                  </span>
                </div>
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
