-- Adicionar coluna de imagem nos itens do pedido
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_image TEXT;
