-- Migration: Múltiplas fotos por produto
-- Adiciona tabela para armazenar múltiplas imagens

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Migrar imagens existentes da coluna 'image' para a nova tabela
INSERT INTO product_images (product_id, image, image_order)
SELECT id, image, 0
FROM products
WHERE image IS NOT NULL AND image != '';

-- A coluna 'image' será mantida para compatibilidade (primeira imagem)
