-- Script para crear la base de datos del Sistema de Gestión de Empleados y Horarios
-- MySQL 8.0+

-- Eliminar base de datos si existe (solo para desarrollo)
DROP DATABASE IF EXISTS `sistema_horarios`;

-- Crear base de datos
CREATE DATABASE `sistema_horarios`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE `sistema_horarios`;

-- Crear tabla de usuarios
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `contraseña` VARCHAR(255) NOT NULL,
  `rol` ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_correo` (`correo`),
  KEY `idx_users_rol` (`rol`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de empleados
CREATE TABLE `employees` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `posicion` ENUM('cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador') NOT NULL,
  `fecha_contratacion` DATE NOT NULL,
  `estado` BOOLEAN NOT NULL DEFAULT TRUE,
  `id_usuario` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employees_id_usuario` (`id_usuario`),
  KEY `idx_employees_posicion` (`posicion`),
  KEY `idx_employees_estado` (`estado`),
  KEY `idx_employees_fecha_contratacion` (`fecha_contratacion`),
  CONSTRAINT `fk_employees_id_usuario` 
    FOREIGN KEY (`id_usuario`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de horarios
CREATE TABLE `schedules` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_empleado` INT(11) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_id_empleado` (`id_empleado`),
  KEY `idx_schedules_fecha` (`fecha`),
  KEY `idx_schedules_empleado_fecha` (`id_empleado`, `fecha`),
  KEY `idx_schedules_fecha_hora_inicio` (`fecha`, `hora_inicio`),
  CONSTRAINT `fk_schedules_id_empleado` 
    FOREIGN KEY (`id_empleado`) 
    REFERENCES `employees` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de solicitudes de cambio de horario
CREATE TABLE `schedule_requests` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_empleado` INT(11) NOT NULL,
  `fecha_solicitada` DATE NOT NULL,
  `nueva_hora_inicio` TIME NOT NULL,
  `nueva_hora_fin` TIME NOT NULL,
  `estado` ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  `motivo` TEXT NULL,
  `id_revisor` INT(11) NULL,
  `fecha_revision` TIMESTAMP NULL,
  `comentarios_revision` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedule_requests_id_empleado` (`id_empleado`),
  KEY `idx_schedule_requests_estado` (`estado`),
  KEY `idx_schedule_requests_fecha_solicitada` (`fecha_solicitada`),
  KEY `idx_schedule_requests_empleado_estado` (`id_empleado`, `estado`),
  KEY `idx_schedule_requests_id_revisor` (`id_revisor`),
  CONSTRAINT `fk_schedule_requests_id_empleado` 
    FOREIGN KEY (`id_empleado`) 
    REFERENCES `employees` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_schedule_requests_id_revisor` 
    FOREIGN KEY (`id_revisor`) 
    REFERENCES `users` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
INSERT INTO `users` (`nombre`, `correo`, `contraseña`, `rol`, `is_active`) 
VALUES (
  'Administrador del Sistema',
  'admin@sistema.com',
  '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZO', -- admin123 (hash con bcrypt)
  'admin',
  TRUE
);

-- Crear índices adicionales para mejorar rendimiento
CREATE INDEX `idx_users_created_at` ON `users` (`created_at`);
CREATE INDEX `idx_employees_created_at` ON `employees` (`created_at`);
CREATE INDEX `idx_schedules_created_at` ON `schedules` (`created_at`);
CREATE INDEX `idx_schedule_requests_created_at` ON `schedule_requests` (`created_at`);

-- Crear vista para estadísticas de empleados
CREATE VIEW `v_estadisticas_empleados` AS
SELECT 
  e.posicion,
  COUNT(e.id) as total_empleados,
  COUNT(CASE WHEN e.estado = TRUE THEN 1 END) as empleados_activos,
  COUNT(CASE WHEN e.estado = FALSE THEN 1 END) as empleados_inactivos,
  AVG(DATEDIFF(CURRENT_DATE, e.fecha_contratacion)) as antiguedad_promedio_dias
FROM employees e
GROUP BY e.posicion;

-- Crear vista para horarios del día
CREATE VIEW `v_horarios_hoy` AS
SELECT 
  s.id,
  s.fecha,
  s.hora_inicio,
  s.hora_fin,
  e.nombre as nombre_empleado,
  e.posicion,
  u.correo as email_empleado
FROM schedules s
JOIN employees e ON s.id_empleado = e.id
JOIN users u ON e.id_usuario = u.id
WHERE s.fecha = CURRENT_DATE
ORDER BY s.hora_inicio;

-- Crear vista para solicitudes pendientes
CREATE VIEW `v_solicitudes_pendientes` AS
SELECT 
  sr.id,
  sr.fecha_solicitada,
  sr.nueva_hora_inicio,
  sr.nueva_hora_fin,
  sr.motivo,
  sr.created_at as fecha_solicitud,
  e.nombre as nombre_empleado,
  e.posicion,
  u.correo as email_empleado
FROM schedule_requests sr
JOIN employees e ON sr.id_empleado = e.id
JOIN users u ON e.id_usuario = u.id
WHERE sr.estado = 'pendiente'
ORDER BY sr.fecha_solicitada, sr.created_at;

-- Mostrar mensaje de éxito
SELECT 
  '✅ Base de datos sistema_horarios creada exitosamente' as mensaje,
  '📊 Tablas creadas: users, employees, schedules, schedule_requests' as tablas,
  '👤 Usuario admin: admin@sistema.com / admin123' as usuario_defecto;
