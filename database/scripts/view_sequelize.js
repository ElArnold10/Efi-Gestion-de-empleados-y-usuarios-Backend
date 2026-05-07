require('dotenv').config();
const db = require('../models');

async function viewDatabase() {
  try {
    console.log('🔍 Explorando Base de Datos con Sequelize');
    console.log('==========================================\n');

    // 1. Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida\n');

    // 2. Mostrar tablas
    console.log('📊 TABLAS DISPONIBLES:');
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    tables.forEach(table => console.log(`   • ${table}`));
    console.log('');

    // 3. Mostrar usuarios
    console.log('👥 USUARIOS REGISTRADOS:');
    const users = await db.User.findAll({
      attributes: ['id', 'nombre', 'correo', 'rol', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   📧 ${user.correo} | 👤 ${user.nombre} | 🏷️ ${user.rol} | ✅ ${user.is_active ? 'Activo' : 'Inactivo'}`);
      });
    } else {
      console.log('   ❌ No hay usuarios registrados');
    }
    console.log('');

    // 4. Mostrar empleados con sus usuarios
    console.log('👤 EMPLEADOS REGISTRADOS:');
    const employees = await db.Employee.findAll({
      include: [{
        model: db.User,
        as: 'usuario',
        attributes: ['nombre', 'correo', 'rol']
      }],
      order: [['created_at', 'DESC']]
    });

    if (employees.length > 0) {
      employees.forEach(employee => {
        console.log(`   👤 ${employee.usuario.nombre} | 📧 ${employee.usuario.correo} | 💼 ${employee.posicion} | 📅 ${employee.fecha_contratacion} | ✅ ${employee.estado ? 'Activo' : 'Inactivo'}`);
      });
    } else {
      console.log('   ❌ No hay empleados registrados');
    }
    console.log('');

    // 5. Mostrar horarios
    console.log('🕐 HORARIOS CREADOS:');
    const schedules = await db.Schedule.findAll({
      include: [{
        model: db.Employee,
        as: 'empleado',
        include: [{
          model: db.User,
          as: 'usuario',
          attributes: ['nombre', 'correo']
        }]
      }],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });

    if (schedules.length > 0) {
      schedules.forEach(schedule => {
        console.log(`   📅 ${schedule.fecha} | ⏰ ${schedule.hora_inicio} - ${schedule.hora_fin} | 👤 ${schedule.empleado.usuario.nombre}`);
      });
    } else {
      console.log('   ❌ No hay horarios creados');
    }
    console.log('');

    // 6. Mostrar solicitudes de cambio
    console.log('📝 SOLICITUDES DE CAMBIO DE HORARIO:');
    const requests = await db.ScheduleRequest.findAll({
      include: [{
        model: db.Employee,
        as: 'empleado_solicitante',
        include: [{
          model: db.User,
          as: 'usuario',
          attributes: ['nombre', 'correo']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    if (requests.length > 0) {
      requests.forEach(request => {
        console.log(`   📅 ${request.fecha_solicitada} | ⏰ ${request.nueva_hora_inicio} - ${request.nueva_hora_fin} | 🏷️ ${request.estado} | 👤 ${request.empleado_solicitante.usuario.nombre}`);
      });
    } else {
      console.log('   ❌ No hay solicitudes de cambio');
    }
    console.log('');

    // 7. Estadísticas
    console.log('📊 ESTADÍSTICAS:');
    const totalUsers = await db.User.count();
    const totalEmployees = await db.Employee.count();
    const totalSchedules = await db.Schedule.count();
    const totalRequests = await db.ScheduleRequest.count();
    const pendingRequests = await db.ScheduleRequest.count({ where: { estado: 'pendiente' } });

    console.log(`   👥 Total Usuarios: ${totalUsers}`);
    console.log(`   👤 Total Empleados: ${totalEmployees}`);
    console.log(`   🕐 Total Horarios: ${totalSchedules}`);
    console.log(`   📝 Total Solicitudes: ${totalRequests}`);
    console.log(`   ⏳ Solicitudes Pendientes: ${pendingRequests}`);
    console.log('');

    // 8. Verificar relaciones
    console.log('🔗 VERIFICACIÓN DE RELACIONES:');
    
    // Verificar que cada empleado tenga un usuario
    const employeesWithoutUser = await db.Employee.findAll({
      where: { id_usuario: null }
    });
    
    if (employeesWithoutUser.length > 0) {
      console.log(`   ⚠️ ${employeesWithoutUser.length} empleados sin usuario asociado`);
    } else {
      console.log('   ✅ Todos los empleados tienen usuario asociado');
    }

    // Verificar usuarios con rol empleado que tienen registro de empleado
    const employeeUsersWithoutEmployee = await db.User.findAll({
      where: { rol: 'empleado' },
      include: [{
        model: db.Employee,
        as: 'empleado',
        required: false
      }]
    });

    const usersWithoutEmployee = employeeUsersWithoutEmployee.filter(user => !user.empleado);
    if (usersWithoutEmployee.length > 0) {
      console.log(`   ⚠️ ${usersWithoutEmployee.length} usuarios con rol 'empleado' sin registro de empleado`);
    } else {
      console.log('   ✅ Todos los usuarios con rol empleado tienen registro asociado');
    }

    console.log('\n🎉 Exploración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error al explorar la base de datos:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  viewDatabase();
}

module.exports = viewDatabase;
