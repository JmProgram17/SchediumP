-- ===============================================
-- MIGRATION: Update chain table to use new values
-- ===============================================

USE schedium;

-- First, update existing chains to new values
-- This assumes you have 3 existing chains that need to be consolidated

-- Update all programs to use only two chains
-- Programs with chain_id 1 stay as 1 (Cadena Abierta)
-- Programs with chain_id 2 stay as 2 (Cadena Cerrada)  
-- Programs with chain_id 3 or higher will be set to 1 (Cadena Abierta)
UPDATE program 
SET chain_id = 1 
WHERE chain_id > 2;

-- Delete old chain records
DELETE FROM chain WHERE chain_id > 2;

-- Update the chain names
UPDATE chain SET name = 'Cadena Abierta' WHERE chain_id = 1;
UPDATE chain SET name = 'Cadena Cerrada' WHERE chain_id = 2;

-- Reset auto increment to 3 for future chains
ALTER TABLE chain AUTO_INCREMENT = 3;

SELECT 'Chain migration completed successfully' AS status;