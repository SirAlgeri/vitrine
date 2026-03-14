const API_URL = import.meta.env.PROD ? '/api' : '/api';

// Helper para obter token
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : {
    'Content-Type': 'application/json'
  };
};

export const api = {
  // Config
  getConfig: async () => {
    const res = await fetch(`${API_URL}/config`);
    return res.json();
  },
  
  updateConfig: async (config) => {
    const res = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Erro ao atualizar configuração');
    return res.json();
  },

  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login falhou');
    const data = await res.json();
    
    // Salvar token
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
  },

  // Products
  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`);
    return res.json();
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
    if (!res.ok) throw new Error('Erro no upload');
    const data = await res.json();
    return data.urls;
  },

  createProduct: async (product) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Erro ao criar produto');
    return res.json();
  },

  updateProduct: async (id, product) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Erro ao atualizar produto');
    return res.json();
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao deletar produto');
    return res.json();
  },

  // Orders
  createOrder: async (order) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.json();
  }
};
