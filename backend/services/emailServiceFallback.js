const nodemailer = require('nodemailer');

class EmailServiceFallback {
  constructor() {
    this.fromEmail = process.env.EMAIL_USER || process.env.SENDGRID_FROM_EMAIL;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Configurar transporter con Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await this.transporter.sendMail(msg);
      console.log(`✅ Email enviado exitosamente a ${to} via Gmail SMTP`);
      return result;
    } catch (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error.message);
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Plantillas de email (mismas que SendGrid pero usando Gmail)

  async sendWelcomeEmail(userEmail, userName) {
    const subject = '🎉 Bienvenido al Sistema de Gestión de Horarios';
    const html = this.getWelcomeTemplate(userName);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const subject = '🔒 Restablecimiento de Contraseña';
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetTemplate(userName, resetUrl);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendScheduleChangeNotification(userEmail, userName, changeDetails) {
    const subject = '📅 Notificación de Cambio de Horario';
    const html = this.getScheduleChangeTemplate(userName, changeDetails);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendEmployeeApprovalNotification(userEmail, userName, approvedBy) {
    const subject = '✅ Solicitud de Empleado Aprobada';
    const html = this.getEmployeeApprovalTemplate(userName, approvedBy);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendEmployeeRejectionNotification(userEmail, userName, rejectionReason) {
    const subject = '❌ Solicitud de Empleado Rechazada';
    const html = this.getEmployeeRejectionTemplate(userName, rejectionReason);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendScheduleAssignedEmail(userEmail, userName, scheduleDetails) {
    const subject = '📋 Nuevo Horario Asignado';
    const html = this.getScheduleAssignedTemplate(userName, scheduleDetails);
    return this.sendEmail(userEmail, subject, html);
  }

  // Métodos de plantillas (idénticos a los de SendGrid)

  getWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido al Sistema</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 ¡Bienvenido!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          <p>¡Nos complace darte la bienvenida al Sistema de Gestión de Horarios! Tu cuenta ha sido creada exitosamente.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">🚀 Próximos pasos:</h3>
            <ol style="padding-left: 20px;">
              <li>Inicia sesión en tu cuenta</li>
              <li>Completa tu perfil si es necesario</li>
              <li>Solicita ser empleado si aún no lo eres</li>
              <li>Comienza a gestionar tus horarios</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ir al Sistema</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta, no dudes en contactar al administrador del sistema.<br>
            Este es un email automático, por favor no responder a esta dirección.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔒 Restablecimiento de Contraseña</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este email.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Restablecer Contraseña</a>
          </div>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #f5576c;">🔐 Recomendaciones de seguridad:</h3>
            <ul style="padding-left: 20px;">
              <li>Usa una contraseña con al menos 8 caracteres</li>
              <li>Incluye números, letras mayúsculas y minúsculas</li>
              <li>No uses contraseñas obvias o información personal</li>
              <li>No reuses contraseñas de otros servicios</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Si tienes problemas para hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getScheduleChangeTemplate(userName, changeDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cambio de Horario</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📅 Notificación de Cambio</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          <p>Se ha realizado un cambio en tu horario. Aquí están los detalles:</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #4facfe; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4facfe;">📋 Detalles del cambio:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tipo de cambio:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${changeDetails.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${changeDetails.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Horario anterior:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${changeDetails.oldSchedule}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Nuevo horario:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${changeDetails.newSchedule}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Motivo:</strong></td>
                <td style="padding: 8px;">${changeDetails.reason}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/dashboard" style="background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Mis Horarios</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta sobre este cambio, contacta al administrador.<br>
            Este es un email automático, por favor no responder a esta dirección.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getEmployeeApprovalTemplate(userName, approvedBy) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solicitud Aprobada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ ¡Solicitud Aprobada!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">¡Felicitaciones ${userName}!</h2>
          <p>Tu solicitud para ser empleado ha sido aprobada por <strong>${approvedBy}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #56ab2f; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #56ab2f;">🎉 ¿Qué puedes hacer ahora?</h3>
            <ul style="padding-left: 20px;">
              <li>Ver y gestionar tus horarios asignados</li>
              <li>Solicitar cambios de horario</li>
              <li>Ver tu historial de solicitudes</li>
              <li>Acceder a todas las funcionalidades de empleado</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/dashboard" style="background: #56ab2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ir a mi Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Bienvenido al equipo! Si tienes alguna pregunta, no dudes en contactar al administrador.<br>
            Este es un email automático, por favor no responder a esta dirección.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getEmployeeRejectionTemplate(userName, rejectionReason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solicitud Rechazada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">❌ Solicitud Rechazada</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          <p>Lamentamos informarte que tu solicitud para ser empleado ha sido rechazada.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-left: 4px solid #eb3349; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #eb3349;">📝 Motivo del rechazo:</h3>
            <p style="margin: 0;">${rejectionReason}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ffc107;">💡 ¿Qué puedes hacer?</h3>
            <ul style="padding-left: 20px;">
              <li>Revisar el motivo del rechazo</li>
              <li>Corregir cualquier problema identificado</li>
              <li>Enviar una nueva solicitud cuando estés listo</li>
              <li>Contactar al administrador si tienes dudas</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/profile" style="background: #eb3349; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Mi Perfil</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta sobre esta decisión, por favor contacta al administrador.<br>
            Este es un email automático, por favor no responder a esta dirección.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getScheduleAssignedTemplate(userName, scheduleDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Horario Asignado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📋 Nuevo Horario</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Horarios</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          <p>Se te ha asignado un nuevo horario. Aquí están los detalles:</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">📅 Detalles del horario:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Turno:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${scheduleDetails.shift}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Horario:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${scheduleDetails.schedule}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de inicio:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${scheduleDetails.startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de fin:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${scheduleDetails.endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Departamento:</strong></td>
                <td style="padding: 8px;">${scheduleDetails.department}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Mis Horarios</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Por favor revisa tu horario y reporta cualquier inconsistencia al administrador.<br>
            Este es un email automático, por favor no responder a esta dirección.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailServiceFallback();
