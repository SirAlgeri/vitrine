-- Adicionar colunas para dados de pagamento do Mercado Pago
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

-- Criar índice para buscar por payment_id
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
