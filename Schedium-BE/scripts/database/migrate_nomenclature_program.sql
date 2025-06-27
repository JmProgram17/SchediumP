-- ===============================================
-- MIGRATION: Update nomenclature and program tables
-- Remove description and active from nomenclature
-- Add active field to program table
-- ===============================================

USE schedium;

-- First, add active field to program table with default TRUE
ALTER TABLE program ADD COLUMN active BOOLEAN DEFAULT TRUE NOT NULL;

-- Set all existing programs to active
UPDATE program SET active = TRUE;

-- Now remove the fields from nomenclature table
ALTER TABLE nomenclature DROP COLUMN description;
ALTER TABLE nomenclature DROP COLUMN active;

SELECT 'Nomenclature and program table migration completed successfully' AS status;