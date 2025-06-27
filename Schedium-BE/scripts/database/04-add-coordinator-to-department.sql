-- Migración: Agregar coordinador obligatorio a departamentos
-- Archivo: 04-add-coordinator-to-department.sql

-- Paso 1: Agregar columna coordinator_id (inicialmente NULL)
ALTER TABLE department 
ADD COLUMN coordinator_id INT NULL 
COMMENT 'ID del usuario coordinador del departamento';

-- Paso 2: Crear índice para performance
CREATE INDEX idx_department_coordinator ON department(coordinator_id);

-- Paso 3: Agregar Foreign Key constraint
ALTER TABLE department 
ADD CONSTRAINT fk_department_coordinator 
    FOREIGN KEY (coordinator_id) REFERENCES user(user_id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

-- Paso 4: Datos de ejemplo - asignar coordinadores existentes
-- (Solo si hay datos de prueba - ajustar según usuarios reales)
UPDATE department SET coordinator_id = (
    SELECT user_id FROM user 
    WHERE role_id = (SELECT role_id FROM role WHERE name = 'Coordinator') 
    LIMIT 1
) WHERE coordinator_id IS NULL;

-- Paso 5: Hacer el campo obligatorio
-- NOTA: Ejecutar este paso solo después de asignar coordinadores a todos los departamentos
-- ALTER TABLE department 
-- MODIFY COLUMN coordinator_id INT NOT NULL 
-- COMMENT 'ID del usuario coordinador del departamento (obligatorio)';

-- Verificación
SELECT 
    d.department_id,
    d.name AS department_name,
    d.coordinator_id,
    CONCAT(u.first_name, ' ', u.last_name) AS coordinator_name,
    r.name AS coordinator_role
FROM department d
LEFT JOIN user u ON d.coordinator_id = u.user_id
LEFT JOIN role r ON u.role_id = r.role_id;