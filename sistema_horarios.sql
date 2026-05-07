+++**-- =====================================================
-- Sistema de Gestión de Horarios - Base de Datos MySQL
-- =====================================================
-- Script de creación de base de datos y tablas
-- Compatible con MySQL 8.0+

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS sistema_horarios 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE sistema_horarios;

-- =====================================================
-- Tabla: users
-- =====================================================
-- Almacena información de usuarios del sistema
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado', 'solicitante') NOT NULL DEFAULT 'solicitante',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_correo (correo),
    INDEX idx_rol (rol),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: employees
-- =====================================================
-- Almacena información específica de empleados
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posicion ENUM('cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador') NOT NULL,
    fecha_contratacion DATE NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    id_usuario INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea
    FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_posicion (posicion),
    INDEX idx_estado (estado),
    INDEX idx_fecha_contratacion (fecha_contratacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: schedules
-- =====================================================
-- Almacena los horarios asignados a los empleados
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea
    FOREIGN KEY (id_empleado) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_id_empleado (id_empleado),
    INDEX idx_fecha (fecha),
    INDEX idx_id_empleado_fecha (id_empleado, fecha),
    INDEX idx_fecha_hora_inicio (fecha, hora_inicio),
    
    -- Constraint para validar que hora_fin sea posterior a hora_inicio
    CONSTRAINT chk_horas_validas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: employee_requests
-- =====================================================
-- Almacena solicitudes para convertirse en empleado
CREATE TABLE employee_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    posicion_deseada VARCHAR(100) NOT NULL,
    mensaje TEXT,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL,
    revisado_por INT NULL,
    comentarios_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (revisado_por) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_estado (estado),
    INDEX idx_fecha_solicitud (fecha_solicitud),
    INDEX idx_revisado_por (revisado_por)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: schedule_requests
-- =====================================================
-- Almacena solicitudes de cambios de horario
CREATE TABLE schedule_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    fecha_solicitada DATE NOT NULL,
    nueva_hora_inicio TIME NOT NULL,
    nueva_hora_fin TIME NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    motivo TEXT,
    id_revisor INT NULL,
    fecha_revision TIMESTAMP NULL,
    comentarios_revision TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (id_empleado) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_revisor) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_id_empleado (id_empleado),
    INDEX idx_estado (estado),
    INDEX idx_fecha_solicitada (fecha_solicitada),
    INDEX idx_id_empleado_estado (id_empleado, estado),
    INDEX idx_id_revisor (id_revisor),
    
    -- Constraints
    CONSTRAINT chk_nuevas_horas_validas CHECK (nueva_hora_fin > nueva_hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: notifications
-- =====================================================
-- Almacena notificaciones del sistema
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'success', 'warning', 'error', 'employment_request', 'employment_approved', 'employment_rejected') NOT NULL DEFAULT 'info',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    id_referencia INT NULL COMMENT 'ID del objeto relacionado (ej: id_solicitud_empleo)',
    tipo_referencia VARCHAR(50) NULL COMMENT 'Tipo del objeto relacionado (ej: employee_request)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea
    FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_leida (leida),
    INDEX idx_tipo (tipo),
    INDEX idx_created_at (created_at),
    INDEX idx_id_usuario_leida (id_usuario, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insertar usuario administrador por defecto
-- =====================================================
-- Contraseña: admin123 (encriptada con bcrypt)
INSERT INTO users (nombre, correo, contraseña, rol, is_active) VALUES 
('Administrador del Sistema', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE)
ON DUPLICATE KEY UPDATE correo = correo;

-- =====================================================
-- Vistas útiles
-- =====================================================

-- Vista: empleados_con_usuario
-- Combina información de employees y users
CREATE VIEW empleados_con_usuario AS
SELECT 
    e.id,
    e.posicion,
    e.fecha_contratacion,
    e.estado,
    e.created_at as fecha_creacion_empleado,
    u.id as id_usuario,
    u.nombre,
    u.correo,
    u.rol,
    u.is_active,
    u.created_at as fecha_creacion_usuario
FROM employees e
INNER JOIN users u ON e.id_usuario = u.id;

-- Vista: horarios_con_empleados
-- Combina información de schedules con datos de empleados
CREATE VIEW horarios_con_empleados AS
SELECT 
    s.id,
    s.fecha,
    s.hora_inicio,
    s.hora_fin,
    s.created_at as fecha_creacion_horario,
    e.id as id_empleado,
    u.nombre as nombre_empleado,
    u.correo as correo_empleado,
    e.posicion
FROM schedules s
INNER JOIN employees e ON s.id_empleado = e.id
INNER JOIN users u ON e.id_usuario = u.id;

-- Vista: solicitudes_horario_detalle
-- Detalle completo de solicitudes de cambio de horario
CREATE VIEW solicitudes_horario_detalle AS
SELECT 
    sr.id,
    sr.fecha_solicitada,
    sr.nueva_hora_inicio,
    sr.nueva_hora_fin,
    sr.estado,
    sr.motivo,
    sr.fecha_revision,
    sr.comentarios_revision,
    sr.created_at as fecha_solicitud,
    e.id as id_empleado,
    u.nombre as nombre_empleado,
    u.correo as correo_empleado,
    e.posicion as posicion_empleado,
    ur.nombre as nombre_revisor,
    ur.correo as correo_revisor
FROM schedule_requests sr
INNER JOIN employees e ON sr.id_empleado = e.id
INNER JOIN users u ON e.id_usuario = u.id
LEFT JOIN users ur ON sr.id_revisor = ur.id;

-- =====================================================
-- Procedimientos almacenados útiles
-- =====================================================

DELIMITER //

-- Procedimiento: Obtener horarios de un empleado en un rango de fechas
CREATE PROCEDURE sp_obtener_horarios_empleado(
    IN p_id_empleado INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT 
        id,
        fecha,
        hora_inicio,
        hora_fin,
        TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin) as duracion_minutos
    FROM schedules
    WHERE id_empleado = p_id_empleado
    AND fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    ORDER BY fecha, hora_inicio;
END //

-- Procedimiento: Verificar disponibilidad de empleado
CREATE PROCEDURE sp_verificar_disponibilidad(
    IN p_id_empleado INT,
    IN p_fecha DATE,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME
)
BEGIN
    SELECT COUNT(*) as conflictos
    FROM schedules
    WHERE id_empleado = p_id_empleado
    AND fecha = p_fecha
    AND (
        (hora_inicio < p_hora_fin AND hora_fin > p_hora_inicio)
    );
END //

-- Procedimiento: Obtener estadísticas de solicitudes
CREATE PROCEDURE sp_estadisticas_solicitudes()
BEGIN
    SELECT 
        'pendientes' as tipo,
        COUNT(*) as cantidad
    FROM schedule_requests
    WHERE estado = 'pendiente'
    
    UNION ALL
    
    SELECT 
        'aprobadas' as tipo,
        COUNT(*) as cantidad
    FROM schedule_requests
    WHERE estado = 'aprobada'
    
    UNION ALL
    
    SELECT 
        'rechazadas' as tipo,
        COUNT(*) as cantidad
    FROM schedule_requests
    WHERE estado = 'rechazada';
END //

DELIMITER ;

-- =====================================================
-- Triggers para auditoría
-- =====================================================

DELIMITER //

-- Trigger: Actualizar timestamp en users
CREATE TRIGGER tr_users_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp en employees
CREATE TRIGGER tr_employees_before_update
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp en schedules
CREATE TRIGGER tr_schedules_before_update
BEFORE UPDATE ON schedules
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp en schedule_requests
CREATE TRIGGER tr_schedule_requests_before_update
BEFORE UPDATE ON schedule_requests
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp en employee_requests
CREATE TRIGGER tr_employee_requests_before_update
BEFORE UPDATE ON employee_requests
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp en notifications
CREATE TRIGGER tr_notifications_before_update
BEFORE UPDATE ON notifications
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- Comentarios finales
-- =====================================================
-- Base de datos creada exitosamente
-- 
-- Usuario administrador por defecto:
-- Email: admin@example.com
-- Contraseña: admin123
-- 
-- Para restaurar la base de datos:
-- mysql -u root -p sistema_horarios < sistema_horarios.sql
-- 
-- Para hacer backup:
-- mysqldump -u root -p sistema_horarios > backup_sistema_horarios.sql
