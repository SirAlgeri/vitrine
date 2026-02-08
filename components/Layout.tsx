import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppConfig, Customer } from '../types';
import { ShoppingBag, LogOut, ArrowLeft, ShoppingCart, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  config: AppConfig;
  isAuthenticated: boolean;
  cartItemCount: number;
  customer: Customer | null;
  onLogout: () => void;
  onToggleCart: () => void;
  onShowAuth: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  config, 
  isAuthenticated, 
  cartItemCount,
  customer,
  onLogout,
  onToggleCart,
  onShowAuth
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Atualizar variáveis CSS globalmente
  React.useEffect(() => {
    document.documentElement.style.setProperty('--primary', config.primaryColor);
    document.documentElement.style.setProperty('--secondary', config.secondaryColor);
  }, [config.primaryColor, config.secondaryColor]);

  const isHome = location.pathname === '/';
  const showBackButton = !isHome && location.pathname !== '/minha-conta';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.storeName} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="text-white w-5 h-5" />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
              {config.storeName}
            </h1>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent sm:hidden">
              {config.storeName.slice(0, 10)}{config.storeName.length > 10 ? '...' : ''}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Voltar</span>
              </button>
            )}

            {!isAuthenticated && (
              <>
                <button
                  onClick={onToggleCart}
                  className="relative p-2 text-slate-100 hover:text-primary transition-colors"
                  title="Carrinho"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </button>

                {customer ? (
                  <button
                    onClick={() => navigate('/minha-conta')}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{customer.nome_completo.split(' ')[0]}</span>
                  </button>
                ) : (
                  <button
                    onClick={onShowAuth}
                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">Entrar</span>
                  </button>
                )}
              </>
            )}

            {isAuthenticated && (
              <>
                {location.pathname === '/' && (
                  <button 
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Sticky Nav for Admin */}
      {isAuthenticated && location.pathname === '/admin' && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <button
             onClick={() => navigate('/admin')}
             className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-primary hover:scale-105 transition-transform"
          >
            <ShoppingBag className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
