-- Migration: Adicionar opção de retirada pessoal
-- Data: 2026-02-21

ALTER TABLE config ADD COLUMN IF NOT EXISTS enable_pickup BOOLEAN DEFAULT true;
ALTER TABLE config ADD COLUMN IF NOT EXISTS pickup_address TEXT;
