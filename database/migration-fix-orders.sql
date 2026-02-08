-- Remover constraint de foreign key para permitir customer_id NULL
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Remover constraint de foreign key de product_id em order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
