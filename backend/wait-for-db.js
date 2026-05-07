const mysql = require('mysql2/promise');
const { sequelize } = require('./models');

const waitForDatabase = async (maxRetries = 10, delay = 5000) => {
  console.log('🔄 Esperando a que la base de datos esté disponible...');
  
  // Debug: Mostrar todas las variables de entorno relevantes
  console.log('🔍 Variables de entorno disponibles:');
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? '***CONFIGURADO***' : 'NO DEFINIDO');
  console.log('DB_HOST:', process.env.DB_HOST || 'NO DEFINIDO');
  console.log('DB_PORT:', process.env.DB_PORT || 'NO DEFINIDO');
  console.log('DB_NAME:', process.env.DB_NAME || 'NO DEFINIDO');
  console.log('DB_USER:', process.env.DB_USER || 'NO DEFINIDO');
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***CONFIGURADO***' : 'NO DEFINIDO');
  console.log('RAILWAY_PRIVATE_MYSQL_HOST:', process.env.RAILWAY_PRIVATE_MYSQL_HOST || 'NO DEFINIDO');
  console.log('RAILWAY_PRIVATE_MYSQL_PORT:', process.env.RAILWAY_PRIVATE_MYSQL_PORT || 'NO DEFINIDO');
  console.log('RAILWAY_PRIVATE_MYSQL_DATABASE:', process.env.RAILWAY_PRIVATE_MYSQL_DATABASE || 'NO DEFINIDO');
  console.log('RAILWAY_PRIVATE_MYSQL_USER:', process.env.RAILWAY_PRIVATE_MYSQL_USER || 'NO DEFINIDO');
  console.log('RAILWAY_PRIVATE_MYSQL_PASSWORD:', process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD ? '***CONFIGURADO***' : 'NO DEFINIDO');
  
  // Variables para conexión (usar MYSQL_URL o variables individuales)
  let dbHost, dbPort, dbName, dbUser, dbPassword;
  
  // Verificar si tenemos MYSQL_URL o variables individuales
  if (process.env.MYSQL_URL) {
    console.log('🔗 Usando MYSQL_URL para conexión');
    console.log('MYSQL_URL:', process.env.MYSQL_URL.replace(/\/\/.*@/, '//***:***@')); // Ocultar credenciales
    console.log('✅ Configuración de base de datos válida via MYSQL_URL');
    
    // Parsear MYSQL_URL para obtener componentes
    try {
      const parsed = new URL(process.env.MYSQL_URL);
      dbHost = parsed.hostname;
      dbPort = parsed.port || 3306;
      dbName = parsed.pathname.substring(1);
      dbUser = parsed.username;
      dbPassword = parsed.password;
    } catch (error) {
      throw new Error('❌ Error al parsear MYSQL_URL: ' + error.message);
    }
  } else {
    // Usar variables de entorno individuales
    dbHost = process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST;
    dbPort = process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT;
    dbName = process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE;
    dbUser = process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER;
    dbPassword = process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD;
    
    console.log('🔍 Configuración de base de datos (variables individuales):');
    console.log('HOST:', dbHost || 'NO DEFINIDO');
    console.log('PORT:', dbPort || 'NO DEFINIDO');
    console.log('DATABASE:', dbName || 'NO DEFINIDO');
    console.log('USER:', dbUser || 'NO DEFINIDO');
    console.log('PASSWORD:', dbPassword ? '***CONFIGURADO***' : 'NO DEFINIDO');
    
    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('❌ Faltan variables de entorno de la base de datos. Revisa la configuración en Railway Dashboard.');
    }
    console.log('✅ Configuración de base de datos válida via variables individuales');
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
