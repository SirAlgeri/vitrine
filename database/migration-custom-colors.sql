-- Adicionar campos de cores personalizadas
ALTER TABLE config ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE config ADD COLUMN IF NOT EXISTS card_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE config ADD COLUMN IF NOT EXISTS surface_color VARCHAR(7) DEFAULT '#f9f9f9';
ALTER TABLE config ADD COLUMN IF NOT EXISTS text_primary_color VARCHAR(7) DEFAULT '#000000';
ALTER TABLE config ADD COLUMN IF NOT EXISTS text_secondary_color VARCHAR(7) DEFAULT '#666666';
ALTER TABLE config ADD COLUMN IF NOT EXISTS border_color VARCHAR(7) DEFAULT '#e5e7eb';
ALTER TABLE config ADD COLUMN IF NOT EXISTS button_primary_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE config ADD COLUMN IF NOT EXISTS button_primary_hover_color VARCHAR(7) DEFAULT '#2563eb';
ALTER TABLE config ADD COLUMN IF NOT EXISTS button_secondary_color VARCHAR(7) DEFAULT '#6b7280';
ALTER TABLE config ADD COLUMN IF NOT EXISTS button_secondary_hover_color VARCHAR(7) DEFAULT '#4b5563';
