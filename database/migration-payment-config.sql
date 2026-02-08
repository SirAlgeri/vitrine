-- Adicionar configurações de métodos de pagamento
ALTER TABLE config ADD COLUMN IF NOT EXISTS enable_online_checkout BOOLEAN DEFAULT true;
ALTER TABLE config ADD COLUMN IF NOT EXISTS enable_whatsapp_checkout BOOLEAN DEFAULT true;
ALTER TABLE config ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '["PIX", "CARD", "BOLETO"]'::jsonb;
