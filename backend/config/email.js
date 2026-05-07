const emailService = require('../services/emailService');
const nodemailer = require('nodemailer');

// Configurar Gmail SMTP como fallback
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendPasswordResetEmail = async (adminEmail, employeeEmail, resetToken) => {
  const approveUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/approve-reset/${resetToken}?admin_email=${encodeURIComponent(adminEmail)}`;
  const rejectUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/reject-reset/${resetToken}?admin_email=${encodeURIComponent(adminEmail)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud de Recuperación de Contraseña</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🔐 Solicitud de Recuperación</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Solicitud de Restablecimiento de Contraseña</h2>
        <p>El empleado con email <strong>${employeeEmail}</strong> ha solicitado restablecer su contraseña.</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Detalles de la solicitud:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email del empleado:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de solicitud:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString('es-ES')}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Token de recuperación:</strong></td>
              <td style="padding: 8px;"><code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px;">${resetToken}</code></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #495057;">⚡ Acciones Rápidas</h3>
          <p style="color: #6c757d;">Puedes aprobar o rechazar esta solicitud directamente desde este email:</p>
          
          <div style="margin: 20px 0;">
            <a href="${approveUrl}" 
               style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">
              ✅ Aprobar Solicitud
            </a>
            <a href="${rejectUrl}" 
               style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">
              ❌ Rechazar Solicitud
            </a>
          </div>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h4 style="color: #155724; margin-top: 0;">📧 ¿Qué sucede al aprobar?</h4>
          <ul style="color: #155724; margin-bottom: 0;">
            <li>Se generará un nuevo token válido por 24 horas</li>
            <li>El empleado recibirá un email con el enlace directo para restablecer su contraseña</li>
            <li>Podrá acceder al sistema con su nueva contraseña inmediatamente</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">⚠️ Importante:</h4>
          <ul style="color: #856404; margin-bottom: 0;">
            <li>Esta solicitud expirará en 1 hora por seguridad</li>
            <li>Si no tomas ninguna acción, la solicitud será cancelada automáticamente</li>
            <li>Verifica la identidad del empleado antes de aprobar</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">
          Si no reconoces esta solicitud o crees que es fraudulenta, ignora este mensaje o rechaza la solicitud.<br>
          Este es un email automático, por favor no responder a esta dirección.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await emailService.sendEmail(adminEmail, '🔐 Solicitud de Recuperación de Contraseña - Sistema de Horarios', html);
    console.log('Email de recuperación enviado al administrador:', adminEmail);
    return true;
  } catch (error) {
    console.error('Error con SendGrid, intentando con Gmail SMTP:', error.message);
    
    // Fallback a Gmail SMTP
    try {
      const transporter = createGmailTransporter();
      const gmailMsg = {
        to: adminEmail,
        from: process.env.EMAIL_USER,
        subject: '🔐 Solicitud de Recuperación de Contraseña - Sistema de Horarios',
        html: html
      };
      
      await transporter.sendMail(gmailMsg);
      console.log('Email de recuperación enviado via Gmail SMTP:', adminEmail);
      return true;
    } catch (gmailError) {
      console.error('Error con Gmail SMTP:', gmailError.message);
      console.error('Error original de SendGrid:', error.message);
      return false;
    }
  }
};

const sendPasswordResetApproval = async (employeeEmail, resetToken) => {
  try {
    await emailService.sendPasswordResetEmail(employeeEmail, 'Empleado', resetToken);
    console.log('Email de aprobación enviado al empleado:', employeeEmail);
    return true;
  } catch (error) {
    console.error('Error con SendGrid, intentando con Gmail SMTP:', error.message);
    
    // Fallback a Gmail SMTP
    try {
      const transporter = createGmailTransporter();
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&approved=true`;
      
      const gmailMsg = {
        to: employeeEmail,
        from: process.env.EMAIL_USER,
        subject: '✅ Solicitud Aprobada - Restablece tu Contraseña',
        html: emailService.getPasswordResetTemplate('Empleado', resetLink)
      };
      
      await transporter.sendMail(gmailMsg);
      console.log('Email de aprobación enviado via Gmail SMTP:', employeeEmail);
      return true;
    } catch (gmailError) {
      console.error('Error con Gmail SMTP:', gmailError.message);
      console.error('Error original de SendGrid:', error.message);
      return false;
    }
  }
};

