-- Script para ver la estructura y datos de la base de datos
-- Ejecutar con: mysql -u root -p sistema_horarios < view_database.sql

USE sistema_horarios;

-- Mostrar todas las tablas
SELECT '📊 TABLAS CREADAS' as info;
SHOW TABLES;

-- Mostrar estructura de cada tabla
SELECT '👥 TABLA USERS' as info;
DESCRIBE users;

SELECT '👤 TABLA EMPLOYEES' as info;
DESCRIBE employees;

SELECT '🕐 TABLA SCHEDULES' as info;
DESCRIBE schedules;

SELECT '📝 TABLA SCHEDULE_REQUESTS' as info;
DESCRIBE schedule_requests;

-- Mostrar usuarios creados
SELECT '👥 USUARIOS REGISTRADOS' as info;
SELECT id, nombre, correo, rol, is_active, created_at FROM users;

-- Mostrar empleados
SELECT '👤 EMPLEADOS REGISTRADOS' as info;
SELECT 
  e.id, 
  e.posicion, 
  e.fecha_contratacion, 
  e.estado,
  u.nombre as nombre_usuario,
  u.correo as email_usuario
FROM employees e
JOIN users u ON e.id_usuario = u.id;

-- Mostrar horarios (si hay)
SELECT '🕐 HORARIOS CREADOS' as info;
SELECT 
  s.id,
  s.fecha,
  s.hora_inicio,
  s.hora_fin,
  u.nombre as nombre_empleado,
  e.posicion
FROM schedules s
JOIN employees e ON s.id_empleado = e.id
JOIN users u ON e.id_usuario = u.id;

-- Mostrar solicitudes (si hay)
SELECT '📝 SOLICITUDES DE HORARIO' as info;
SELECT 
  sr.id,
  sr.fecha_solicitada,
  sr.nueva_hora_inicio,
  sr.nueva_hora_fin,
  sr.estado,
  u.nombre as nombre_empleado
FROM schedule_requests sr
JOIN employees e ON sr.id_empleado = e.id
JOIN users u ON e.id_usuario = u.id;

-- Mostrar vistas creadas
SELECT '👁️ VISTAS DISPONIBLES' as info;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Consultar vistas
SELECT '📊 ESTADÍSTICAS DE EMPLEADOS' as info;
SELECT * FROM v_estadisticas_empleados;

SELECT '🕐 HORARIOS DE HOY' as info;
SELECT * FROM v_horarios_hoy;

SELECT '📝 SOLICITUDES PENDIENTES' as info;
SELECT * FROM v_solicitudes_pendientes;

-- Mostrar relaciones/foreign keys
SELECT '🔗 RELACIONES (FOREIGN KEYS)' as info;
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sistema_horarios'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Mostrar índices
SELECT '📇 ÍNDICES CREADOS' as info;
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'sistema_horarios'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
