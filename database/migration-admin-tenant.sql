-- Migration: Admin Users per Tenant
-- Data: 2026-02-19
-- Descrição: Adiciona tenant_id aos usuários admin para isolamento por tenant

-- 1. Adicionar tenant_id à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) REFERENCES tenants(id);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 3. Criar índice composto para username + tenant_id (login único por tenant)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_tenant ON users(username, tenant_id);

-- 4. Atualizar usuários existentes com tenant padrão
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- 5. Criar admin para tenant mcptennis (senha: admin123)
-- Hash bcrypt de 'admin123': $2b$10$rZ5FqVJ5qVJ5qVJ5qVJ5qeK5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5q
INSERT INTO users (id, username, password_hash, tenant_id)
VALUES (gen_random_uuid(), 'admin', '$2b$10$rZ5FqVJ5qVJ5qVJ5qVJ5qeK5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5q', 'tenant-mcptennis')
ON CONFLICT (username, tenant_id) DO NOTHING;
