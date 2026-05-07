const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir orígenes en desarrollo
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002'
    ];

    // En producción, verificar origin
    if (process.env.NODE_ENV === 'production') {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    } else {
      // En desarrollo, permitir todo
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 solicitudes en desarrollo, 100 en producción
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Intenta más tarde.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 1000, // 1000 intentos en desarrollo, 5 en producción
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta más tarde.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar solicitudes exitosas
});

// Rate limiting para creación de recursos
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // límite de 10 creaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas creaciones. Intenta más tarde.',
    error: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuración de Helmet para seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000"], // Permitir conexiones desde el frontend
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para sanitizar entradas
const sanitizeInput = (req, res, next) => {
  // Función para limpiar strings
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Eliminar tags básicos
      .replace(/javascript:/gi, '') // Eliminar protocolos javascript
      .replace(/on\w+=/gi, ''); // Eliminar event handlers
  };

  // Función para limpiar objetos recursivamente
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  };

  // Sanitizar body, params y query
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Middleware para validar tamaño de archivos
const validateFileSize = (maxSize = 5 * 1024 * 1024) => { // 5MB por defecto
  return (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Archivo demasiado grande.',
        error: 'FILE_TOO_LARGE',
        maxSize: maxSize
      });
    }
    next();
  };
};

// Middleware para validar tipos de archivos
const validateFileType = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req, res, next) => {
    if (req.file && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(415).json({
        success: false,
        message: 'Tipo de archivo no permitido.',
        error: 'UNSUPPORTED_FILE_TYPE',
        allowedTypes
      });
    }
    next();
  };
};

// Middleware para registrar solicitudes (logging)
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Registrar solicitud
  console.log(`📥 ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Capturar respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Color según status code
    let statusColor = '\x1b[32m'; // Verde por defecto
    if (statusCode >= 400) statusColor = '\x1b[31m'; // Rojo para errores
    else if (statusCode >= 300) statusColor = '\x1b[33m'; // Amarillo para redirects
    
    console.log(`📤 ${statusColor}${statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${duration}ms`);
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para manejar errores globales
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error no manejado:', err);

  // Errores de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR',
      details: errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado',
      error: 'DUPLICATE_ENTRY',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida',
      error: 'FOREIGN_KEY_CONSTRAINT'
    });
  }

  // Error por defecto
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para verificar conexión a base de datos
const checkDatabaseConnection = (req, res, next) => {
  try {
    const { sequelize } = require('../models');
    
    if (!sequelize) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de base de datos no disponible',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando conexión a DB:', error);
    return res.status(503).json({
      success: false,
      message: 'Error en el servicio de base de datos',
      error: 'DATABASE_ERROR'
    });
  }
};

module.exports = {
  corsOptions,
  generalLimiter,
  authLimiter,
  createLimiter,
  helmetConfig,
  sanitizeInput,
  validateFileSize,
  validateFileType,
  requestLogger,
  errorHandler,
  checkDatabaseConnection
};
