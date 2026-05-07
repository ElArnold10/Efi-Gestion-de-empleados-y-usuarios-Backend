require('dotenv').config();

// Función para parsear MYSQL_URL
const parseMySqlUrl = (url) => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || 3306,
      database: parsed.pathname.substring(1), // Remove leading /
      username: parsed.username,
      password: parsed.password
    };
  } catch (error) {
    console.error('Error parsing MYSQL_URL:', error.message);
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
    if (process.env.MYSQL_URL) {
      console.log('🔗 Usando MYSQL_URL para conexión a base de datos');
      const parsed = parseMySqlUrl(process.env.MYSQL_URL);
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
            ssl: { rejectUnauthorized: false }
          },
          logging: console.log,
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        };
      }
    }
    
    // Prioridad 2: Usar variables Railway individuales
    console.log('🔧 Usando variables de entorno individuales para conexión');
    return {
      username: process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER,
      password: process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD,
      database: process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE,
      host: process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST,
      port: process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT || 3306,
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
