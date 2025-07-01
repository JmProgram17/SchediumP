-- Fix quarter data to include missing fields
UPDATE quarter SET 
    quarter_number = CASE 
        WHEN name LIKE 'Q1%' THEN 1
        WHEN name LIKE 'Q2%' THEN 2  
        WHEN name LIKE 'Q3%' THEN 3
        WHEN name LIKE 'Q4%' THEN 4
        ELSE null
    END,
    academic_year = CASE 
        WHEN name LIKE '%2025%' THEN 2025
        WHEN name LIKE '%2024%' THEN 2024
        WHEN name LIKE '%2026%' THEN 2026
        ELSE null
    END,
    is_active = CASE 
        WHEN name = 'Q2-2025' THEN 1
        ELSE 0
    END
WHERE quarter_number IS NULL OR academic_year IS NULL OR (name = 'Q2-2025' AND is_active = 0);

-- Set enrollment deadlines to be one month before start date
UPDATE quarter SET 
    enrollment_deadline = DATE_SUB(start_date, INTERVAL 1 MONTH)
WHERE enrollment_deadline IS NULL;

-- Add descriptions
UPDATE quarter SET 
    description = CONCAT('Trimestre académico ', quarter_number, ' del año ', academic_year)
WHERE description IS NULL;

-- Verify the changes
SELECT quarter_id, name, quarter_number, academic_year, is_active, enrollment_deadline, description, start_date, end_date 
FROM quarter 
ORDER BY quarter_id;