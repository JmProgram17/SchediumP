-- =====================================================
-- Script: Make contract_id and department_id required for instructors
-- File: 05-make-instructor-fields-required.sql
-- Description: Changes contract_id and department_id from nullable to NOT NULL
-- =====================================================

-- Step 1: First, let's check current data state
SELECT 
    COUNT(*) as total_instructors,
    COUNT(contract_id) as with_contract,
    COUNT(department_id) as with_department,
    COUNT(*) - COUNT(contract_id) as null_contracts,
    COUNT(*) - COUNT(department_id) as null_departments
FROM instructor;

-- Step 2: Update any NULL contract_id to a default contract (if needed)
-- Note: You may need to create a default contract first or choose an existing one
-- First, let's see available contracts:
SELECT * FROM contracts LIMIT 5;

-- Update NULL contract_ids to the first available contract (adjust as needed)
UPDATE instructor 
SET contract_id = (SELECT MIN(contract_id) FROM contracts WHERE contract_id IS NOT NULL)
WHERE contract_id IS NULL;

-- Step 3: Update any NULL department_id to a default department (if needed)
-- First, let's see available departments:
SELECT * FROM departments LIMIT 5;

-- Update NULL department_ids to the first available department (adjust as needed)  
UPDATE instructor 
SET department_id = (SELECT MIN(department_id) FROM departments WHERE department_id IS NOT NULL)
WHERE department_id IS NULL;

-- Step 4: Verify no NULL values remain
SELECT 
    COUNT(*) as total_instructors,
    COUNT(contract_id) as with_contract,
    COUNT(department_id) as with_department
FROM instructor;

-- Step 5: Drop existing foreign key constraints (to modify them)
-- First, find the constraint names (they may be auto-generated)
SELECT 
    CONSTRAINT_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'instructor' 
AND TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Drop foreign key constraints (replace with actual constraint names from above query)
-- ALTER TABLE instructor DROP FOREIGN KEY <constraint_name_for_contract_id>;
-- ALTER TABLE instructor DROP FOREIGN KEY <constraint_name_for_department_id>;

-- Step 6: Modify columns to NOT NULL
ALTER TABLE instructor 
MODIFY COLUMN contract_id INT NOT NULL;

ALTER TABLE instructor 
MODIFY COLUMN department_id INT NOT NULL;

-- Step 7: Re-add foreign key constraints without SET NULL (now required fields)
ALTER TABLE instructor 
ADD CONSTRAINT fk_instructor_contract 
FOREIGN KEY (contract_id) REFERENCES contract(contract_id) ON DELETE RESTRICT;

ALTER TABLE instructor 
ADD CONSTRAINT fk_instructor_department 
FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE RESTRICT;

-- Step 6: Verify the changes
DESCRIBE instructor;

-- Step 7: Show updated instructor data
SELECT 
    instructor_id,
    first_name,
    last_name,
    contract_id,
    department_id,
    active
FROM instructors 
LIMIT 10;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- To rollback these changes (make fields nullable again):
-- 
-- ALTER TABLE instructors 
-- MODIFY COLUMN contract_id INT NULL;
-- 
-- ALTER TABLE instructors 
-- MODIFY COLUMN department_id INT NULL;
-- =====================================================