const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sendPasswordResetEmail, sendPasswordResetApproval, sendPasswordResetConfirmation } = require('../config/email');
const { 
  authenticateToken, 
  requireAdmin, 
  authLimiter,
  generalLimiter
} = require('../middleware/auth');

// Registro de usuarios (público - crea solicitantes)
const register = async (req, res) => {
  try {
    console.log(' Iniciando registro de usuario...');
    const { nombre, correo, contraseña, posicion_deseada, mensaje = '' } = req.body;
    
    console.log(` Datos recibidos - Nombre: ${nombre}, Correo: ${correo}`);

    console.log(' Verificando si el usuario ya existe...');
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { correo } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }

    console.log(' Hasheando contraseña...');
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    console.log(' Contraseña hasheada');

    console.log(' Creando usuario...');
    // Crear usuario como solicitante
    const user = await User.create({
      nombre,
      correo,
      contraseña: hashedPassword,
      rol: 'solicitante',
      is_active: true
    });
    console.log(' Usuario creado');

    console.log(' Creando solicitud de empleo...');
    // Crear solicitud de empleo
    const { EmployeeRequest } = require('../models');
    const employeeRequest = await EmployeeRequest.create({
      id_usuario: user.id,
      posicion_deseada,
      mensaje,
      estado: 'pendiente'
    });
    console.log(' Solicitud de empleo creada');

    console.log(' Creando notificaciones para administradores...');
    // Crear notificación para todos los administradores
    const { createAdminNotification } = require('./notifications');
    await createAdminNotification(
      'Nueva Solicitud de Empleo',
      `${nombre} ha solicitado empleo como ${posicion_deseada}. Revisa la solicitud para aprobarla o rechazarla.`,
      'employment_request',
      employeeRequest.id,
      'employee_request'
    );
    console.log(' Notificaciones creadas');

    console.log(' Generando token JWT...');
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        correo: user.correo, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    console.log(' Token generado');

    // Responder sin la contraseña
    const userResponse = user.toJSON();

    console.log(' Registro completado exitosamente');
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Su solicitud de empleo está pendiente de aprobación.',
      data: {
        user: userResponse,
        employee_request: employeeRequest,
        token
      }
    });
  } catch (error) {
    console.error(' Error en registro:', error);
    console.error(' Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login de usuarios
const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Buscar usuario por correo
    const user = await User.findOne({ where: { correo } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.',
        error: 'USER_INACTIVE'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        correo: user.correo, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Actualizar último login
    await user.update({ last_login: new Date() });

    // Responder sin la contraseña
    const userResponse = user.toJSON();
    delete userResponse.contraseña;

    // Mensaje especial para solicitantes
    let message = 'Login exitoso';
    if (user.rol === 'solicitante') {
      message = 'Login exitoso. Su solicitud de empleo está en proceso de revisión.';
    }

    res.json({
      success: true,
      message,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'LOGIN_ERROR'
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['contraseña'] },
      include: [{
        model: require('../models').Employee,
        as: 'empleado',
        attributes: ['id', 'posicion', 'fecha_contratacion', 'estado']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: 'PROFILE_ERROR'
    });
  }
};

// Actualizar perfil del usuario autenticado
const updateProfile = async (req, res) => {
  try {
    const { nombre, correo } = req.body;
    const userId = req.user.id;

    // Si se actualiza el correo, verificar que no exista
    if (correo && correo !== req.user.correo) {
      const existingUser = await User.findOne({ 
        where: { 
          correo,
          id: { [require('../models').Sequelize.Op.ne]: userId }
        } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }

    // Actualizar usuario
    const [updatedRowsCount] = await User.update(
      { nombre, correo },
      { 
        where: { id: userId },
        returning: true
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Obtener usuario actualizado
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['contraseña'] }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: 'PROFILE_UPDATE_ERROR'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { contraseña_actual, contraseña_nueva } = req.body;
    const userId = req.user.id;

    // Obtener usuario con contraseña
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(contraseña_actual, user.contraseña);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(contraseña_nueva, 10);

    // Actualizar contraseña
    await user.update({ contraseña: hashedNewPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: 'PASSWORD_CHANGE_ERROR'
    });
  }
};

// Refrescar token
const refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['contraseña'] }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generar nuevo token
    const token = jwt.sign(
      { 
        id: user.id, 
        correo: user.correo, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: { token, user }
    });
  } catch (error) {
    console.error('Error refrescando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al refrescar token',
      error: 'TOKEN_REFRESH_ERROR'
    });
  }
};

// Olvidé contraseña - enviar token al administrador
const forgotPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    console.log('🔍 DEBUG: Forgot Password - Inicio');
    console.log('📧 Email solicitado:', correo);

    if (!correo) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido',
        error: 'EMAIL_REQUIRED'
      });
    }

    // Buscar usuario por correo
    const user = await User.findOne({ where: { correo } });
    if (!user) {
      console.log('❌ Usuario no encontrado:', correo);
      return res.status(404).json({
        success: false,
        message: 'No existe una cuenta con ese correo electrónico',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      console.log('❌ Usuario inactivo:', correo);
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.',
        error: 'USER_INACTIVE'
      });
    }

    console.log('✅ Usuario encontrado y activo:', user.nombre);

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    console.log('🔑 Token generado:', resetToken);
    console.log('🕐 Expira:', resetTokenExpiry);

    // Actualizar usuario con el token
    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    console.log('✅ Token guardado en base de datos');

    // Buscar administradores para enviar el email
    const admins = await User.findAll({
      where: { rol: 'admin', is_active: true },
      attributes: ['correo']
    });

    console.log('👥 Administradores encontrados:', admins.length);
    admins.forEach(admin => {
      console.log('   - Admin:', admin.correo);
    });

    if (admins.length === 0) {
      console.error('❌ No se encontraron administradores activos para enviar el email de recuperación');
      return res.status(500).json({
        success: false,
        message: 'Error del sistema: no hay administradores disponibles',
        error: 'NO_ADMINS_AVAILABLE'
      });
    }

    // Enviar email a todos los administradores
    let emailSent = false;
    for (const admin of admins) {
      console.log('📧 Enviando email a admin:', admin.correo);
      const sent = await sendPasswordResetEmail(admin.correo, user.correo, resetToken);
      if (sent) {
        emailSent = true;
        console.log('✅ Email enviado exitosamente a:', admin.correo);
      } else {
        console.log('❌ Error al enviar email a:', admin.correo);
      }
    }

    if (!emailSent) {
      console.error('❌ No se pudo enviar el email a ningún administrador');
      console.log('🔧 MODO TEMPORAL: Token generado para pruebas manuales');
      console.log('📧 Email solicitante:', user.correo);
      console.log('👤 Nombre solicitante:', user.nombre);
      console.log('🔑 Token de recuperación:', resetToken);
      console.log('🕐 Expira:', resetTokenExpiry);
      console.log('🔗 Enlace de aprobación:', `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/approve-reset/${resetToken}?admin_email=admin@example.com`);
      
      return res.json({
        success: true,
        message: 'Solicitud procesada (modo temporal - ver consola del servidor para el token)',
        data: {
          email: user.correo,
          debug_mode: true,
          admin_token: resetToken,
          approve_link: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/approve-reset/${resetToken}?admin_email=admin@example.com`
        }
      });
    }

    console.log('✅ Proceso de forgot password completado exitosamente');

    res.json({
      success: true,
      message: 'Se ha enviado una solicitud de recuperación de contraseña al administrador. Por favor, espere la aprobación.',
      data: {
        email: user.correo,
        message: 'El administrador recibirá su solicitud y le proporcionará el token necesario.'
      }
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de recuperación',
      error: 'FORGOT_PASSWORD_ERROR'
    });
  }
};

// Restablecer contraseña usando token
const resetPassword = async (req, res) => {
  try {
    const { token, nueva_contraseña } = req.body;

    console.log('🔍 DEBUG: Reset Password - Datos recibidos:');
    console.log('🔑 Token:', token || 'undefined');
    console.log('🔑 Nueva contraseña:', nueva_contraseña ? '***' : 'undefined');
    console.log('📄 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));

    if (!token || !nueva_contraseña) {
      return res.status(400).json({
        success: false,
        message: 'El token y la nueva contraseña son requeridos',
        error: 'TOKEN_AND_PASSWORD_REQUIRED'
      });
    }

    if (nueva_contraseña.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    console.log('🕐 DEBUG: Buscando usuario con token...');
    console.log('🕐 DEBUG: Fecha actual:', new Date().toISOString());

    // Buscar usuario por token y verificar que no haya expirado
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: {
          [Op.gt]: new Date()
        }
      }
    });

    console.log('🔍 DEBUG: Usuario encontrado:', user ? 'SÍ' : 'NO');
    if (user) {
      console.log('🕐 DEBUG: Token expiry guardado:', user.reset_token_expiry);
      console.log('🕐 DEBUG: Fecha actual:', new Date());
      console.log('🕐 DEBUG: ¿Expirado?', new Date() > user.reset_token_expiry);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'INVALID_OR_EXPIRED_TOKEN'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nueva_contraseña, 10);

    // Actualizar contraseña y limpiar token
    await user.update({
      contraseña: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    // Enviar email de confirmación al empleado
    const confirmationSent = await sendPasswordResetConfirmation(user.correo);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
      data: {
        confirmation_sent: confirmationSent
      }
    });

  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: 'RESET_PASSWORD_ERROR'
    });
  }
};

// Aprobar solicitud de recuperación de contraseña (para administradores por email)
const approvePasswordReset = async (req, res) => {
  try {
    const { token } = req.params;
    const { admin_email } = req.query;

    console.log('🔍 DEBUG: Approve Password Reset - Token:', token);
    console.log('🔍 DEBUG: Admin Email:', admin_email);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de aprobación es requerido',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Buscar usuario por token y verificar que no haya expirado
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'INVALID_OR_EXPIRED_TOKEN'
      });
    }

    // Verificar que el admin_email sea válido (opcional)
    if (admin_email) {
      const admin = await User.findOne({
        where: { correo: admin_email, rol: 'admin', is_active: true }
      });
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: 'Administrador no autorizado',
          error: 'UNAUTHORIZED_ADMIN'
        });
      }
    }

    // Generar token de aprobación especial (válido por 24 horas)
    const approvalToken = crypto.randomBytes(32).toString('hex');
    const approvalExpiry = new Date(Date.now() + 86400000); // 24 horas

    // Actualizar usuario con token de aprobación
    await user.update({
      reset_token: approvalToken,
      reset_token_expiry: approvalExpiry
    });

    // Enviar email de notificación al empleado con el enlace directo
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${approvalToken}&approved=true`;
    
    console.log('✅ Solicitud aprobada. Enviando notificación a:', user.correo);
    console.log('🔗 Enlace de restablecimiento:', resetLink);

    // Enviar email al empleado con el enlace de restablecimiento
    const emailSent = await sendPasswordResetApproval(user.correo, approvalToken);

    // Crear página HTML de respuesta
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitud Aprobada</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .info { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .btn:hover { background: #0056b3; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="success">✅ Solicitud Aprobada</h1>
            <p>Ha aprobado exitosamente la solicitud de recuperación de contraseña</p>
          </div>
          
          <div class="info">
            <h3>📧 Notificación Enviada</h3>
            <p>Se ha enviado un email de notificación a <strong>${user.correo}</strong> con el enlace para que pueda restablecer su contraseña.</p>
            <p><strong>Estado del envío:</strong> ${emailSent ? '✅ Enviado exitosamente' : '❌ Error al enviar'}</p>
          </div>

          <div class="details">
            <h4>📋 Detalles de la solicitud:</h4>
            <ul>
              <li><strong>Empleado:</strong> ${user.nombre} (${user.correo})</li>
              <li><strong>Fecha de aprobación:</strong> ${new Date().toLocaleString('es-ES')}</li>
              <li><strong>Token de aprobación:</strong> ${approvalToken.substring(0, 8)}...</li>
            </ul>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Token Completo (Solución Temporal)</h4>
            <p style="margin-bottom: 10px;"><strong>Si el empleado no recibe el email, puedes darle este token directamente:</strong></p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 3px; word-break: break-all; font-family: monospace; font-size: 14px;">
              <strong>${approvalToken}</strong>
            </div>
            <p style="margin-top: 10px; margin-bottom: 0;">
              <strong>Enlace para el empleado:</strong><br>
              <a href="${resetLink}" style="word-break: break-all; color: #007bff;">${resetLink}</a>
            </p>
          </div>

          <div style="text-align: center;">
            <p>El empleado tiene 24 horas para restablecer su contraseña.</p>
            <a href="${resetLink}" class="btn" target="_blank">Ver Enlace de Restablecimiento</a>
          </div>

          <div class="footer">
            <p>Sistema de Gestión de Horarios<br>
            Este es un mensaje automático, no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);

  } catch (error) {
    console.error('Error en approve password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar la solicitud',
      error: 'APPROVAL_ERROR'
    });
  }
};

// Rechazar solicitud de recuperación de contraseña (para administradores por email)
const rejectPasswordReset = async (req, res) => {
  try {
    const { token } = req.params;
    const { admin_email, reason = 'Solicitud rechazada por el administrador' } = req.query;

    console.log('🔍 DEBUG: Reject Password Reset - Token:', token);
    console.log('🔍 DEBUG: Admin Email:', admin_email);
    console.log('🔍 DEBUG: Reason:', reason);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de rechazo es requerido',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Buscar usuario por token
    const user = await User.findOne({
      where: { reset_token: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }

    // Verificar que el admin_email sea válido (opcional)
    if (admin_email) {
      const admin = await User.findOne({
        where: { correo: admin_email, rol: 'admin', is_active: true }
      });
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: 'Administrador no autorizado',
          error: 'UNAUTHORIZED_ADMIN'
        });
      }
    }

    // Limpiar token de recuperación
    await user.update({
      reset_token: null,
      reset_token_expiry: null
    });

    console.log('❌ Solicitud rechazada para:', user.correo);

    // Crear página HTML de respuesta
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitud Rechazada</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
          .info { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="error">❌ Solicitud Rechazada</h1>
            <p>Ha rechazado la solicitud de recuperación de contraseña</p>
          </div>
          
          <div class="info">
            <h3>📋 Solicitud Cancelada</h3>
            <p>La solicitud de recuperación de contraseña para <strong>${user.correo}</strong> ha sido rechazada.</p>
            <p><strong>Motivo:</strong> ${reason}</p>
          </div>

          <div class="details">
            <h4>📋 Detalles de la solicitud:</h4>
            <ul>
              <li><strong>Empleado:</strong> ${user.nombre} (${user.correo})</li>
              <li><strong>Fecha de rechazo:</strong> ${new Date().toLocaleString('es-ES')}</li>
              <li><strong>Administrador:</strong> ${admin_email || 'No especificado'}</li>
            </ul>
          </div>

          <div class="footer">
            <p>Sistema de Gestión de Horarios<br>
            Este es un mensaje automático, no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);

  } catch (error) {
    console.error('Error en reject password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar la solicitud',
      error: 'REJECTION_ERROR'
    });
  }
};

// Logout (marcar token como inválido en el lado del cliente)
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  approvePasswordReset,
  rejectPasswordReset,
  logout
};
