-- Torna email opcional para clientes criados manualmente pelo admin
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
