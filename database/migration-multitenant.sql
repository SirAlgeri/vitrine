-- Migration: Multi-Tenant Support
-- Data: 2026-02-19
-- Descrição: Adiciona suporte para múltiplos tenants (lojas) no sistema

-- 1. Criar tabela de tenants
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(50) PRIMARY KEY,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- 2. Adicionar tenant_id em todas as tabelas
ALTER TABLE config ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE field_definitions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE product_fields ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);

-- 3. Criar índices para tenant_id
CREATE INDEX IF NOT EXISTS idx_config_tenant ON config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_tenant ON product_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_tenant ON order_status_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_tenant ON customer_addresses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_field_definitions_tenant ON field_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_fields_tenant ON product_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_tenant ON email_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_tenant ON password_reset_tokens(tenant_id);

-- 4. Criar tenant padrão (para dados existentes)
INSERT INTO tenants (id, subdomain, store_name, active)
VALUES ('default', 'www', 'Vitrine Pro', true)
ON CONFLICT (subdomain) DO NOTHING;

-- 5. Atualizar dados existentes com tenant padrão
UPDATE config SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE product_images SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE order_items SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE order_status_history SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE customers SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE customer_addresses SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE field_definitions SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE product_fields SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE email_verifications SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE password_reset_tokens SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_updated_at 
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_tenant_updated_at();

-- 7. Tenant de exemplo (MCP Tennis)
INSERT INTO tenants (id, subdomain, store_name, active)
VALUES ('tenant-mcptennis', 'mcptennis', 'MCP Tennis Store', true)
ON CONFLICT (subdomain) DO NOTHING;

-- Config do tenant exemplo
INSERT INTO config (tenant_id, store_name, primary_color, secondary_color)
SELECT 'tenant-mcptennis', 'MCP Tennis Store', '#ff6b00', '#00a86b'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE tenant_id = 'tenant-mcptennis');

-- Field definitions do tenant exemplo
INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order, tenant_id)
SELECT 
  'field-name-mcptennis', 'Nome', 'text', true, false, 1, 'tenant-mcptennis'
WHERE NOT EXISTS (SELECT 1 FROM field_definitions WHERE id = 'field-name-mcptennis')
UNION ALL
SELECT 
  'field-price-mcptennis', 'Preço', 'currency', true, false, 2, 'tenant-mcptennis'
WHERE NOT EXISTS (SELECT 1 FROM field_definitions WHERE id = 'field-price-mcptennis')
UNION ALL
SELECT 
  'field-description-mcptennis', 'Descrição', 'text', true, false, 3, 'tenant-mcptennis'
WHERE NOT EXISTS (SELECT 1 FROM field_definitions WHERE id = 'field-description-mcptennis')
UNION ALL
SELECT 
  'field-image-mcptennis', 'Imagem', 'text', true, false, 4, 'tenant-mcptennis'
WHERE NOT EXISTS (SELECT 1 FROM field_definitions WHERE id = 'field-image-mcptennis');
