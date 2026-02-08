-- Migration: Add select field type with options

-- Update field_type enum to include 'select'
ALTER TYPE field_type ADD VALUE IF NOT EXISTS 'select';

-- Add options column to store select options as JSON array
ALTER TABLE field_definitions ADD COLUMN IF NOT EXISTS options TEXT;
