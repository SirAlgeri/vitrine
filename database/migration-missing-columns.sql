-- Migration: Colunas faltantes identificadas

-- Tabela orders: tracking e delivery
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_deadline DATE;

-- Tabela config: whatsapp e logo
ALTER TABLE config ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE config ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Tabela field_definitions: options (para campos select)
ALTER TABLE field_definitions ADD COLUMN IF NOT EXISTS options TEXT;

-- Tabela customers: campos de endereço diretos (compatibilidade com frontend)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cep VARCHAR(9);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);
