-- ===============================================
-- SAMPLE DATA FOR SCHEDIUM DATABASE
-- Datos de ejemplo para desarrollo y pruebas
-- ===============================================

-- Verificar que solo se ejecute si no hay datos
SET @sample_check = (SELECT COUNT(*) FROM campus WHERE name LIKE '%Central%');

-- Solo proceder si no hay datos de ejemplo
SELECT CASE 
    WHEN @sample_check > 0 THEN 'Datos de ejemplo ya existen. Saliendo...'
    ELSE 'Insertando datos de ejemplo...'
END as status;

-- Campus (3 sedes)
INSERT IGNORE INTO campus (name, address, phone_number, email, created_at, updated_at) VALUES
('Campus Central', 'Av. Principal 123, Bogotá', '+57-1-234-5678', 'central@schedium.edu.co', NOW(), NOW()),
('Campus Norte', 'Calle 45 #12-34, Zona Norte', '+57-1-234-5679', 'norte@schedium.edu.co', NOW(), NOW()),
('Campus Sur', 'Carrera 30 #78-90, Zona Sur', '+57-1-234-5680', 'sur@schedium.edu.co', NOW(), NOW());

-- Niveles educativos
INSERT IGNORE INTO level (study_type, duration, created_at, updated_at) VALUES
('Técnico Laboral', 12, NOW(), NOW()),
('Tecnólogo', 24, NOW(), NOW()),
('Especialización Técnica', 6, NOW(), NOW()),
('Curso Complementario', 3, NOW(), NOW());

-- Cadenas de formación
INSERT IGNORE INTO chain (name, created_at, updated_at) VALUES
('Tecnologías de la Información y las Comunicaciones', NOW(), NOW()),
('Administración y Comercio', NOW(), NOW()),
('Salud', NOW(), NOW()),
('Logística y Transporte', NOW(), NOW()),
('Manufactura y Producción', NOW(), NOW());

-- Nomenclaturas (códigos de programas)
INSERT IGNORE INTO nomenclature (code, created_at, updated_at) VALUES
('228106', NOW(), NOW()), -- Sistemas
('228116', NOW(), NOW()), -- Redes
('621201', NOW(), NOW()), -- Admin Empresas
('331314', NOW(), NOW()), -- Aux Enfermería
('331315', NOW(), NOW()), -- Atención Prehospitalaria
('634301', NOW(), NOW()); -- Logística

-- Departamentos/Coordinaciones (3 coordinaciones)
INSERT IGNORE INTO department (name, phone_number, email, created_at, updated_at) VALUES
('Coordinación de Sistemas y Telecomunicaciones', '+57-1-300-1001', 'sistemas@schedium.edu.co', NOW(), NOW()),
('Coordinación de Administración y Comercio', '+57-1-300-1002', 'administracion@schedium.edu.co', NOW(), NOW()),
('Coordinación de Salud y Bienestar', '+57-1-300-1003', 'salud@schedium.edu.co', NOW(), NOW());

-- Programas (5 programas)
INSERT IGNORE INTO program (name, nomenclature_id, chain_id, department_id, level_id, active, created_at, updated_at) VALUES
('Técnico en Sistemas de Información', 1, 1, 1, 1, TRUE, NOW(), NOW()),
('Técnico en Redes de Computadores', 2, 1, 1, 1, TRUE, NOW(), NOW()),
('Tecnólogo en Administración de Empresas', 3, 2, 2, 2, TRUE, NOW(), NOW()),
('Técnico en Auxiliar de Enfermería', 4, 3, 3, 1, TRUE, NOW(), NOW()),
('Técnico en Atención Prehospitalaria', 5, 3, 3, 1, TRUE, NOW(), NOW());

-- Horarios
INSERT IGNORE INTO schedule (name, start_time, end_time, created_at, updated_at) VALUES
('Mañana', '06:00:00', '12:00:00', NOW(), NOW()),
('Tarde', '14:00:00', '20:00:00', NOW(), NOW()),
('Noche', '18:00:00', '22:00:00', NOW(), NOW()),
('Fin de Semana', '08:00:00', '16:00:00', NOW(), NOW());

-- Tipos de contrato
INSERT IGNORE INTO contract (contract_type, hour_limit, created_at, updated_at) VALUES
('Tiempo Completo', 40, NOW(), NOW()),
('Medio Tiempo', 20, NOW(), NOW()),
('Cátedra', 10, NOW(), NOW()),
('Ocasional', 8, NOW(), NOW());

-- Instructores (5 instructores)
INSERT IGNORE INTO instructor (first_name, last_name, phone_number, email, hour_count, contract_id, department_id, active, created_at, updated_at) VALUES
('Carlos Andrés', 'Rodríguez Silva', '+57-310-123-4567', 'carlos.rodriguez@schedium.edu.co', 0.00, 1, 1, TRUE, NOW(), NOW()),
('María Fernanda', 'González López', '+57-310-123-4568', 'maria.gonzalez@schedium.edu.co', 0.00, 1, 1, TRUE, NOW(), NOW()),
('Ana Patricia', 'López Martínez', '+57-310-123-4569', 'ana.lopez@schedium.edu.co', 0.00, 2, 2, TRUE, NOW(), NOW()),
('José Miguel', 'Martínez Torres', '+57-310-123-4570', 'jose.martinez@schedium.edu.co', 0.00, 1, 3, TRUE, NOW(), NOW()),
('Laura Cristina', 'Hernández Ruiz', '+57-310-123-4571', 'laura.hernandez@schedium.edu.co', 0.00, 3, 3, TRUE, NOW(), NOW());

