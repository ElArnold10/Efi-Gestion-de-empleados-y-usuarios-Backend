const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar resultados de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR',
      details: errorDetails
    });
  }

  next();
};

// Validaciones para usuarios
const validateUserRegistration = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  
  body('correo')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail()
    .withMessage('Formato de correo inválido'),
  
  body('contraseña')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('rol')
    .optional()
    .isIn(['admin', 'empleado'])
    .withMessage('El rol debe ser admin o empleado'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('correo')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),
  
  body('contraseña')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  
  body('correo')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),
  
  body('rol')
    .optional()
    .isIn(['admin', 'empleado'])
    .withMessage('El rol debe ser admin o empleado'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('El estado debe ser un valor booleano'),
  
  handleValidationErrors
];

// Validaciones para empleados
const validateEmployeeCreation = [
  body('posicion')
    .isIn(['cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador'])
    .withMessage('La posición debe ser una de las opciones válidas'),
  
  body('fecha_contratacion')
    .isISO8601()
    .withMessage('Debe proporcionar una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha > hoy) {
        throw new Error('La fecha de contratación no puede ser futura');
      }
      return true;
    }),
  
  body('estado')
    .optional()
    .isBoolean()
    .withMessage('El estado debe ser un valor booleano'),
  
  body('id_usuario')
    .isInt({ min: 1 })
    .withMessage('El ID de usuario debe ser un número entero positivo'),
  
  handleValidationErrors
];

const validateEmployeeUpdate = [
  body('posicion')
    .optional()
    .isIn(['cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador'])
    .withMessage('La posición debe ser una de las opciones válidas'),
  
  body('fecha_contratacion')
    .optional()
    .isISO8601()
    .withMessage('Debe proporcionar una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha > hoy) {
        throw new Error('La fecha de contratación no puede ser futura');
      }
      return true;
    }),
  
  body('estado')
    .optional()
    .isBoolean()
    .withMessage('El estado debe ser un valor booleano'),
  
  handleValidationErrors
];

// Validaciones para horarios
const validateScheduleCreation = [
  body('id_empleado')
    .isInt({ min: 1 })
    .withMessage('El ID del empleado debe ser un número entero positivo'),
  
  body('fecha')
    .isISO8601()
    .withMessage('Debe proporcionar una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new Error('No se pueden crear horarios para fechas pasadas');
      }
      return true;
    }),
  
  body('hora_inicio')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de inicio debe tener formato HH:MM (24 horas)'),
  
  body('hora_fin')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de fin debe tener formato HH:MM (24 horas)')
    .custom((value, { req }) => {
      if (value <= req.body.hora_inicio) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateScheduleUpdate = [
  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('Debe proporcionar una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new Error('No se pueden actualizar horarios para fechas pasadas');
      }
      return true;
    }),
  
  body('hora_inicio')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de inicio debe tener formato HH:MM (24 horas)'),
  
  body('hora_fin')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de fin debe tener formato HH:MM (24 horas)'),
  
  handleValidationErrors
];

// Validaciones para solicitudes de cambio de horario
const validateScheduleRequestCreation = [
  body('id_empleado')
    .isInt({ min: 1 })
    .withMessage('El ID del empleado debe ser un número entero positivo'),
  
  body('fecha_solicitada')
    .isISO8601()
    .withMessage('Debe proporcionar una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new Error('No se pueden solicitar cambios para fechas pasadas');
      }
      return true;
    }),
  
  body('nueva_hora_inicio')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La nueva hora de inicio debe tener formato HH:MM (24 horas)'),
  
  body('nueva_hora_fin')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La nueva hora de fin debe tener formato HH:MM (24 horas)')
    .custom((value, { req }) => {
      if (value <= req.body.nueva_hora_inicio) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),
  
  body('motivo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres')
    .trim(),
  
  handleValidationErrors
];

const validateScheduleRequestUpdate = [
  body('estado')
    .optional()
    .isIn(['pendiente', 'aprobada', 'rechazada'])
    .withMessage('El estado debe ser pendiente, aprobada o rechazada'),
  
  body('motivo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres')
    .trim(),
  
  body('comentarios_revision')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los comentarios de revisión no pueden exceder 500 caracteres')
    .trim(),
  
  handleValidationErrors
];

// Validaciones para parámetros de URL
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
  
  handleValidationErrors
];

// Validaciones para query parameters
const validateDateQuery = [
  query('fecha')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe tener formato válido'),
  
  query('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe tener formato válido'),
  
  query('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe tener formato válido')
    .custom((value, { req }) => {
      if (req.query.fecha_inicio && value <= req.query.fecha_inicio) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateEmployeeCreation,
  validateEmployeeUpdate,
  validateScheduleCreation,
  validateScheduleUpdate,
  validateScheduleRequestCreation,
  validateScheduleRequestUpdate,
  validateIdParam,
  validateDateQuery,
  validatePagination
};
