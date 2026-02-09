-- Adicionar colunas de status padronizados
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PAYMENT_PENDING',
  ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'ORDER_PENDING_PAYMENT',
  ADD COLUMN IF NOT EXISTS payment_provider_status VARCHAR(100);

-- Criar tabela de histórico de status
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_payment_status VARCHAR(50),
  new_payment_status VARCHAR(50),
  previous_order_status VARCHAR(50),
  new_order_status VARCHAR(50),
  changed_by VARCHAR(100) NOT NULL, -- 'gateway', 'system', 'admin', 'webhook'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);

-- Migrar dados existentes
UPDATE orders 
SET 
  payment_status = CASE 
    WHEN payment_status IS NULL OR payment_status = '' THEN 'PAYMENT_PENDING'
    WHEN payment_status = 'approved' THEN 'PAYMENT_APPROVED'
    WHEN payment_status = 'pending' THEN 'PAYMENT_PENDING'
    WHEN payment_status = 'rejected' THEN 'PAYMENT_REFUSED'
    WHEN payment_status = 'cancelled' THEN 'PAYMENT_CANCELED'
    WHEN payment_status = 'refunded' THEN 'PAYMENT_REFUNDED'
    ELSE 'PAYMENT_PENDING'
  END,
  order_status = CASE 
    WHEN payment_status = 'approved' THEN 'ORDER_PREPARING'
    WHEN payment_status IN ('rejected', 'cancelled') THEN 'ORDER_CANCELED'
    WHEN payment_status = 'refunded' THEN 'ORDER_REFUNDED'
    ELSE 'ORDER_PENDING_PAYMENT'
  END
WHERE payment_status IS NULL OR payment_status NOT LIKE 'PAYMENT_%';
