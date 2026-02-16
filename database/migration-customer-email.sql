-- Adicionar coluna email na tabela customers se não existir
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
