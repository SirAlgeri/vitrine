-- Migration: SMTP Config per Tenant
-- Data: 2026-02-20
-- Descrição: Adiciona configurações SMTP por tenant na tabela config

-- Adicionar colunas SMTP
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255);
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false;
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255);
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_pass VARCHAR(255);
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_from VARCHAR(255);
ALTER TABLE config ADD COLUMN IF NOT EXISTS smtp_from_name VARCHAR(100);
