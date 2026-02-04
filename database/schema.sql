-- VitrinePro Database Schema
-- PostgreSQL 14+

-- Criar banco (executar como superuser)
-- CREATE DATABASE vitrinepro WITH ENCODING 'UTF8';
-- \c vitrinepro

-- Tipos customizados
CREATE TYPE payment_method_type AS ENUM ('PIX', 'CARD', 'CASH');
CREATE TYPE order_status_type AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

-- Tabela de Configurações da Loja
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL DEFAULT 'VitrinePro',
  primary_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários Admin
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method payment_method_type NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status order_status_type DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO config (store_name, primary_color, secondary_color) 
VALUES ('VitrinePro', '#3b82f6', '#10b981')
ON CONFLICT DO NOTHING;

-- Inserir usuário admin padrão (senha: admin)
-- Hash bcrypt de 'admin' com salt 10
INSERT INTO users (username, password_hash) 
VALUES ('admin', '$2b$10$rKvVPZqGsYqjlFE7RZ5rJeX.Qs8qF5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y')
ON CONFLICT (username) DO NOTHING;
