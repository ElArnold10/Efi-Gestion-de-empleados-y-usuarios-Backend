const sgMail = require('@sendgrid/mail');

// Configurar SendGrid con la API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'RUZMXWi1R_KIXfA-YAy8NQ');

const sendPasswordResetEmail = async (adminEmail, employeeEmail, resetToken) => {
  const now = new Date();
  const expiry = new Date(Date.now() + 3600000); // 1 hora
  
  console.log('🔧 MODO DEBUG: SendGrid deshabilitado temporalmente');
  console.log('📧 Email del administrador:', adminEmail);
  console.log('👤 Email del empleado:', employeeEmail);
  console.log('🔑 Token de recuperación:', resetToken);
  console.log('⏰ Fecha de generación:', now.toISOString());
  console.log('⏳ Fecha de expiración:', expiry.toISOString());
  console.log('⏱️ Tiempo restante (ms):', expiry - now);
  console.log('⏱️ Tiempo restante (min):', (expiry - now) / (1000 * 60));
  
  // Simular envío exitoso para pruebas
  return true;
};

const sendPasswordResetConfirmation = async (employeeEmail) => {
  console.log('🔧 MODO DEBUG: Confirmación de restablecimiento');
  console.log('👤 Email del empleado:', employeeEmail);
  console.log('✅ Contraseña restablecida exitosamente');
  console.log('🕐 Fecha de restablecimiento:', new Date().toISOString());
  
  // Simular envío exitoso para pruebas
  return true;
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
