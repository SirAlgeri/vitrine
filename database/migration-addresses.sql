-- Migration: Multiple Addresses System

-- Remover campos de endereço da tabela customers
ALTER TABLE customers DROP COLUMN IF EXISTS cep;
ALTER TABLE customers DROP COLUMN IF EXISTS rua;
ALTER TABLE customers DROP COLUMN IF EXISTS numero;
ALTER TABLE customers DROP COLUMN IF EXISTS complemento;
ALTER TABLE customers DROP COLUMN IF EXISTS bairro;
ALTER TABLE customers DROP COLUMN IF EXISTS cidade;
ALTER TABLE customers DROP COLUMN IF EXISTS estado;

-- Tabela de Endereços
CREATE TABLE IF NOT EXISTS customer_addresses (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  nome_endereco VARCHAR(100) NOT NULL,
  cep VARCHAR(9) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
