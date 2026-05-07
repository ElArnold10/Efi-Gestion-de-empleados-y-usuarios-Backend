require('dotenv').config();
const db = require('./models');
const express = require('express');

const app = express();
const PORT = 3002;

app.use(express.static('public'));
app.use(express.json());

// Ruta principal
app.get('/', async (req, res) => {
  try {
    const stats = {
      users: await db.User.count(),
      employees: await db.Employee.count(),
      schedules: await db.Schedule.count(),
      requests: await db.ScheduleRequest.count()
    };

    const users = await db.User.findAll({ 
      attributes: ['id', 'nombre', 'correo', 'rol', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    const employees = await db.Employee.findAll({
      include: [{ model: db.User, as: 'usuario', attributes: ['nombre', 'correo'] }],
      order: [['created_at', 'DESC']]
    });

    const schedules = await db.Schedule.findAll({
      include: [{
        model: db.Employee,
        as: 'empleado',
        include: [{ model: db.User, as: 'usuario', attributes: ['nombre'] }]
      }],
      limit: 20,
      order: [['fecha', 'DESC']]
    });

    const requests = await db.ScheduleRequest.findAll({
      include: [{
        model: db.Employee,
        as: 'empleado_solicitante',
        include: [{ model: db.User, as: 'usuario', attributes: ['nombre'] }]
      }],
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>📊 Sistema de Horarios - Vista de Base de Datos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
          .stat-number { font-size: 2em; font-weight: bold; color: #2563eb; }
          .section { background: white; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .section h2 { background: #2563eb; color: white; padding: 15px; margin: 0; border-radius: 8px 8px 0 0; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .table th { background: #f9fafb; font-weight: 600; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.875em; }
          .badge-admin { background: #dc2626; color: white; }
          .badge-empleado { background: #16a34a; color: white; }
          .badge-active { background: #16a34a; color: white; }
          .badge-inactive { background: #6b7280; color: white; }
          .badge-pendiente { background: #f59e0b; color: white; }
          .badge-aprobada { background: #16a34a; color: white; }
          .badge-rechazada { background: #dc2626; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Sistema de Gestión de Empleados y Horarios</h1>
          <p>Vista en tiempo real de la base de datos</p>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${stats.users}</div>
              <div>👥 Usuarios</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.employees}</div>
              <div>👤 Empleados</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.schedules}</div>
              <div>🕐 Horarios</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.requests}</div>
              <div>📝 Solicitudes</div>
            </div>
          </div>

          <div class="section">
            <h2>👥 Usuarios</h2>
            <table class="table">
              <tr>
                <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creado</th>
              </tr>
              ${users.map(u => `
                <tr>
                  <td>${u.id}</td>
                  <td>${u.nombre}</td>
                  <td>${u.correo}</td>
                  <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
                  <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>${new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>👤 Empleados</h2>
            <table class="table">
              <tr>
                <th>ID</th><th>Nombre</th><th>Correo</th><th>Posición</th><th>Fecha Contratación</th><th>Estado</th>
              </tr>
              ${employees.map(e => `
                <tr>
                  <td>${e.id}</td>
                  <td>${e.usuario.nombre}</td>
                  <td>${e.usuario.correo}</td>
                  <td>${e.posicion}</td>
                  <td>${new Date(e.fecha_contratacion).toLocaleDateString()}</td>
                  <td><span class="badge badge-${e.estado ? 'active' : 'inactive'}">${e.estado ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>🕐 Horarios Recientes</h2>
            <table class="table">
              <tr>
                <th>ID</th><th>Fecha</th><th>Horario</th><th>Empleado</th><th>Posición</th>
              </tr>
              ${schedules.map(s => `
                <tr>
                  <td>${s.id}</td>
                  <td>${new Date(s.fecha).toLocaleDateString()}</td>
                  <td>${s.hora_inicio} - ${s.hora_fin}</td>
                  <td>${s.empleado.usuario.nombre}</td>
                  <td>${s.empleado.posicion}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>📝 Solicitudes Recientes</h2>
            <table class="table">
              <tr>
                <th>ID</th><th>Fecha Solicitada</th><th>Nuevo Horario</th><th>Empleado</th><th>Estado</th>
              </tr>
              ${requests.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td>${new Date(r.fecha_solicitada).toLocaleDateString()}</td>
                  <td>${r.nueva_hora_inicio} - ${r.nueva_hora_fin}</td>
                  <td>${r.empleado_solicitante.usuario.nombre}</td>
                  <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
        
        <script>
          // Auto-refresh cada 30 segundos
          setTimeout(() => location.reload(), 30000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Vista web disponible en: http://localhost:${PORT}`);
  console.log('🔄 Se actualiza automáticamente cada 30 segundos');
});
