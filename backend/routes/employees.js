const { User, Employee, EmployeeRequest } = require('../models');

// Obtener todos los empleados
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo', 'rol', 'is_active']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { employees }
    });
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleados',
      error: 'GET_EMPLOYEES_ERROR'
    });
  }
};

// Crear empleado (solo admin)
const createEmployee = async (req, res) => {
  try {
    const { posicion, fecha_contratacion, estado = true, id_usuario } = req.body;

    // Verificar si el usuario existe
    const user = await User.findByPk(id_usuario);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar si el usuario ya tiene un registro de empleado
    const existingEmployee = await Employee.findOne({ where: { id_usuario } });
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Este usuario ya tiene un registro de empleado',
        error: 'EMPLOYEE_ALREADY_EXISTS'
      });
    }

    // Crear empleado
    const employee = await Employee.create({
      posicion,
      fecha_contratacion,
      estado,
      id_usuario
    });

    // Obtener empleado creado con su usuario
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo', 'rol', 'is_active']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: { employee: createdEmployee }
    });
  } catch (error) {
    console.error('Error creando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear empleado',
      error: 'CREATE_EMPLOYEE_ERROR'
    });
  }
};

// Obtener empleado por ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo', 'rol', 'is_active']
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    console.error('Error obteniendo empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleado',
      error: 'GET_EMPLOYEE_ERROR'
    });
  }
};

// Actualizar empleado (solo admin)
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { posicion, fecha_contratacion, estado, id_usuario } = req.body;

    // Verificar si el empleado existe
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Si se actualiza el usuario, verificar que exista
    if (id_usuario && id_usuario !== employee.id_usuario) {
      const user = await User.findByPk(id_usuario);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          error: 'USER_NOT_FOUND'
        });
      }

      // Verificar que el nuevo usuario no tenga ya un registro de empleado
      const existingEmployee = await Employee.findOne({ 
        where: { 
          id_usuario,
          id: { [require('../models').Sequelize.Op.ne]: id }
        } 
      });
      
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: 'Este usuario ya tiene un registro de empleado',
          error: 'EMPLOYEE_ALREADY_EXISTS'
        });
      }
    }

    // Actualizar empleado
    const [updatedRowsCount] = await Employee.update(
      { posicion, fecha_contratacion, estado, id_usuario },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Obtener empleado actualizado
    const updatedEmployee = await Employee.findByPk(id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo', 'rol', 'is_active']
      }]
    });

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: { employee: updatedEmployee }
    });
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar empleado',
      error: 'UPDATE_EMPLOYEE_ERROR'
    });
  }
};

// Eliminar empleado (solo admin)
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el empleado existe
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Eliminar empleado
    await Employee.destroy({ where: { id } });

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar empleado',
      error: 'DELETE_EMPLOYEE_ERROR'
    });
  }
};

// Obtener solicitudes de empleados (solo admin)
const getEmployeeRequests = async (req, res) => {
  try {
    // Primero intentar sin include para ver si funciona
    const requests = await EmployeeRequest.findAll({
      order: [['fecha_solicitud', 'DESC']]
    });

    console.log('Solicitudes encontradas (sin include):', requests.length);

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes de empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes de empleados',
      error: 'GET_EMPLOYEE_REQUESTS_ERROR'
    });
  }
};

// Crear solicitud de empleado
const createEmployeeRequest = async (req, res) => {
  try {
    const { posicion_deseada, mensaje = '' } = req.body;
    const userId = req.user.id;

    // Verificar si el usuario ya tiene una solicitud pendiente
    const existingRequest = await EmployeeRequest.findOne({
      where: { 
        id_usuario: userId,
        estado: 'pendiente'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes una solicitud de empleo pendiente de revisión',
        error: 'PENDING_REQUEST_EXISTS'
      });
    }

    // Verificar si el usuario ya es empleado
    const user = await User.findByPk(userId);
    if (user && user.rol === 'empleado') {
      return res.status(400).json({
        success: false,
        message: 'Ya eres empleado del sistema',
        error: 'ALREADY_EMPLOYEE'
      });
    }

    // Crear solicitud
    const employeeRequest = await EmployeeRequest.create({
      id_usuario: userId,
      posicion_deseada,
      mensaje,
      estado: 'pendiente'
    });

    // Obtener solicitud creada con relaciones
    const createdRequest = await EmployeeRequest.findByPk(employeeRequest.id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'rol']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de empleo creada exitosamente',
      data: { request: createdRequest }
    });
  } catch (error) {
    console.error('Error creando solicitud de empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud de empleado',
      error: 'CREATE_EMPLOYEE_REQUEST_ERROR'
    });
  }
};

// Aprobar solicitud de empleado (solo admin)
const approveEmployeeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios_admin } = req.body;
    const adminId = req.user.id;

    // Buscar la solicitud
    const employeeRequest = await EmployeeRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'rol']
        }
      ]
    });

    if (!employeeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
        error: 'REQUEST_NOT_FOUND'
      });
    }

    if (employeeRequest.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud ya ha sido procesada',
        error: 'REQUEST_ALREADY_PROCESSED'
      });
    }

    // Aprobar la solicitud usando el método del modelo
    await employeeRequest.aprobar(adminId, comentarios_admin);

    // Obtener la solicitud actualizada
    const updatedRequest = await EmployeeRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'rol']
        },
        {
          model: User,
          as: 'revisor',
          attributes: ['id', 'nombre', 'correo']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Solicitud aprobada exitosamente. El usuario ahora es empleado.',
      data: { request: updatedRequest }
    });
  } catch (error) {
    console.error('Error aprobando solicitud de empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud de empleado',
      error: 'APPROVE_EMPLOYEE_REQUEST_ERROR'
    });
  }
};

// Rechazar solicitud de empleado (solo admin)
const rejectEmployeeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios_admin } = req.body;
    const adminId = req.user.id;

    // Buscar la solicitud
    const employeeRequest = await EmployeeRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'rol']
        }
      ]
    });

    if (!employeeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
        error: 'REQUEST_NOT_FOUND'
      });
    }

    if (employeeRequest.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud ya ha sido procesada',
        error: 'REQUEST_ALREADY_PROCESSED'
      });
    }

    // Rechazar la solicitud usando el método del modelo
    await employeeRequest.rechazar(adminId, comentarios_admin);

    // Obtener la solicitud actualizada
    const updatedRequest = await EmployeeRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'rol']
        },
        {
          model: User,
          as: 'revisor',
          attributes: ['id', 'nombre', 'correo']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
      data: { request: updatedRequest }
    });
  } catch (error) {
    console.error('Error rechazando solicitud de empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud de empleado',
      error: 'REJECT_EMPLOYEE_REQUEST_ERROR'
    });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
