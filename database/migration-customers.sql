-- Migration: Customer Authentication System

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  nome_completo VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  cep VARCHAR(9) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  aceita_marketing BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login_em TIMESTAMP,
  deletado_em TIMESTAMP
);

-- Tabela de Tokens de Recuperação de Senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar customer_id aos pedidos existentes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_customer ON password_reset_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON password_reset_tokens(token);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_updated_at 
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_customer_updated_at();