const sendPasswordResetConfirmation = async (employeeEmail) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contraseña Restablecida</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">✅ ¡Contraseña Actualizada!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Contraseña Restablecida Exitosamente</h2>
        <p>Tu contraseña ha sido actualizada correctamente en el Sistema de Gestión de Horarios.</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #56ab2f; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #56ab2f;">🚀 ¿Qué sigue?</h3>
          <p>Ya puedes iniciar sesión con tu nueva contraseña:</p>
          <ol style="padding-left: 20px;">
            <li>Visita el portal de inicio de sesión</li>
            <li>Usa tu email y tu nueva contraseña</li>
            <li>Accede a tu dashboard y gestiona tus horarios</li>
          </ol>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #ffc107;">🔐 Información de seguridad:</h3>
          <ul style="padding-left: 20px;">
            <li>Si no realizaste este cambio, contacta inmediatamente al administrador</li>
            <li>Considera usar una contraseña fuerte y única</li>
            <li>No compartas tus credenciales con nadie</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #56ab2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Iniciar Sesión</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">
          Este es un email automático, por favor no responder a esta dirección.<br>
          Si tienes problemas, contacta al administrador del sistema.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await emailService.sendEmail(employeeEmail, '✅ Contraseña Restablecida Exitosamente - Sistema de Horarios', html);
    console.log('Email de confirmación enviado al empleado:', employeeEmail);
    return true;
  } catch (error) {
    console.error('Error con SendGrid, intentando con Gmail SMTP:', error.message);
    
    // Fallback a Gmail SMTP
    try {
      const transporter = createGmailTransporter();
      const gmailMsg = {
        to: employeeEmail,
        from: process.env.EMAIL_USER,
        subject: '✅ Contraseña Restablecida Exitosamente - Sistema de Horarios',
        html: html
      };
      
      await transporter.sendMail(gmailMsg);
      console.log('Email de confirmación enviado via Gmail SMTP:', employeeEmail);
      return true;
    } catch (gmailError) {
      console.error('Error con Gmail SMTP:', gmailError.message);
      console.error('Error original de SendGrid:', error.message);
      return false;
    }
  }
};

// Nuevas funciones para notificaciones del sistema
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    await emailService.sendWelcomeEmail(userEmail, userName);
    console.log('Email de bienvenida enviado:', userEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error.message);
    return false;
  }
};

const sendEmployeeApprovalNotification = async (userEmail, userName, approvedBy) => {
  try {
    await emailService.sendEmployeeApprovalNotification(userEmail, userName, approvedBy);
    console.log('Email de aprobación de empleado enviado:', userEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de aprobación de empleado:', error.message);
    return false;
  }
};

const sendEmployeeRejectionNotification = async (userEmail, userName, rejectionReason) => {
  try {
    await emailService.sendEmployeeRejectionNotification(userEmail, userName, rejectionReason);
    console.log('Email de rechazo de empleado enviado:', userEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de rechazo de empleado:', error.message);
    return false;
  }
};

const sendScheduleChangeNotification = async (userEmail, userName, changeDetails) => {
  try {
    await emailService.sendScheduleChangeNotification(userEmail, userName, changeDetails);
    console.log('Email de cambio de horario enviado:', userEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de cambio de horario:', error.message);
    return false;
  }
};

const sendScheduleAssignedEmail = async (userEmail, userName, scheduleDetails) => {
  try {
    await emailService.sendScheduleAssignedEmail(userEmail, userName, scheduleDetails);
    console.log('Email de horario asignado enviado:', userEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de horario asignado:', error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetApproval,
  sendPasswordResetConfirmation,
  sendWelcomeEmail,
  sendEmployeeApprovalNotification,
  sendEmployeeRejectionNotification,
  sendScheduleChangeNotification,
  sendScheduleAssignedEmail
};
