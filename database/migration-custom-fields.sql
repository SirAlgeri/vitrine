-- Migration: Custom Fields System

-- Tipo de campo
CREATE TYPE field_type AS ENUM ('text', 'number', 'currency');

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Campos Customizados
CREATE TABLE IF NOT EXISTS custom_fields (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type field_type NOT NULL,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar categoria ao produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL;

-- Tabela de Valores dos Campos
CREATE TABLE IF NOT EXISTS product_field_values (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_id VARCHAR(36) NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  UNIQUE(product_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_category ON custom_fields(category_id);
CREATE INDEX IF NOT EXISTS idx_product_field_values_product ON product_field_values(product_id);
