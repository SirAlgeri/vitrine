import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CartDrawer } from './components/CartDrawer';
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { AccountPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { NotFound } from './pages/NotFound';
import { StorageService } from './services/storageService';
import { api } from './services/api';
import { customerAuth } from './services/customerAuth';
import { Product, AppConfig, CartItem, Customer } from './types';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>({ 
    storeName: 'VitrinePro', 
    primaryColor: '#3b82f6', 
    secondaryColor: '#10b981' 
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Initial Load
  useEffect(() => {
    loadConfig();
    setCart(StorageService.getCart());
    
    const session = sessionStorage.getItem('vitrine_session');
    if (session === 'true') setIsAuthenticated(true);
    
    const savedCustomer = customerAuth.getSession();
    if (savedCustomer) setCustomer(savedCustomer);
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await api.getConfig();
      if (configData.store_name) {
        const newConfig = {
          storeName: configData.store_name,
          primaryColor: configData.primary_color,
          secondaryColor: configData.secondary_color,
          whatsappNumber: configData.whatsapp_number,
          logo_url: configData.logo_url,
          markupPercentage: configData.markup_percentage || 0,
          cepOrigem: configData.cep_origem,
          enablePickup: configData.enable_pickup,
          pickupAddress: configData.pickup_address
        };
        setConfig(newConfig);
        
        // Atualizar título da página
        document.title = configData.store_name;
        
        // Atualizar favicon
        if (configData.logo_url) {
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = configData.logo_url;
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configuração');
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('vitrine_session');
    customerAuth.clearSession();
    setCustomer(null);
    navigate('/');
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
    try {
      await api.updateConfig({
        store_name: newConfig.storeName,
        primary_color: newConfig.primaryColor,
        secondary_color: newConfig.secondaryColor,
        whatsapp_number: newConfig.whatsappNumber,
        logo_url: newConfig.logo_url,
        markup_percentage: newConfig.markupPercentage,
        cep_origem: newConfig.cepOrigem,
        enable_pickup: newConfig.enablePickup,
        pickup_address: newConfig.pickupAddress
      });
      setConfig(newConfig);
    } catch (err) {
      alert('Erro ao atualizar configuração');
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Layout 
        config={config} 
        isAuthenticated={isAuthenticated}
        cartItemCount={totalCartItems}
        customer={customer}
        onLogout={handleLogout}
        onToggleCart={() => setIsCartOpen(true)}
        onShowAuth={() => navigate('/auth')}
      >
        <Routes>
          <Route path="/" element={<Home config={config} onAddToCart={handleAddToCart} />} />
          
          <Route 
            path="/auth" 
            element={
              <AuthPage 
                onCustomerSuccess={() => {
                  const savedCustomer = customerAuth.getSession();
                  if (savedCustomer) setCustomer(savedCustomer);
                  navigate('/');
                }}
                onAdminSuccess={() => {
                  setIsAuthenticated(true);
                  navigate('/admin');
                }}
              />
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <AdminPage 
                isAuthenticated={isAuthenticated}
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            } 
          />
          
          <Route 
            path="/minha-conta" 
            element={
              <AccountPage 
                customer={customer}
                onLogout={handleLogout}
              />
            } 
          />

          <Route 
            path="/checkout" 
            element={
              <CheckoutPage 
                customer={customer}
                cart={cart}
                config={config}
                onClearCart={handleClearCart}
              />
            } 
          />

          <Route 
            path="/pedido/:orderId/pagar" 
            element={
              <CheckoutPage 
                customer={customer}
                cart={cart}
                config={config}
                onClearCart={handleClearCart}
              />
            } 
          />

          <Route path="/pedido/:orderId" element={<OrderDetailsPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
