import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminDashboard } from '../components/AdminDashboard';
import { ProductForm } from '../components/ProductForm';
import { FieldManager } from '../components/FieldManager';
import { PaymentSettings } from '../components/PaymentSettings';
import { SalesDashboard } from '../components/SalesDashboard';
import { api } from '../services/api';
import { Product, AppConfig } from '../types';

interface AdminPageProps {
  isAuthenticated: boolean;
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ isAuthenticated, config, onUpdateConfig }) => {
  const [view, setView] = useState<'dashboard' | 'form' | 'fields' | 'payments' | 'sales'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) loadProducts();
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleSaveProduct = async (product: Product) => {
    try {
      if (editingProduct) {
        await api.updateProduct(product.id, product);
        setProducts(products.map(p => p.id === product.id ? product : p));
        setSuccessMessage('Produto editado com sucesso!');
      } else {
        await api.createProduct(product);
        setProducts([product, ...products]);
        setSuccessMessage('Produto adicionado com sucesso!');
      }
      setView('dashboard');
      setEditingProduct(undefined);
      loadProducts();
      setTimeout(() => setSuccessMessage(''), 3000);
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

  if (view === 'form') {
    return (
      <ProductForm 
        initialProduct={editingProduct}
        onSave={handleSaveProduct}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  if (view === 'fields') {
    return <FieldManager onBack={() => setView('dashboard')} />;
  }

  if (view === 'payments') {
    return <PaymentSettings onBack={() => setView('dashboard')} />;
  }

  if (view === 'sales') {
    return <SalesDashboard onBack={() => setView('dashboard')} />;
  }

  return (
    <AdminDashboard 
      products={products}
      config={config}
      onEditProduct={(p) => {
        setEditingProduct(p);
        setView('form');
      }}
      onDeleteProduct={handleDeleteProduct}
      onUpdateConfig={onUpdateConfig}
      onManageCategories={() => setView('fields')}
      onManagePayments={() => setView('payments')}
      onViewSales={() => setView('sales')}
      successMessage={successMessage}
    />
  );
};
