import React from 'react';
import { AppConfig } from '../types';
import { ShoppingBag, Lock, LogOut, ArrowLeft, ShoppingCart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  config: AppConfig;
  currentView: string;
  isAuthenticated: boolean;
  cartItemCount: number;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  onToggleCart: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  config, 
  currentView, 
  isAuthenticated, 
  cartItemCount,
  onNavigate,
  onLogout,
  onToggleCart
}) => {
  // Apply dynamic colors using CSS variables
  const style = {
    '--primary': config.primaryColor,
    '--secondary': config.secondaryColor,
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('CATALOG')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
              {config.storeName}
            </h1>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent sm:hidden">
              {config.storeName.slice(0, 10)}{config.storeName.length > 10 ? '...' : ''}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {currentView !== 'CATALOG' && (
              <button 
                onClick={() => onNavigate('CATALOG')}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Voltar ao Catálogo"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Voltar</span>
              </button>
            )}

            {!isAuthenticated && (
              <button
                onClick={onToggleCart}
                className="relative p-2 text-slate-100 hover:text-primary transition-colors mr-2"
                title="Carrinho"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="p-2 text-slate-400 hover:text-primary transition-colors"
                title="Área Admin"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Sticky Nav for Admin */}
      {isAuthenticated && currentView !== 'PRODUCT_FORM' && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <button
             onClick={() => onNavigate('ADMIN_DASHBOARD')}
             className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center text-primary hover:scale-105 transition-transform"
          >
            <Lock className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
