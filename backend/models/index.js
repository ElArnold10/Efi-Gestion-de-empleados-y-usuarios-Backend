const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

// Si tenemos MYSQL_URL, usarla directamente (más robusto)
if (process.env.MYSQL_URL) {
  let mysqlUrl = process.env.MYSQL_URL;
  if (mysqlUrl.startsWith('MYSQL_URL=')) {
    mysqlUrl = mysqlUrl.replace('MYSQL_URL=', '');
  }
  
  console.log('🔧 Models - Usando MYSQL_URL directa:', mysqlUrl.replace(/\/\/.*@/, '//***:***@'));
  
  sequelize = new Sequelize(mysqlUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  });
} else {
  console.log('🔧 Models - Usando configuración tradicional');
  
  // Crear instancia de Sequelize
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
    define: {
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
  );
}

// Importar modelos
const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const Schedule = require('./Schedule')(sequelize);
const ScheduleRequest = require('./ScheduleRequest')(sequelize);
const EmployeeRequest = require('./EmployeeRequest')(sequelize);
const Notification = require('./Notification')(sequelize);

// Establecer asociaciones
const setupAssociations = () => {
  // User associations
  User.associate({ Employee, EmployeeRequest, Notification });

  // Employee associations
  Employee.associate({ User, Schedule, ScheduleRequest });

  // Schedule associations
  Schedule.associate({ Employee });

  // ScheduleRequest associations
  ScheduleRequest.associate({ Employee, User });

  // EmployeeRequest associations
  EmployeeRequest.associate({ User });

  // Notification associations
  Notification.associate({ User });
};

// Configurar asociaciones
setupAssociations();

// Objeto de la base de datos
const db = {
  sequelize,
  Sequelize,
  User,
  Employee,
  Schedule,
  ScheduleRequest,
  EmployeeRequest,
  Notification
};

// Sincronización de la base de datos
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');

    if (force) {
      await sequelize.sync({ force: true });
      console.log('🔄 Base de datos recreada (force sync).');
    } else {
      await sequelize.sync({ alter: true });
      console.log('🔄 Base de datos sincronizada (alter sync).');
    }

    // Crear usuario admin por defecto
    await createDefaultAdmin();

    console.log('✅ Base de datos sincronizada exitosamente.');
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error);
    return false;
  }
};

// Crear usuario administrador por defecto
const createDefaultAdmin = async () => {
  try {
    const adminExists = await db.User.findOne({
      where: { correo: 'admin@example.com' }
    });

    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await db.User.create({
        nombre: 'Administrador del Sistema',
        correo: 'admin@example.com',
        contraseña: hashedPassword,
        rol: 'admin',
        is_active: true
      });

      console.log('👤 Usuario administrador por defecto creado:');
      console.log('   📧 Email: admin@example.com');
      console.log('   🔑 Contraseña: admin123');
    }
  } catch (error) {
    console.error('❌ Error al crear usuario admin por defecto:', error);
  }
};

// Métodos de utilidad
db.syncDatabase = syncDatabase;
db.createDefaultAdmin = createDefaultAdmin;

module.exports = db;
