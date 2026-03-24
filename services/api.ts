import { Product, AppConfig } from '../types';

const API_URL = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('admin_token');
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : {
    'Content-Type': 'application/json'
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  getConfig: async (): Promise<Record<string, any>> => {
    const res = await fetch(`${API_URL}/config`);
    return handleResponse(res);
  },

  getAdminConfig: async (): Promise<Record<string, any>> => {
    const res = await fetch(`${API_URL}/config/admin`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  
  updateConfig: async (config: Partial<Record<string, any>>): Promise<Record<string, any>> => {
    const res = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return handleResponse(res);
  },

  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse<{ token?: string; success: boolean }>(res);
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products?all=true`);
    return handleResponse(res);
  },

  getProductsPage: async (page = 1, limit = 24, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetch(`${API_URL}/products?${params}`);
    return handleResponse<{ products: Product[]; nextPage: number | null; total: number }>(res);
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_URL}/upload-images`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await handleResponse<{ urls: string[] }>(res);
    return data.urls;
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return handleResponse(res);
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createOrder: async (order: Record<string, any>) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return handleResponse(res);
  }
};
