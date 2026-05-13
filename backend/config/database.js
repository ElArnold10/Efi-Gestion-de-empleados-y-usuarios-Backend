require('dotenv').config();

// Función para parsear MYSQL_URL
const parseMySqlUrl = (url) => {
  if (!url) return null;
  
  try {
    // Limpiar URL si viene con prefijo
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('MYSQL_URL=')) {
      cleanUrl = cleanUrl.replace('MYSQL_URL=', '').trim();
    }
    
    // Remover comillas si existen
    cleanUrl = cleanUrl.replace(/^["']|["']$/g, '');
    
    // Asegurar que tenga el protocolo correcto
    if (!cleanUrl.startsWith('mysql://')) {
      cleanUrl = 'mysql://' + cleanUrl;
    }
    
    console.log('🔧 Sequelize - URL original:', url);
    console.log('🔧 Sequelize - URL limpiada:', cleanUrl);
    
    const parsed = new URL(cleanUrl);
    const config = {
      host: parsed.hostname,
      port: parsed.port || 3306,
      database: parsed.pathname.substring(1), // Remove leading /
      username: parsed.username,
      password: parsed.password
    };
    
    console.log('✅ Sequelize - Config parseada:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password ? '***CONFIGURADO***' : 'NO DEFINIDO'
    });
    
    return config;
  } catch (error) {
    console.error('❌ Sequelize - Error parsing MYSQL_URL:', error.message);
    console.error('❌ Sequelize - URL que causó error:', url);
    return null;
  }
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root123456!',
    database: process.env.DB_NAME || 'sistema_horarios',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      authPlugins: {
        mysql_native_password: true
      }
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root123456!',
    database: process.env.DB_NAME_TEST || 'sistema_horarios_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      authPlugins: {
        mysql_native_password: true
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: (() => {
    // Prioridad 1: Usar MYSQL_URL si está disponible
    if (process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL) {
      const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
      console.log('🔗 Usando MYSQL_URL para conexión a base de datos');
      const parsed = parseMySqlUrl(mysqlUrl);
      if (parsed) {
        return {
          username: parsed.username,
          password: parsed.password,
          database: parsed.database,
          host: parsed.host,
          port: parsed.port,
          dialect: 'mysql',
          dialectOptions: {
            authPlugins: {
              mysql_native_password: true
            },
            ssl: { rejectUnauthorized: false },
            connectTimeout: 60000
          },
          logging: console.log,
          pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000,
            evict: 1000
          }
        };
      }
    }
    
    // Prioridad 2: Usar variables Railway individuales
    console.log('🔧 Usando variables de entorno individuales para conexión');
    return {
      username: process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER || process.env.MYSQLUSER,
      password: process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
      host: process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST || process.env.MYSQLHOST || process.env.RAILWAY_PRIVATE_DOMAIN,
      port: process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT || process.env.MYSQLPORT || 3306,
      dialect: 'mysql',
      dialectOptions: {
        authPlugins: {
          mysql_native_password: true
        },
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      },
      logging: console.log,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  })()
};
