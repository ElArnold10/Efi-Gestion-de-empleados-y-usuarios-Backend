const mysql = require('mysql2/promise');
const { sequelize } = require('./models');

const waitForDatabase = async (maxRetries = 10, delay = 5000) => {
  console.log('🔄 Esperando a que la base de datos esté disponible...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔍 Intento ${i + 1}/${maxRetries}`);
      
      // Mostrar variables de entorno
      console.log('Variables de entorno DB:');
      console.log('HOST:', process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST);
      console.log('PORT:', process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT);
      console.log('DATABASE:', process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE);
      console.log('USER:', process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER);
      
      // Intentar conectar
      await sequelize.authenticate();
      console.log('✅ Base de datos conectada exitosamente');
      return true;
    } catch (error) {
      console.log(`❌ Intento ${i + 1} fallido: ${error.message}`);
      if (i < maxRetries - 1) {
        console.log(`⏳ Esperando ${delay/1000} segundos antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('No se pudo conectar a la base de datos después de varios intentos');
};

module.exports = { waitForDatabase };
