-- Migration: Sistema de Estoque
-- Adiciona controle de quantidade em estoque

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 1;

-- Atualizar produtos existentes com estoque padrão
UPDATE products 
SET stock_quantity = 1 
WHERE stock_quantity IS NULL;
