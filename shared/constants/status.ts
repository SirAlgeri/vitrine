// ========== ENUMS DE STATUS (FONTE ÚNICA DA VERDADE) ==========

export enum PaymentStatus {
  PENDING = 'PAYMENT_PENDING',
  PROCESSING = 'PAYMENT_PROCESSING',
  APPROVED = 'PAYMENT_APPROVED',
  REFUSED = 'PAYMENT_REFUSED',
  CANCELED = 'PAYMENT_CANCELED',
  EXPIRED = 'PAYMENT_EXPIRED',
  REFUNDED = 'PAYMENT_REFUNDED'
}

export enum OrderStatus {
  PENDING_PAYMENT = 'ORDER_PENDING_PAYMENT',
  PAID = 'ORDER_PAID',
  PREPARING = 'ORDER_PREPARING',
  SHIPPED = 'ORDER_SHIPPED',
  DELIVERED = 'ORDER_DELIVERED',
  CANCELED = 'ORDER_CANCELED',
  REFUNDED = 'ORDER_REFUNDED'
}

// ========== MAPEAMENTO PAGAMENTO → PEDIDO ==========

export const PAYMENT_TO_ORDER_STATUS: Record<PaymentStatus, OrderStatus> = {
  [PaymentStatus.PENDING]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.PROCESSING]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.APPROVED]: OrderStatus.PAID,
  [PaymentStatus.REFUSED]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.EXPIRED]: OrderStatus.CANCELED,
  [PaymentStatus.CANCELED]: OrderStatus.CANCELED,
  [PaymentStatus.REFUNDED]: OrderStatus.REFUNDED
};

// ========== MAPPER: MERCADO PAGO → STATUS INTERNO ==========

export function mapMercadoPagoStatus(mpStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'pending': PaymentStatus.PENDING,
    'in_process': PaymentStatus.PROCESSING,
    'approved': PaymentStatus.APPROVED,
    'rejected': PaymentStatus.REFUSED,
    'cancelled': PaymentStatus.CANCELED,
    'refunded': PaymentStatus.REFUNDED,
    'charged_back': PaymentStatus.REFUNDED
  };
  return statusMap[mpStatus] || PaymentStatus.PENDING;
}

// ========== LABELS PARA EXIBIÇÃO ==========

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Aguardando pagamento',
  [PaymentStatus.PROCESSING]: 'Processando pagamento',
  [PaymentStatus.APPROVED]: 'Pago',
  [PaymentStatus.REFUSED]: 'Recusado',
  [PaymentStatus.CANCELED]: 'Cancelado',
  [PaymentStatus.EXPIRED]: 'Expirado',
  [PaymentStatus.REFUNDED]: 'Estornado'
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'Aguardando pagamento',
  [OrderStatus.PAID]: 'Pago',
  [OrderStatus.PREPARING]: 'Preparando envio',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Concluído',
  [OrderStatus.CANCELED]: 'Cancelado',
  [OrderStatus.REFUNDED]: 'Estornado'
};

// ========== CORES PARA BADGES ==========

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300',
  [PaymentStatus.PROCESSING]: 'bg-blue-500/20 text-blue-300',
  [PaymentStatus.APPROVED]: 'bg-green-500/20 text-green-300',
  [PaymentStatus.REFUSED]: 'bg-red-500/20 text-red-300',
  [PaymentStatus.CANCELED]: 'bg-gray-500/20 text-gray-300',
  [PaymentStatus.EXPIRED]: 'bg-orange-500/20 text-orange-300',
  [PaymentStatus.REFUNDED]: 'bg-purple-500/20 text-purple-300'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'bg-yellow-500/20 text-yellow-300',
  [OrderStatus.PAID]: 'bg-green-500/20 text-green-300',
  [OrderStatus.PREPARING]: 'bg-blue-500/20 text-blue-300',
  [OrderStatus.SHIPPED]: 'bg-indigo-500/20 text-indigo-300',
  [OrderStatus.DELIVERED]: 'bg-green-500/20 text-green-300',
  [OrderStatus.CANCELED]: 'bg-gray-500/20 text-gray-300',
  [OrderStatus.REFUNDED]: 'bg-purple-500/20 text-purple-300'
};

// ========== VALIDAÇÃO DE TRANSIÇÕES ==========

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  paymentStatus: PaymentStatus
): boolean {
  // Não pode enviar sem pagamento aprovado
  if (newStatus === OrderStatus.SHIPPED && paymentStatus !== PaymentStatus.APPROVED) {
    return false;
  }
  
  // Não pode voltar para aguardando pagamento depois de pago
  if ([OrderStatus.PAID, OrderStatus.PREPARING].includes(currentStatus) && newStatus === OrderStatus.PENDING_PAYMENT) {
    return false;
  }
  
  // Não pode alterar pedido cancelado ou estornado
  if ([OrderStatus.CANCELED, OrderStatus.REFUNDED].includes(currentStatus)) {
    return false;
  }
  
  return true;
}