-- Ambientes/Salones (5 ambientes)
INSERT IGNORE INTO classroom (room_number, campus_id, created_at, updated_at) VALUES
('A101-Lab Sistemas', 1, NOW(), NOW()),
('A102-Aula Teórica', 1, NOW(), NOW()),
('B201-Lab Redes', 2, NOW(), NOW()),
('C301-Aula Admin', 3, NOW(), NOW()),
('C302-Simulacro Salud', 3, NOW(), NOW());

-- Fichas/Grupos de estudiantes (5 fichas)
INSERT IGNORE INTO student_group (group_number, program_id, start_date, end_date, schedule_id, active, created_at, updated_at) VALUES
(2794001, 1, '2024-02-01', '2025-02-01', 1, TRUE, NOW(), NOW()),
(2794002, 2, '2024-02-01', '2025-02-01', 2, TRUE, NOW(), NOW()),
(2794003, 3, '2024-03-01', '2026-03-01', 1, TRUE, NOW(), NOW()),
(2794004, 4, '2024-01-15', '2025-01-15', 3, TRUE, NOW(), NOW()),
(2794005, 5, '2024-04-01', '2025-04-01', 2, TRUE, NOW(), NOW());

-- Roles adicionales (si no existen)
INSERT IGNORE INTO role (name, created_at, updated_at) VALUES
('Coordinador', NOW(), NOW()),
('Instructor', NOW(), NOW()),
('Secretario Académico', NOW(), NOW()),
('Director Académico', NOW(), NOW());

-- Usuarios coordinadores y personal académico
INSERT IGNORE INTO user (first_name, last_name, document_number, password, email, role_id, active, created_at, updated_at) VALUES
('Pedro Antonio', 'Ramírez Castillo', '87654321', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBmdtUlku8YUyq', 'pedro.ramirez@schedium.edu.co', 2, TRUE, NOW(), NOW()),
('Sandra Milena', 'Torres Vargas', '11223344', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBmdtUlku8YUyq', 'sandra.torres@schedium.edu.co', 2, TRUE, NOW(), NOW()),
('Luis Fernando', 'Vargas Jiménez', '44332211', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBmdtUlku8YUyq', 'luis.vargas@schedium.edu.co', 2, TRUE, NOW(), NOW()),
('Carmen Rosa', 'Jiménez Morales', '55667788', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBmdtUlku8YUyq', 'carmen.jimenez@schedium.edu.co', 4, TRUE, NOW(), NOW()),
('Diana Carolina', 'Mendoza Parra', '99887766', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBmdtUlku8YUyq', 'diana.mendoza@schedium.edu.co', 5, TRUE, NOW(), NOW());

-- Asignar coordinadores a departamentos
UPDATE department SET coordinator_id = (SELECT user_id FROM user WHERE email = 'pedro.ramirez@schedium.edu.co'), updated_at = NOW() WHERE name LIKE '%Sistemas%';
UPDATE department SET coordinator_id = (SELECT user_id FROM user WHERE email = 'sandra.torres@schedium.edu.co'), updated_at = NOW() WHERE name LIKE '%Administración%';
UPDATE department SET coordinator_id = (SELECT user_id FROM user WHERE email = 'luis.vargas@schedium.edu.co'), updated_at = NOW() WHERE name LIKE '%Salud%';

-- Trimestres/Quarters de ejemplo
INSERT IGNORE INTO quarter (start_date, end_date, quarter_number, academic_year, description, is_active, created_at, updated_at) VALUES
('2024-02-01', '2024-05-31', 1, 2024, 'Primer Trimestre 2024', TRUE, NOW(), NOW()),
('2024-06-01', '2024-09-30', 2, 2024, 'Segundo Trimestre 2024', TRUE, NOW(), NOW()),
('2024-10-01', '2024-12-31', 3, 2024, 'Tercer Trimestre 2024', FALSE, NOW(), NOW()),
('2025-02-01', '2025-05-31', 1, 2025, 'Primer Trimestre 2025', FALSE, NOW(), NOW());

-- Configuración académica básica
INSERT IGNORE INTO academic_schedule_config (
    day_start_time, 
    day_end_time, 
    min_class_duration_minutes, 
    max_class_duration_minutes,
    is_active,
    created_at, 
    updated_at
) VALUES
('06:00:00', '22:00:00', 60, 240, TRUE, NOW(), NOW());

-- Mensaje de confirmación
SELECT '✅ Datos de ejemplo insertados correctamente!' as resultado,
       (SELECT COUNT(*) FROM campus) as total_campus,
       (SELECT COUNT(*) FROM department) as total_departamentos,
       (SELECT COUNT(*) FROM program) as total_programas,
       (SELECT COUNT(*) FROM instructor) as total_instructores,
       (SELECT COUNT(*) FROM classroom) as total_ambientes,
       (SELECT COUNT(*) FROM student_group) as total_fichas,
       (SELECT COUNT(*) FROM user WHERE role_id > 1) as total_usuarios_academicos,
       (SELECT COUNT(*) FROM academic_schedule_config) as total_configuraciones;