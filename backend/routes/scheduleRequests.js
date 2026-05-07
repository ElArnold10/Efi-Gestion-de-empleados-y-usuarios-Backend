const { Employee, User, ScheduleRequest } = require('../models');

// Obtener todas las solicitudes de cambio de horario
const getScheduleRequests = async (req, res) => {
  try {
    const { 
      id_empleado, 
      estado, 
      fecha_inicio, 
      fecha_fin,
      page = 1, 
      limit = 50 
    } = req.query;

    // Construir filtros
    const where = {};
    
    if (id_empleado) {
      where.id_empleado = id_empleado;
    }
    
    if (estado) {
      where.estado = estado;
    }
    
    if (fecha_inicio && fecha_fin) {
      where.fecha_solicitada = {
        [require('../models').Sequelize.Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      where.fecha_solicitada = {
        [require('../models').Sequelize.Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      where.fecha_solicitada = {
        [require('../models').Sequelize.Op.lte]: fecha_fin
      };
    }

    // Si no es admin, solo mostrar solicitudes del propio empleado
    if (req.user.rol !== 'admin') {
      const employee = await Employee.findOne({ where: { id_usuario: req.user.id } });
      if (employee) {
        where.id_empleado = employee.id;
      } else {
        return res.json({
          success: true,
          data: {
            requests: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          }
        });
      }
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ScheduleRequest.findAndCountAll({
      where,
      include: [{
        model: Employee,
        as: 'empleado_solicitante',
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }, {
        model: User,
        as: 'revisor',
        attributes: ['id', 'nombre', 'correo'],
        required: false
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        requests: requests.rows,
        pagination: {
          total: requests.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(requests.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes de cambio',
      error: 'GET_SCHEDULE_REQUESTS_ERROR'
    });
  }
};

// Crear solicitud de cambio (empleado)
const createScheduleRequest = async (req, res) => {
  try {
    const { 
      fecha_solicitada, 
      hora_actual_inicio,
      hora_actual_fin,
      nueva_hora_inicio, 
      nueva_hora_fin, 
      motivo 
    } = req.body;

    // Obtener el empleado logueado
    const employee = await Employee.findOne({ 
      where: { id_usuario: req.user.id } 
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para el usuario actual',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Verificar si ya existe una solicitud pendiente para ese empleado en esa fecha
    const existingRequest = await ScheduleRequest.findOne({
      where: {
        id_empleado: employee.id,
        fecha_solicitada,
        estado: 'pendiente'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una solicitud pendiente para este empleado en esa fecha',
        error: 'PENDING_REQUEST_ALREADY_EXISTS'
      });
    }

    // Crear solicitud
    const request = await ScheduleRequest.create({
      id_empleado: employee.id,
      fecha_solicitada,
      hora_actual_inicio,
      hora_actual_fin,
      nueva_hora_inicio,
      nueva_hora_fin,
      motivo
    });

    // Obtener solicitud creada con sus relaciones
    const createdRequest = await ScheduleRequest.findByPk(request.id, {
      include: [{
        model: Employee,
        as: 'empleado_solicitante',
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de cambio creada exitosamente',
      data: { request: createdRequest }
    });
  } catch (error) {
    console.error('Error creando solicitud de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud de cambio',
      error: 'CREATE_SCHEDULE_REQUEST_ERROR'
    });
  }
};

// Obtener solicitud de cambio por ID
const getScheduleRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ScheduleRequest.findByPk(id, {
      include: [{
        model: Employee,
        as: 'empleado_solicitante',
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }, {
        model: User,
        as: 'revisor',
        attributes: ['id', 'nombre', 'correo'],
        required: false
      }]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de cambio no encontrada',
        error: 'SCHEDULE_REQUEST_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.rol !== 'admin' && request.empleado_solicitante.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta solicitud',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Error obteniendo solicitud de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud de cambio',
      error: 'GET_SCHEDULE_REQUEST_ERROR'
    });
  }
};

// Aprobar o rechazar solicitud de cambio (solo admin)
const approveOrRejectScheduleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comentarios_revision } = req.body; // action: 'approve' o 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Acción inválida. Debe ser "approve" o "reject"',
        error: 'INVALID_ACTION'
      });
    }

    // Verificar si la solicitud existe
    const request = await ScheduleRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de cambio no encontrada',
        error: 'SCHEDULE_REQUEST_NOT_FOUND'
      });
    }

    // Procesar solicitud según acción
    if (action === 'approve') {
      // Actualizar el horario original con los nuevos horarios
      const { Schedule } = require('../models');
      
      // Buscar el horario actual del empleado que coincide con los horarios actuales de la solicitud
      let scheduleToUpdate = null;
      
      if (request.hora_actual_inicio && request.hora_actual_fin) {
        // Buscar el horario actual del empleado con los mismos horarios
        scheduleToUpdate = await Schedule.findOne({
          where: {
            id_empleado: request.id_empleado,
            hora_inicio: request.hora_actual_inicio.substring(0, 5),
            hora_fin: request.hora_actual_fin.substring(0, 5)
          }
        });
      }
      
      if (scheduleToUpdate) {
        // Actualizar el horario existente con la nueva fecha y horarios
        await scheduleToUpdate.update({
          fecha: request.fecha_solicitada,
          hora_inicio: request.nueva_hora_inicio ? request.nueva_hora_inicio.substring(0, 5) : null,
          hora_fin: request.nueva_hora_fin ? request.nueva_hora_fin.substring(0, 5) : null
        });
        console.log('🔄 Horario existente actualizado con nueva fecha y horarios');
      } else {
        // Si no se encuentra el horario actual, crear uno nuevo para la fecha solicitada
        await Schedule.create({
          id_empleado: request.id_empleado,
          fecha: request.fecha_solicitada,
          hora_inicio: request.nueva_hora_inicio ? request.nueva_hora_inicio.substring(0, 5) : null,
          hora_fin: request.nueva_hora_fin ? request.nueva_hora_fin.substring(0, 5) : null
        });
        console.log('� Nuevo horario creado (no se encontró horario actual)');
      }

      // Marcar la solicitud como aprobada
      await request.aprobar(req.user.id, comentarios_revision);
    } else {
      await request.rechazar(req.user.id, comentarios_revision);
    }

    // Obtener solicitud actualizada
    const updatedRequest = await ScheduleRequest.findByPk(id, {
      include: [{
        model: Employee,
        as: 'empleado_solicitante',
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }, {
        model: User,
        as: 'revisor',
        attributes: ['id', 'nombre', 'correo']
      }]
    });

    const message = action === 'approve' 
      ? 'Solicitud de cambio aprobada exitosamente'
      : 'Solicitud de cambio rechazada exitosamente';

    res.json({
      success: true,
      message,
      data: { request: updatedRequest }
    });
  } catch (error) {
    console.error('Error procesando solicitud de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar solicitud de cambio',
      error: 'PROCESS_SCHEDULE_REQUEST_ERROR'
    });
  }
};


// Eliminar solicitud de cambio (solo admin)
const deleteScheduleRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la solicitud existe
    const request = await ScheduleRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de cambio no encontrada',
        error: 'SCHEDULE_REQUEST_NOT_FOUND'
      });
    }

    // Eliminar solicitud
    await ScheduleRequest.destroy({ where: { id } });

    res.json({
      success: true,
      message: 'Solicitud de cambio eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando solicitud de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar solicitud de cambio',
      error: 'DELETE_SCHEDULE_REQUEST_ERROR'
    });
  }
};

module.exports = {
  getScheduleRequests,
  createScheduleRequest,
  approveOrRejectScheduleRequest
};
