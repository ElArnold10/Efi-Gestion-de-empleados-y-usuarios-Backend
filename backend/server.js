require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.production' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

// Forzar NODE_ENV a production para asegurar configuración correcta
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log('🔧 NODE_ENV forzado a:', process.env.NODE_ENV);

// Importar middlewares
const { 
  corsOptions, 
  generalLimiter, 
  authLimiter, 
  helmetConfig, 
  sanitizeInput, 
  requestLogger, 
  errorHandler,
  checkDatabaseConnection 
} = require('./middleware/security');

// Importar rutas
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const scheduleRoutes = require('./routes/schedules');
const scheduleRequestRoutes = require('./routes/scheduleRequests');
const notificationRoutes = require('./routes/notifications');
const employeeRequestRoutes = require('./routes/employeeRequests');

// Crear aplicación Express
const app = express();

// Middlewares de seguridad
app.use(helmetConfig);
app.use(cors(corsOptions));
if (process.env.NODE_ENV === 'production') {
  app.use(generalLimiter);
}
app.use(sanitizeInput);
app.use(requestLogger);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Verificar conexión a base de datos
app.use(checkDatabaseConnection);

// Rutas de autenticación (sin rate limiting en desarrollo)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth', authLimiter);
}
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);
app.post('/api/auth/logout', authRoutes.logout);
app.get('/api/auth/profile', authRoutes.getProfile);
app.put('/api/auth/profile', authRoutes.updateProfile);
app.put('/api/auth/change-password', authRoutes.changePassword);
app.post('/api/auth/refresh', authRoutes.refreshToken);
app.post('/api/auth/forgot-password', authRoutes.forgotPassword);
app.post('/api/auth/reset-password', authRoutes.resetPassword);
app.get('/api/auth/approve-reset/:token', authRoutes.approvePasswordReset);
app.get('/api/auth/reject-reset/:token', authRoutes.rejectPasswordReset);


// Rutas de empleados (protegidas)
app.use('/api/employees', require('./middleware/auth').authenticateToken);
app.get('/api/employees', require('./middleware/auth').requireAdmin, employeeRoutes.getEmployees);
app.post('/api/employees', require('./middleware/auth').requireAdmin, employeeRoutes.createEmployee);
app.put('/api/employees/:id', require('./middleware/auth').requireAdmin, employeeRoutes.updateEmployee);
app.delete('/api/employees/:id', require('./middleware/auth').requireAdmin, employeeRoutes.deleteEmployee);

// Rutas de horarios (protegidas)
app.get('/api/schedules', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, scheduleRoutes.getSchedules);
app.post('/api/schedules', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, scheduleRoutes.createSchedule);
app.put('/api/schedules/:id', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, scheduleRoutes.updateSchedule);
app.delete('/api/schedules/:id', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, scheduleRoutes.deleteSchedule);

// Rutas de horarios para empleados
app.get('/api/my-schedules', require('./middleware/auth').authenticateToken, scheduleRoutes.getMySchedules);

// Rutas de solicitudes de cambio de horario (protegidas)
app.use('/api/schedule-requests', require('./middleware/auth').authenticateToken);
app.get('/api/schedule-requests', scheduleRequestRoutes.getScheduleRequests);
app.post('/api/schedule-requests', scheduleRequestRoutes.createScheduleRequest);
app.put('/api/schedule-requests/:id', require('./middleware/auth').requireAdmin, scheduleRequestRoutes.approveOrRejectScheduleRequest);

// Rutas de notificaciones (protegidas)
app.use('/api/notifications', require('./middleware/auth').authenticateToken);
app.get('/api/notifications', notificationRoutes.getNotifications);
app.get('/api/notifications/admin', require('./middleware/auth').requireAdmin, notificationRoutes.getAdminNotifications);
app.put('/api/notifications/:id/read', notificationRoutes.markAsRead);
app.put('/api/notifications/read-all', notificationRoutes.markAllAsRead);
app.delete('/api/notifications/:id', notificationRoutes.deleteNotification);

// Rutas de solicitudes de empleo (protegidas)
app.use('/api/employee-requests', require('./middleware/auth').authenticateToken);
app.get('/api/employee-requests', require('./middleware/auth').requireAdmin, employeeRequestRoutes.getEmployeeRequests);
app.get('/api/employee-requests/my', employeeRequestRoutes.getMyEmployeeRequests);
app.get('/api/employee-requests/:id', require('./middleware/auth').requireAdmin, employeeRequestRoutes.getEmployeeRequestById);
app.put('/api/employee-requests/:id/approve', require('./middleware/auth').requireAdmin, employeeRequestRoutes.approveEmployeeRequest);
app.put('/api/employee-requests/:id/reject', require('./middleware/auth').requireAdmin, employeeRequestRoutes.rejectEmployeeRequest);


// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API del Sistema de Gestión de Empleados y Horarios',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Registrar usuario (público - crea solicitante)',
        'POST /api/auth/login': 'Iniciar sesión',
        'POST /api/auth/logout': 'Cerrar sesión',
        'GET /api/auth/profile': 'Obtener perfil',
        'PUT /api/auth/profile': 'Actualizar perfil',
        'PUT /api/auth/change-password': 'Cambiar contraseña',
        'POST /api/auth/refresh': 'Refrescar token',
        'POST /api/auth/forgot-password': 'Solicitar recuperación de contraseña (envía email a admin)',
        'POST /api/auth/reset-password': 'Restablecer contraseña con token'
      },
      employees: {
        'GET /api/employees': 'Listar empleados (admin)',
        'POST /api/employees': 'Crear empleado (admin)',
        'PUT /api/employees/:id': 'Actualizar empleado (admin)',
        'DELETE /api/employees/:id': 'Eliminar empleado (admin)'
      },
      schedules: {
        'GET /api/schedules': 'Listar horarios (admin)',
        'POST /api/schedules': 'Crear horario (admin)',
        'PUT /api/schedules/:id': 'Actualizar horario (admin)',
        'DELETE /api/schedules/:id': 'Eliminar horario (admin)',
        'GET /api/my-schedules': 'Ver mis horarios asignados (empleado)'
      },
      scheduleRequests: {
        'GET /api/schedule-requests': 'Listar solicitudes de cambio (admin)',
        'POST /api/schedule-requests': 'Crear solicitud de cambio (empleado)',
        'PUT /api/schedule-requests/:id': 'Aprobar/rechazar solicitud (admin)'
      },
      notifications: {
        'GET /api/notifications': 'Listar notificaciones del usuario',
        'GET /api/notifications/admin': 'Listar notificaciones de administrador (solicitudes empleo)',
        'PUT /api/notifications/:id/read': 'Marcar notificación como leída',
        'PUT /api/notifications/read-all': 'Marcar todas como leídas',
        'DELETE /api/notifications/:id': 'Eliminar notificación'
      },
      employeeRequests: {
        'GET /api/employee-requests': 'Listar solicitudes de empleo (admin)',
        'GET /api/employee-requests/my': 'Listar mis solicitudes de empleo',
        'GET /api/employee-requests/:id': 'Ver solicitud de empleo (admin)',
        'PUT /api/employee-requests/:id/approve': 'Aprobar solicitud de empleo (admin)',
        'PUT /api/employee-requests/:id/reject': 'Rechazar solicitud de empleo (admin)'
      }
    }
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Mostrar configuración de Sequelize antes de conectar
    console.log('🔍 Configuración actual de Sequelize:');
    console.log('  Dialect:', sequelize.config.dialect);
    console.log('  Host:', sequelize.config.host);
    console.log('  Port:', sequelize.config.port);
    console.log('  Database:', sequelize.config.database);
    console.log('  Username:', sequelize.config.username);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    
    // Esperar a que la base de datos esté disponible
    const { waitForDatabase } = require('./wait-for-db');
    await waitForDatabase(5, 5000);
    
    console.log('✅ Conexión a MySQL establecida correctamente.');
    
    // Intentar inicializar base de datos desde archivo SQL
    const { initDatabase } = require('./scripts/init-database');
    const sqlImported = await initDatabase();
    
    if (!sqlImported) {
      console.log('⚠️ No se pudo importar desde SQL, continuando con sincronización normal...');
    }

    // Sincronizar modelos (crear tablas si no existen)
    console.log('🔄 Sincronizando base de datos...');
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Base de datos sincronizada correctamente.');

    // Crear usuario admin por defecto si no existe
    const { User } = require('./models');
    const adminExists = await User.findOne({ where: { correo: 'admin@example.com' } });
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        nombre: 'Administrador del Sistema',
        correo: 'admin@example.com',
        contraseña: hashedPassword,
        rol: 'admin',
        is_active: true
      });
      
      console.log('👤 Usuario administrador creado: admin@example.com / admin123');
    }

    // Iniciar servidor
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
      console.log(`📚 Documentación en: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check en: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔐 Credenciales de administrador:');
      console.log('   📧 Email: admin@example.com');
      console.log('   🔑 Password: admin123');
    });

    // Manejar cierre del servidor
    server.on('close', () => {
      console.error('❌ El servidor se ha cerrado inesperadamente');
    });

    return server;

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

// Mantener el proceso vivo
process.stdin.resume();

module.exports = app;
