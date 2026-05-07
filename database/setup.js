require('dotenv').config();
const db = require('./models');

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Sincronizar base de datos
    const success = await db.syncDatabase(true);
    
    if (success) {
      console.log('\n✅ ¡Base de datos configurada exitosamente!');
      console.log('\n📋 Información de acceso:');
      console.log('   🗄️  Base de datos: sistema_horarios');
      console.log('   👤 Usuario admin: admin@sistema.com');
      console.log('   🔑 Contraseña: admin123');
      console.log('\n📊 Tablas creadas:');
      console.log('   • users (usuarios)');
      console.log('   • employees (empleados)');
      console.log('   • schedules (horarios)');
      console.log('   • schedule_requests (solicitudes de cambio)');
      
      console.log('\n🔗 Relaciones establecidas:');
      console.log('   • users 1:1 employees');
      console.log('   • employees 1:N schedules');
      console.log('   • employees 1:N schedule_requests');
      console.log('   • users 1:N schedule_requests (revisor)');
      
      console.log('\n🎯 ¡Listo para usar el sistema!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    process.exit(1);
  }
}

setupDatabase();
