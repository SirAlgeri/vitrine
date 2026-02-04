-- Adicionar campo de WhatsApp na tabela config
ALTER TABLE config ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Atualizar com um número padrão
UPDATE config SET whatsapp_number = '5511999999999' WHERE id = 1;
