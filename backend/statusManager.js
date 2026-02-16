// ========== ENUMS DE STATUS ==========

export const PaymentStatus = {
  PENDING: 'PAYMENT_PENDING',
  PROCESSING: 'PAYMENT_PROCESSING',
  APPROVED: 'PAYMENT_APPROVED',
  REFUSED: 'PAYMENT_REFUSED',
  CANCELED: 'PAYMENT_CANCELED',
  EXPIRED: 'PAYMENT_EXPIRED',
  REFUNDED: 'PAYMENT_REFUNDED'
};

export const OrderStatus = {
  PENDING_PAYMENT: 'ORDER_PENDING_PAYMENT',
  PAID: 'ORDER_PAID',
  PREPARING: 'ORDER_PREPARING',
  SHIPPED: 'ORDER_SHIPPED',
  DELIVERED: 'ORDER_DELIVERED',
  CANCELED: 'ORDER_CANCELED',
  REFUNDED: 'ORDER_REFUNDED'
};

// ========== MAPEAMENTO ==========

export const PAYMENT_TO_ORDER_STATUS = {
  [PaymentStatus.PENDING]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.PROCESSING]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.APPROVED]: OrderStatus.PAID,
  [PaymentStatus.REFUSED]: OrderStatus.PENDING_PAYMENT,
  [PaymentStatus.EXPIRED]: OrderStatus.CANCELED,
  [PaymentStatus.CANCELED]: OrderStatus.CANCELED,
  [PaymentStatus.REFUNDED]: OrderStatus.REFUNDED
};

// ========== MAPPER MERCADO PAGO ==========

export function mapMercadoPagoStatus(mpStatus) {
  const statusMap = {
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

// ========== ATUALIZAR STATUS DO PEDIDO ==========

export async function updateOrderStatus(pool, orderId, paymentProviderStatus, changedBy = 'system', notes = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Buscar status atual
    const currentOrder = await client.query(
      'SELECT payment_status, order_status FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (currentOrder.rows.length === 0) {
      throw new Error('Pedido não encontrado');
    }
    
    const { payment_status: oldPaymentStatus, order_status: oldOrderStatus } = currentOrder.rows[0];
    
    // Mapear status do gateway para status interno
    const newPaymentStatus = mapMercadoPagoStatus(paymentProviderStatus);
    const newOrderStatus = PAYMENT_TO_ORDER_STATUS[newPaymentStatus];
    
    // Deduzir estoque se pagamento foi aprovado agora
    if (newPaymentStatus === PaymentStatus.APPROVED && oldPaymentStatus !== PaymentStatus.APPROVED) {
      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      for (const item of items.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = GREATEST(stock_quantity - $1, 0) WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }
    
    // Atualizar pedido
    await client.query(
      `UPDATE orders 
       SET payment_status = $1, 
           order_status = $2, 
           payment_provider_status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newPaymentStatus, newOrderStatus, paymentProviderStatus, orderId]
    );
    
    // Registrar histórico
    await client.query(
      `INSERT INTO order_status_history 
       (order_id, previous_payment_status, new_payment_status, previous_order_status, new_order_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, oldPaymentStatus, newPaymentStatus, oldOrderStatus, newOrderStatus, changedBy, notes]
    );
    
    await client.query('COMMIT');
    
    return { newPaymentStatus, newOrderStatus };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ========== ATUALIZAR STATUS MANUAL (ADMIN) ==========

export async function updateOrderStatusManual(pool, orderId, newOrderStatus, changedBy = 'admin', notes = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const currentOrder = await client.query(
      'SELECT payment_status, order_status FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (currentOrder.rows.length === 0) {
      throw new Error('Pedido não encontrado');
    }
    
    const { payment_status, order_status: oldOrderStatus } = currentOrder.rows[0];
    
    // Validar transição
    if (newOrderStatus === OrderStatus.SHIPPED && payment_status !== PaymentStatus.APPROVED) {
      throw new Error('Não é possível enviar pedido sem pagamento aprovado');
    }
    
    if ([OrderStatus.CANCELED, OrderStatus.REFUNDED].includes(oldOrderStatus)) {
      throw new Error('Não é possível alterar pedido cancelado ou estornado');
    }
    
    // Atualizar pedido
    await client.query(
      `UPDATE orders 
       SET order_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newOrderStatus, orderId]
    );
    
    // Registrar histórico
    await client.query(
      `INSERT INTO order_status_history 
       (order_id, previous_order_status, new_order_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, oldOrderStatus, newOrderStatus, changedBy, notes]
    );
    
    await client.query('COMMIT');
    
    return { newOrderStatus };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


