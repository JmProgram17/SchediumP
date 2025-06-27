-- Add unique constraint to prevent duplicate programs
-- This constraint ensures that no two programs can have exactly the same:
-- name + nomenclature_id + level_id + chain_id

-- First, let's check if there are any existing duplicates
SELECT 
    'Checking for duplicate programs...' AS status;

SELECT 
    name, 
    nomenclature_id, 
    level_id, 
    chain_id, 
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(program_id) as program_ids
FROM program 
WHERE name IS NOT NULL 
  AND nomenclature_id IS NOT NULL 
  AND level_id IS NOT NULL 
  AND chain_id IS NOT NULL
GROUP BY name, nomenclature_id, level_id, chain_id 
HAVING COUNT(*) > 1;

-- Check if constraint already exists
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'program'
  AND CONSTRAINT_NAME = 'uq_program_name_nomenclature_level_chain';

-- Add the unique constraint
-- Note: This will fail if there are existing duplicates
ALTER TABLE program 
ADD CONSTRAINT uq_program_name_nomenclature_level_chain 
UNIQUE (name, nomenclature_id, level_id, chain_id);

-- Verify the constraint was added
SELECT 
    'Constraint added successfully!' AS status;

SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    COLUMN_NAME,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'program'
  AND CONSTRAINT_NAME = 'uq_program_name_nomenclature_level_chain'
ORDER BY ORDINAL_POSITION;