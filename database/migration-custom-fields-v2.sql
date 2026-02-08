-- Migration: Custom Fields System (Refactored)

-- Remover tabelas antigas se existirem
DROP TABLE IF EXISTS product_field_values CASCADE;
DROP TABLE IF EXISTS custom_fields CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TYPE IF EXISTS field_type CASCADE;

-- Tipo de campo
CREATE TYPE field_type AS ENUM ('text', 'number', 'currency');

-- Tabela de Definições de Campos (globais)
CREATE TABLE IF NOT EXISTS field_definitions (
  id VARCHAR(36) PRIMARY KEY,
  field_name VARCHAR(100) NOT NULL UNIQUE,
  field_type field_type NOT NULL,
  is_default BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT true,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Valores dos Campos por Produto
CREATE TABLE IF NOT EXISTS product_fields (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_id VARCHAR(36) NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  UNIQUE(product_id, field_id)
);

-- Remover coluna category_id se existir
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- Inserir campos padrões
INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order) VALUES
  ('field-name', 'Nome', 'text', true, false, 1),
  ('field-price', 'Preço', 'currency', true, false, 2),
  ('field-description', 'Descrição', 'text', true, false, 3),
  ('field-image', 'Imagem', 'text', true, false, 4)
ON CONFLICT (field_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_product_fields_product ON product_fields(product_id);
CREATE INDEX IF NOT EXISTS idx_product_fields_field ON product_fields(field_id);
