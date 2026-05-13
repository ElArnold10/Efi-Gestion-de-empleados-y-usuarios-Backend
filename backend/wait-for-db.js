const mysql = require('mysql2/promise');
const { sequelize } = require('./models');

const waitForDatabase = async (maxRetries = 1, delay = 5000) => {
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
      let mysqlUrl = process.env.MYSQL_URL;
      console.log('🔍 MYSQL_URL original:', mysqlUrl);
      
      // Limpiar la URL si viene con prefijo
      if (mysqlUrl && mysqlUrl.startsWith('MYSQL_URL=')) {
        mysqlUrl = mysqlUrl.replace('MYSQL_URL=', '');
        console.log('🔧 MYSQL_URL limpiada:', mysqlUrl);
      }
      
      // Limpiar espacios y comillas
      mysqlUrl = mysqlUrl.trim();
      mysqlUrl = mysqlUrl.replace(/^["']|["']$/g, '');
      
      if (!mysqlUrl || mysqlUrl.trim() === '') {
        throw new Error('MYSQL_URL está vacía o no definida');
      }
      
      // Asegurar protocolo correcto
      if (!mysqlUrl.startsWith('mysql://')) {
        mysqlUrl = 'mysql://' + mysqlUrl;
      }
      
      const parsed = new URL(mysqlUrl);
      dbHost = parsed.hostname;
      dbPort = parsed.port || 3306;
      dbName = parsed.pathname.substring(1);
      dbUser = parsed.username;
      dbPassword = parsed.password;
      
      console.log('✅ Componentes parseados:');
      console.log('  Host:', dbHost);
      console.log('  Port:', dbPort);
      console.log('  Database:', dbName);
      console.log('  User:', dbUser);
      console.log('  Password:', dbPassword ? '***CONFIGURADO***' : 'NO DEFINIDO');
      
    } catch (error) {
      console.log('❌ Error detallado al parsear MYSQL_URL:');
      console.log('  URL recibida:', process.env.MYSQL_URL);
      console.log('  Error:', error.message);
      console.log('  Código error:', error.code);
      console.log('⚠️ Usando variables individuales como fallback...');
      // No lanzar error, usar variables individuales como fallback
      dbHost = process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST;
      dbPort = process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT;
      dbName = process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE;
      dbUser = process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER;
      dbPassword = process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD;
      
      console.log('🔍 Configuración de base de datos (fallback variables individuales):');
      console.log('HOST:', dbHost || 'NO DEFINIDO');
      console.log('PORT:', dbPort || 'NO DEFINIDO');
      console.log('DATABASE:', dbName || 'NO DEFINIDO');
      console.log('USER:', dbUser || 'NO DEFINIDO');
      console.log('PASSWORD:', dbPassword ? '***CONFIGURADO***' : 'NO DEFINIDO');
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
  
  // Validar que tenemos todas las variables necesarias
  if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
    throw new Error('❌ Faltan variables de entorno de la base de datos. Revisa la configuración en Railway Dashboard.');
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connectionInfo = process.env.MYSQL_URL 
        ? `via MYSQL_URL` 
        : `a ${dbHost}:${dbPort}/${dbName}`;
      console.log(`🔍 Intento ${i + 1}/${maxRetries} - Conectando ${connectionInfo}...`);
      
      // Primero probar conexión directa MySQL
      const { testConnection } = require('./test-connection');
      try {
        const workingUrl = await testConnection();
        console.log('✅ Conexión directa MySQL funcionó');
      } catch (testError) {
        console.log('❌ Conexión directa MySQL falló:', testError.message);
      }
      
      // Intentar conectar con Sequelize usando la misma configuración que funciona
      try {
        // Forzar recarga de configuración de Sequelize
        const { Sequelize } = require('sequelize');
        
        // Usar la URL limpia directamente
        let mysqlUrl = process.env.MYSQL_URL;
        if (mysqlUrl && mysqlUrl.startsWith('MYSQL_URL=')) {
          mysqlUrl = mysqlUrl.replace('MYSQL_URL=', '');
        }
        
        // Limpiar espacios y comillas
        if (mysqlUrl) {
          mysqlUrl = mysqlUrl.trim();
          mysqlUrl = mysqlUrl.replace(/^["']|["']$/g, '');
          
          // Asegurar protocolo correcto
          if (!mysqlUrl.startsWith('mysql://')) {
            mysqlUrl = 'mysql://' + mysqlUrl;
          }
          
          console.log('🔧 Sequelize - Forzando conexión directa con URL:', mysqlUrl.replace(/\/\/.*@/, '//***:***@'));
        } else {
          console.log('🔧 Sequelize - MYSQL_URL no está definida, usando configuración individual');
          mysqlUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
        }
        
        const sequelizeDirect = new Sequelize(mysqlUrl, {
          dialect: 'mysql',
          logging: false,
          dialectOptions: {
            connectTimeout: 60000,
            ssl: { rejectUnauthorized: false }
          }
        });
        
        await sequelizeDirect.authenticate();
        console.log('✅ Base de datos conectada exitosamente con Sequelize directo');
        return true;
        
      } catch (sequelizeError) {
        console.log('❌ Sequelize directo falló:', sequelizeError.message);
        throw sequelizeError;
      }
    } catch (error) {
      console.log(`❌ Intento ${i + 1} fallido: ${error.message}`);
      console.log(`   Código de error: ${error.code || 'N/A'}`);
      console.log(`   Error padre: ${error.parent?.message || 'N/A'}`);
      console.log(`   Error completo:`, error);
      console.log(`   Stack:`, error.stack);
      
      if (i < maxRetries - 1) {
        console.log(`⏳ Esperando ${delay/1000} segundos antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`❌ No se pudo conectar a la base de datos después de ${maxRetries} intentos. Último error: ver logs arriba.`);
};

module.exports = { waitForDatabase };
