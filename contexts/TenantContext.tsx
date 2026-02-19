import React, { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  subdomain: string;
  store_name: string;
  active: boolean;
  created_at: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const response = await fetch('/api/tenant/current');
        
        if (!response.ok) {
          throw new Error('Loja não encontrada');
        }
        
        const data = await response.json();
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de TenantProvider');
  }
  
  return context;
}
