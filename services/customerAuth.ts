import { Customer, CustomerRegister, CustomerLogin } from '../types';

const API_URL = '/api';

export const customerAuth = {
  register: async (data: CustomerRegister): Promise<Customer> => {
    const res = await fetch(`${API_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao cadastrar');
    }
    const result = await res.json();
    return result.customer;
  },

  login: async (data: CustomerLogin): Promise<Customer> => {
    const res = await fetch(`${API_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }
    const result = await res.json();
    return result.customer;
  },

  getMe: async (id: string): Promise<Customer> => {
    const res = await fetch(`${API_URL}/customers/me/${id}`);
    if (!res.ok) throw new Error('Erro ao buscar dados');
    return res.json();
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar');
    return res.json();
  },

  changePassword: async (id: string, senha_atual: string, senha_nova: string): Promise<void> => {
    const res = await fetch(`${API_URL}/customers/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha_atual, senha_nova })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao alterar senha');
    }
  },

  deleteAccount: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir conta');
  },

  getOrders: async (id: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/orders/customer/${id}`);
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    return res.json();
  },

  // Local storage helpers
  saveSession: (customer: Customer) => {
    localStorage.setItem('customer', JSON.stringify(customer));
  },

  getSession: (): Customer | null => {
    const data = localStorage.getItem('customer');
    return data ? JSON.parse(data) : null;
  },

  clearSession: () => {
    localStorage.removeItem('customer');
  }
};
