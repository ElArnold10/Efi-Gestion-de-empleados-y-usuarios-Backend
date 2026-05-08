const mysql = require('mysql2/promise');

const testConnection = async () => {
  console.log('🧪 Probando conexión directa con MySQL...');
  
  // Probar con la URL que sabemos que funciona
  const testUrls = [
    'mysql://root:KDggZBaheZWoxgxneLDqqtoaxAvzcawX@turntable.proxy.rlwy.net:27838/railway',
    'mysql://root:KDggZBaheZWoxgxneLDqqtoaxAvzcawX@localhost:3306/railway'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`🔍 Probando URL: ${url.replace(/\/\/.*@/, '//***:***@')}`);
      
      const parsed = new URL(url);
      const connection = await mysql.createConnection({
        host: parsed.hostname,
        port: parsed.port || 3306,
        user: parsed.username,
        password: parsed.password,
        database: parsed.pathname.substring(1)
      });
      
      await connection.ping();
      console.log('✅ Conexión exitosa con:', url.replace(/\/\/.*@/, '//***:***@'));
      await connection.end();
      return url;
      
    } catch (error) {
      console.log(`❌ Falló conexión con ${url.replace(/\/\/.*@/, '//***:***@')}: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Errno: ${error.errno}`);
      console.log(`   SQL State: ${error.sqlState}`);
    }
  }
  
  throw new Error('No se pudo conectar con ninguna URL');
};

module.exports = { testConnection };
