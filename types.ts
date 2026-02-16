export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string; // Base64 string - primeira imagem
  images?: string[]; // Array de imagens (até 10)
  createdAt: number;
  fields?: { [fieldId: string]: string };
}

export interface FieldDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'currency' | 'select';
  is_default: boolean;
  can_delete: boolean;
  field_order: number;
  options?: string; // JSON string array for select type
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
  logo_url?: string;
  markupPercentage?: number;
  cepOrigem?: string;
}

export type ViewState = 'CATALOG' | 'ADMIN_DASHBOARD' | 'PRODUCT_FORM' | 'FIELD_MANAGER' | 'CUSTOMER_ACCOUNT' | 'AUTH';

export interface AdminSession {
  isAuthenticated: boolean;
}

export interface Customer {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  cpf?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  aceita_marketing: boolean;
  status: 'ativo' | 'inativo' | 'bloqueado';
  criado_em: string;
  ultimo_login_em?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  nome_endereco: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  is_default: boolean;
}

export interface CustomerRegister {
  nome_completo: string;
  email: string;
  senha: string;
  telefone: string;
  aceita_marketing?: boolean;
}

export interface CustomerLogin {
  email: string;
  senha: string;
}
