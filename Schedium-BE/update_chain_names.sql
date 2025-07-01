-- Update chain names to remove redundant "cadena" word
-- "cadena abierta" -> "abierta"
-- "cadena cerrada" -> "formación"

UPDATE chain 
SET name = 'abierta' 
WHERE name = 'cadena abierta';

UPDATE chain 
SET name = 'formación' 
WHERE name = 'cadena cerrada';

-- Show results
SELECT chain_id, name FROM chain;