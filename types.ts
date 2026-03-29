export interface Product {
  id: string;
  name: string;
  price: number;
  pix_price?: number;
  description: string;
  image: string; // Base64 string - primeira imagem
  images?: string[]; // Array de imagens (até 10)
  stock_quantity?: number; // Quantidade em estoque
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
  options?: string | string[]; // array após parse do backend
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
  enableOnlineCheckout?: boolean;
  enableWhatsappCheckout?: boolean;
  enablePickup?: boolean;
  pickupAddress?: string;
  background_color?: string;
  card_color?: string;
  surface_color?: string;
  text_primary_color?: string;
  text_secondary_color?: string;
  border_color?: string;
  button_primary_color?: string;
  button_primary_hover_color?: string;
  button_secondary_color?: string;
  button_secondary_hover_color?: string;
  show_logo_only?: boolean;
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
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  aceita_marketing?: boolean;
  email_verified?: boolean;
}

export interface CustomerLogin {
  email: string;
  senha: string;
}
