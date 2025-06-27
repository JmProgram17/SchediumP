-- Add unique constraint to prevent duplicate programs
-- This constraint ensures that no two programs can have exactly the same:
-- name + nomenclature_id + level_id + chain_id

-- First, let's check if there are any existing duplicates
-- (This query will help identify if there are current duplicates that need to be resolved)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, nomenclature_id, level_id, chain_id, COUNT(*)
        FROM program 
        WHERE name IS NOT NULL 
          AND nomenclature_id IS NOT NULL 
          AND level_id IS NOT NULL 
          AND chain_id IS NOT NULL
        GROUP BY name, nomenclature_id, level_id, chain_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % groups of duplicate programs. You may need to resolve these before applying the constraint.', duplicate_count;
        
        -- Show the duplicates
        RAISE NOTICE 'Duplicate programs found:';
        FOR rec IN 
            SELECT name, nomenclature_id, level_id, chain_id, COUNT(*) as count
            FROM program 
            WHERE name IS NOT NULL 
              AND nomenclature_id IS NOT NULL 
              AND level_id IS NOT NULL 
              AND chain_id IS NOT NULL
            GROUP BY name, nomenclature_id, level_id, chain_id 
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Program: %, Nomenclature ID: %, Level ID: %, Chain ID: % (% duplicates)', 
                rec.name, rec.nomenclature_id, rec.level_id, rec.chain_id, rec.count;
        END LOOP;
    ELSE
        RAISE NOTICE 'No duplicate programs found. Safe to add constraint.';
    END IF;
END $$;

-- Add the unique constraint
-- Note: This will fail if there are existing duplicates
ALTER TABLE program 
ADD CONSTRAINT uq_program_name_nomenclature_level_chain 
UNIQUE (name, nomenclature_id, level_id, chain_id);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'program'::regclass 
  AND c.conname = 'uq_program_name_nomenclature_level_chain'
ORDER BY a.attnum;