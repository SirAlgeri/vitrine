import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ProductCard } from './components/ProductCard';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductForm } from './components/ProductForm';
import { AdminLogin } from './components/AdminLogin';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { StorageService } from './services/storageService';
import { api } from './services/api';
import { Product, AppConfig, ViewState, CartItem } from './types';
import { Search } from 'lucide-react';

const App: React.FC = () => {
  // Application State
  const [view, setView] = useState<ViewState>('CATALOG');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>({ storeName: 'VitrinePro', primaryColor: '#3b82f6', secondaryColor: '#10b981' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Initial Load
  useEffect(() => {
    loadData();
    setCart(StorageService.getCart());
    const session = sessionStorage.getItem('vitrine_session');
    if (session === 'true') setIsAuthenticated(true);
  }, []);

  const loadData = async () => {
    try {
      const [productsData, configData] = await Promise.all([
        api.getProducts(),
        api.getConfig()
      ]);
      setProducts(productsData);
      if (configData.store_name) {
        setConfig({
          storeName: configData.store_name,
          primaryColor: configData.primary_color,
          secondaryColor: configData.secondary_color,
          whatsappNumber: configData.whatsapp_number
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cart Actions
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      StorageService.saveCart(newCart);
      return newCart;
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      });
      StorageService.saveCart(newCart);
      return newCart;
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== id);
      StorageService.saveCart(newCart);
      return newCart;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    StorageService.saveCart([]);
  };

  // Auth Actions
  const handleLogin = async (username: string, password: string) => {
    try {
      await api.login(username, password);
      setIsAuthenticated(true);
      sessionStorage.setItem('vitrine_session', 'true');
      setView('ADMIN_DASHBOARD');
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('vitrine_session');
    setView('CATALOG');
  };

  // Product Actions
  const handleSaveProduct = async (product: Product) => {
    try {
      if (editingProduct) {
        await api.updateProduct(product.id, product);
        setProducts(products.map(p => p.id === product.id ? product : p));
      } else {
        await api.createProduct(product);
        setProducts([product, ...products]);
      }
      setView('ADMIN_DASHBOARD');
      setEditingProduct(undefined);
    } catch (err) {
      alert('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Erro ao deletar produto');
    }
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
    try {
      await api.updateConfig({
        store_name: newConfig.storeName,
        primary_color: newConfig.primaryColor,
        secondary_color: newConfig.secondaryColor,
        whatsapp_number: newConfig.whatsappNumber
      });
      setConfig(newConfig);
    } catch (err) {
      alert('Erro ao atualizar configuração');
    }
  };

  // View Routing Logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    switch (view) {
      case 'LOGIN':
        return <AdminLogin onLogin={handleLogin} onCancel={() => setView('CATALOG')} />;
      
      case 'ADMIN_DASHBOARD':
        if (!isAuthenticated) {
            setView('LOGIN');
            return null;
        }
        return (
          <AdminDashboard 
            products={products}
            config={config}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setView('PRODUCT_FORM');
            }}
            onDeleteProduct={handleDeleteProduct}
            onUpdateConfig={handleUpdateConfig}
          />
        );

      case 'PRODUCT_FORM':
        if (!isAuthenticated) return null;
        return (
          <ProductForm 
            initialProduct={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => setView('ADMIN_DASHBOARD')}
          />
        );

      case 'CATALOG':
      default:
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(catalogSearch.toLowerCase())
        );

        return (
          <div className="animate-fade-in">
             {/* Search Hero */}
             <div className="mb-8 relative">
                <div className="relative max-w-md mx-auto">
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
             </div>

             {/* Grid */}
             {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onClick={(p) => setSelectedProduct(p)}
                            onAddToCart={handleAddToCart}
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
        );
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Layout 
        config={config} 
        currentView={view} 
        isAuthenticated={isAuthenticated}
        cartItemCount={totalCartItems}
        onNavigate={setView}
        onLogout={handleLogout}
        onToggleCart={() => setIsCartOpen(true)}
      >
        {renderContent()}
      </Layout>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={handleAddToCart}
        config={config}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        config={config}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />
    </>
  );
};

export default App;
