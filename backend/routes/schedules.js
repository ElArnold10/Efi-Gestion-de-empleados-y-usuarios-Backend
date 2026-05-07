const { Employee, Schedule } = require('../models');

// Obtener todos los horarios
const getSchedules = async (req, res) => {
  try {
    const { 
      id_empleado, 
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
    
    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        [require('../models').Sequelize.Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      where.fecha = {
        [require('../models').Sequelize.Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      where.fecha = {
        [require('../models').Sequelize.Op.lte]: fecha_fin
      };
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const schedules = await Schedule.findAndCountAll({
      where,
      include: [{
        model: Employee,
        as: 'empleado',
        include: [{
          model: require('../models').User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        schedules: schedules.rows,
        pagination: {
          total: schedules.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(schedules.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios',
      error: 'GET_SCHEDULES_ERROR'
    });
  }
};

// Crear horario (solo admin)
const createSchedule = async (req, res) => {
  try {
    const { id_empleado, fecha, hora_inicio, hora_fin } = req.body;

    // Verificar si el empleado existe
    const employee = await Employee.findByPk(id_empleado);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Verificar si ya existe un horario para ese empleado en esa fecha
    const existingSchedule = await Schedule.findOne({
      where: {
        id_empleado,
        fecha
      }
    });

    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message: 'El empleado ya tiene un horario asignado para esa fecha',
        error: 'SCHEDULE_ALREADY_EXISTS'
      });
    }

    // Crear horario
    const schedule = await Schedule.create({
      id_empleado,
      fecha,
      hora_inicio,
      hora_fin
    });

    // Obtener horario creado con su empleado
    const createdSchedule = await Schedule.findByPk(schedule.id, {
      include: [{
        model: Employee,
        as: 'empleado',
        include: [{
          model: require('../models').User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Horario creado exitosamente',
      data: { schedule: createdSchedule }
    });
  } catch (error) {
    console.error('Error creando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear horario',
      error: 'CREATE_SCHEDULE_ERROR'
    });
  }
};

// Obtener horario por ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id, {
      include: [{
        model: Employee,
        as: 'empleado',
        include: [{
          model: require('../models').User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado',
        error: 'SCHEDULE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Error obteniendo horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horario',
      error: 'GET_SCHEDULE_ERROR'
    });
  }
};

// Actualizar horario (solo admin)
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_empleado, fecha, hora_inicio, hora_fin } = req.body;

    // Verificar si el horario existe
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado',
        error: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Si se actualiza el empleado, verificar que exista
    if (id_empleado && id_empleado !== schedule.id_empleado) {
      const employee = await Employee.findByPk(id_empleado);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado',
          error: 'EMPLOYEE_NOT_FOUND'
        });
      }

      // Verificar si ya existe un horario para ese empleado en esa fecha
      const existingSchedule = await Schedule.findOne({
        where: {
          id_empleado,
          fecha,
          id: { [require('../models').Sequelize.Op.ne]: id }
        }
      });

      if (existingSchedule) {
        return res.status(409).json({
          success: false,
          message: 'El empleado ya tiene un horario asignado para esa fecha',
          error: 'SCHEDULE_ALREADY_EXISTS'
        });
      }
    }

    // Actualizar horario
    const [updatedRowsCount] = await Schedule.update(
      { id_empleado, fecha, hora_inicio, hora_fin },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado',
        error: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Obtener horario actualizado
    const updatedSchedule = await Schedule.findByPk(id, {
      include: [{
        model: Employee,
        as: 'empleado',
        include: [{
          model: require('../models').User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }]
    });

    res.json({
      success: true,
      message: 'Horario actualizado exitosamente',
      data: { schedule: updatedSchedule }
    });
  } catch (error) {
    console.error('Error actualizando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar horario',
      error: 'UPDATE_SCHEDULE_ERROR'
    });
  }
};

// Eliminar horario (solo admin)
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el horario existe
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado',
        error: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Eliminar horario
    await Schedule.destroy({ where: { id } });

    res.json({
      success: true,
      message: 'Horario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar horario',
      error: 'DELETE_SCHEDULE_ERROR'
    });
  }
};

// Obtener horarios del empleado logueado
const getMySchedules = async (req, res) => {
  try {
    const { 
      fecha_inicio, 
      fecha_fin, 
      page = 1, 
      limit = 50 
    } = req.query;

    // Obtener el ID del empleado logueado
    const userId = req.user.id;
    
    // Buscar el registro del empleado
    const employee = await Employee.findOne({ 
      where: { id_usuario: userId } 
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró registro de empleado para este usuario',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Construir filtros
    const where = { id_empleado: employee.id };
    
    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        [require('../models').Sequelize.Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      where.fecha = {
        [require('../models').Sequelize.Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      where.fecha = {
        [require('../models').Sequelize.Op.lte]: fecha_fin
      };
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const schedules = await Schedule.findAndCountAll({
      where,
      include: [{
        model: Employee,
        as: 'empleado',
        include: [{
          model: require('../models').User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }]
      }],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        schedules: schedules.rows,
        pagination: {
          total: schedules.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(schedules.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error en getMySchedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios del empleado',
      error: 'GET_MY_SCHEDULES_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMySchedules
};
