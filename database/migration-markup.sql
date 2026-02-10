-- Adicionar campo de margem percentual na configuração
ALTER TABLE config ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Adicionar constraint para garantir que a margem seja entre 0 e 100
ALTER TABLE config ADD CONSTRAINT markup_percentage_range CHECK (markup_percentage >= 0 AND markup_percentage <= 100);
