const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando base de datos desde archivo SQL...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../sistema_horarios.sql');
    if (!fs.existsSync(sqlPath)) {
      console.log('⚠️ No se encontró el archivo SQL, usando sincronización Sequelize');
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Archivo SQL leído correctamente');
    
    // Obtener configuración de la base de datos
    const dbConfig = {
      host: process.env.MYSQL_URL ? 
        new URL(process.env.MYSQL_URL).hostname : 
        (process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST),
      port: process.env.MYSQL_URL ? 
        new URL(process.env.MYSQL_URL).port : 
        (process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT || 3306),
      user: process.env.MYSQL_URL ? 
        new URL(process.env.MYSQL_URL).username : 
        (process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER),
      password: process.env.MYSQL_URL ? 
        new URL(process.env.MYSQL_URL).password : 
        (process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD),
      database: process.env.MYSQL_URL ? 
        new URL(process.env.MYSQL_URL).pathname.substring(1) : 
        (process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE),
      multipleStatements: true
    };
    
    console.log('🔗 Conectando a base de datos para importar...');
    
    // Conectar sin especificar base de datos primero
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });
    
    // Ejecutar el script SQL
    console.log('📥 Importando esquema de la base de datos...');
    await connection.query(sqlContent);
    
    await connection.end();
    console.log('✅ Base de datos importada exitosamente desde archivo SQL');
    return true;
    
  } catch (error) {
    console.log('❌ Error al importar base de datos desde SQL:', error.message);
    console.log('🔄 Usando sincronización Sequelize como fallback...');
    return false;
  }
};

module.exports = { initDatabase };
