export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string; // Base64 string
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  cpf: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: 'PIX' | 'CARD' | 'CASH';
}

export interface ShippingInfo {
  value: number;
  days: number;
}

export interface AppConfig {
  primaryColor: string;
  secondaryColor: string;
  storeName: string;
  whatsappNumber?: string;
}

export type ViewState = 'CATALOG' | 'LOGIN' | 'ADMIN_DASHBOARD' | 'PRODUCT_FORM';

export interface AdminSession {
  isAuthenticated: boolean;
}
