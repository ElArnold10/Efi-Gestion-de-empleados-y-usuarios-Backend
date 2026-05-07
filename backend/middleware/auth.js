const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware de autenticación JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['contraseña'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuario no encontrado.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.',
        error: 'USER_INACTIVE'
      });
    }

    // Agregar el usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.',
        error: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.',
        error: 'TOKEN_EXPIRED'
      });
    } else {
      console.error('Error en autenticación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor de autenticación.',
        error: 'AUTH_ERROR'
      });
    }
  }
};

// Middleware de verificación de rol
const checkRole = (roles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Usuario no autenticado.',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Convertir roles a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Permisos insuficientes.',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.rol
      });
    }

    next();
  };
};

// Middleware para verificar si es admin
const requireAdmin = checkRole('admin');

// Middleware para verificar si es empleado
const requireEmployee = checkRole('empleado');

// Middleware para verificar si es admin o empleado
const requireAuth = checkRole(['admin', 'empleado']);

// Middleware opcional: permite acceso público pero agrega info de usuario si está autenticado
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['contraseña'] }
      });

      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En caso de error con el token, continuamos sin usuario
    next();
  }
};

// Middleware para verificar si el usuario puede acceder a su propio recurso
const checkResourceOwnership = (resourceIdParam = 'id', resourceModel = null) => {
  return async (req, res, next) => {
    try {
      // Los admins pueden acceder a todo
      if (req.user.rol === 'admin') {
        return next();
      }

      // Los empleados solo pueden acceder a sus propios recursos
      const resourceId = req.params[resourceIdParam];
      
      if (resourceModel) {
        // Si se proporciona un modelo, verificamos la propiedad
        const resource = await resourceModel.findByPk(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Recurso no encontrado.',
            error: 'RESOURCE_NOT_FOUND'
          });
        }

        // Verificar si el recurso pertenece al usuario
        if (resource.id_usuario !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Acceso denegado. No puedes acceder a este recurso.',
            error: 'RESOURCE_ACCESS_DENIED'
          });
        }
      } else {
        // Si no hay modelo, verificamos directamente el ID
        if (resourceId !== req.user.id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Acceso denegado. No puedes acceder a este recurso.',
            error: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error en verificación de propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor.',
        error: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

// Middleware para limitar tasa de solicitudes (Rate Limiting)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar solicitudes antiguas
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(timestamp => timestamp > windowStart);
      requests.set(key, userRequests);
    }

    // Obtener solicitudes actuales
    const currentRequests = requests.get(key) || [];

    // Verificar límite
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Agregar solicitud actual
    currentRequests.push(now);
    requests.set(key, currentRequests);

    next();
  };
};

// Middleware para validar formato de email
const validateEmail = (req, res, next) => {
  const email = req.body.correo || req.body.email;
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de correo electrónico inválido.',
      error: 'INVALID_EMAIL_FORMAT'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  checkRole,
  requireAdmin,
  requireEmployee,
  requireAuth,
  optionalAuth,
  checkResourceOwnership,
  rateLimiter,
  validateEmail
};
