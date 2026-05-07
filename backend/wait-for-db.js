const mysql = require('mysql2/promise');
const { sequelize } = require('./models');

const waitForDatabase = async (maxRetries = 10, delay = 5000) => {
  console.log('🔄 Esperando a que la base de datos esté disponible...');
  
  // Verificar si tenemos MYSQL_URL o variables individuales
  if (process.env.MYSQL_URL) {
    console.log('🔗 Usando MYSQL_URL para conexión');
    console.log('MYSQL_URL:', process.env.MYSQL_URL.replace(/\/\/.*@/, '//***:***@')); // Ocultar credenciales
  } else {
    // Verificar variables de entorno individuales
    const dbHost = process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST;
    const dbPort = process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT;
    const dbName = process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE;
    const dbUser = process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER;
    const dbPassword = process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD;
    
    console.log('🔍 Configuración de base de datos (variables individuales):');
    console.log('HOST:', dbHost || 'NO DEFINIDO');
    console.log('PORT:', dbPort || 'NO DEFINIDO');
    console.log('DATABASE:', dbName || 'NO DEFINIDO');
    console.log('USER:', dbUser || 'NO DEFINIDO');
    console.log('PASSWORD:', dbPassword ? '***CONFIGURADO***' : 'NO DEFINIDO');
    
    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('❌ Faltan variables de entorno de la base de datos. Revisa la configuración en Railway Dashboard.');
    }
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connectionInfo = process.env.MYSQL_URL 
        ? `via MYSQL_URL` 
        : `a ${dbHost}:${dbPort}/${dbName}`;
      console.log(`🔍 Intento ${i + 1}/${maxRetries} - Conectando ${connectionInfo}...`);
      
      // Intentar conectar
      await sequelize.authenticate();
      console.log('✅ Base de datos conectada exitosamente');
      return true;
    } catch (error) {
      console.log(`❌ Intento ${i + 1} fallido: ${error.message}`);
      console.log(`   Código de error: ${error.code || 'N/A'}`);
      console.log(`   Error padre: ${error.parent?.message || 'N/A'}`);
      
      if (i < maxRetries - 1) {
        console.log(`⏳ Esperando ${delay/1000} segundos antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`❌ No se pudo conectar a la base de datos después de ${maxRetries} intentos. Último error: ver logs arriba.`);
};

module.exports = { waitForDatabase };
