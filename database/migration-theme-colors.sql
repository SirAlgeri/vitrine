-- Migration: Sistema de Cores Personalizadas
-- Adiciona campos de cores customizáveis na tabela config

ALTER TABLE config 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS card_color VARCHAR(7) DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS surface_color VARCHAR(7) DEFAULT '#334155',
ADD COLUMN IF NOT EXISTS text_primary_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS text_secondary_color VARCHAR(7) DEFAULT '#94a3b8',
ADD COLUMN IF NOT EXISTS border_color VARCHAR(7) DEFAULT '#475569',
ADD COLUMN IF NOT EXISTS button_primary_color VARCHAR(7) DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS button_primary_hover_color VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS button_secondary_color VARCHAR(7) DEFAULT '#64748b',
ADD COLUMN IF NOT EXISTS button_secondary_hover_color VARCHAR(7) DEFAULT '#475569';

-- Atualizar registro existente com valores padrão (se existir)
UPDATE config 
SET 
  background_color = COALESCE(background_color, '#0f172a'),
  card_color = COALESCE(card_color, '#1e293b'),
  surface_color = COALESCE(surface_color, '#334155'),
  text_primary_color = COALESCE(text_primary_color, '#ffffff'),
  text_secondary_color = COALESCE(text_secondary_color, '#94a3b8'),
  border_color = COALESCE(border_color, '#475569'),
  button_primary_color = COALESCE(button_primary_color, '#3b82f6'),
  button_primary_hover_color = COALESCE(button_primary_hover_color, '#2563eb'),
  button_secondary_color = COALESCE(button_secondary_color, '#64748b'),
  button_secondary_hover_color = COALESCE(button_secondary_hover_color, '#475569')
WHERE id = 1;
