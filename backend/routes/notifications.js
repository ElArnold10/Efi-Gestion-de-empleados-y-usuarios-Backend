const { Notification, User } = require('../models');

// Obtener todas las notificaciones del usuario autenticado
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, unread_only = false } = req.query;
    
    const whereClause = { id_usuario: userId };
    if (unread_only === 'true') {
      whereClause.leida = false;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calcular conteo de no leídas
    const unreadCount = await Notification.count({
      where: { 
        id_usuario: userId, 
        leida: false 
      }
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          total: notifications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(notifications.count / parseInt(limit))
        },
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: 'GET_NOTIFICATIONS_ERROR'
    });
  }
};

// Obtener notificaciones para administradores (solicitudes de empleo)
const getAdminNotifications = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de administrador.',
        error: 'ACCESS_DENIED'
      });
    }

    const { page = 1, limit = 50 } = req.query;

    // Obtener solo notificaciones de tipo employment_request
    const notifications = await Notification.findAndCountAll({
      where: { 
        tipo: 'employment_request'
      },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calcular conteos de solicitudes
    const pendingCount = await Notification.count({
      where: { 
        tipo: 'employment_request',
        leida: false
      }
    });

    // Contar notificaciones de aprobación
    const approvedCount = await Notification.count({
      where: { 
        tipo: 'employment_approved'
      }
    });

    // Contar notificaciones de rechazo
    const rejectedCount = await Notification.count({
      where: { 
        tipo: 'employment_rejected'
      }
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          total: notifications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(notifications.count / parseInt(limit))
        },
        pending_count: pendingCount,
        approved_count: approvedCount,
        rejected_count: rejectedCount
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones de administrador',
      error: 'GET_ADMIN_NOTIFICATIONS_ERROR'
    });
  }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { 
        id, 
        id_usuario: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    await notification.update({ leida: true });

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: { notification }
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
      error: 'MARK_AS_READ_ERROR'
    });
  }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { leida: true },
      { 
        where: { 
          id_usuario: userId,
          leida: false
        } 
      }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones como leídas',
      error: 'MARK_ALL_AS_READ_ERROR'
    });
  }
};

// Eliminar notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { 
        id, 
        id_usuario: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
      error: 'DELETE_NOTIFICATION_ERROR'
    });
  }
};

// Crear notificación (función interna)
const createNotification = async (userId, title, message, type = 'info', referenceId = null, referenceType = null, transaction = null) => {
  try {
    const notification = await Notification.create({
      id_usuario: userId,
      titulo: title,
      mensaje: message,
      tipo: type,
      id_referencia: referenceId,
      tipo_referencia: referenceType
    }, transaction ? { transaction } : {});

    return notification;
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Crear notificación para todos los administradores
const createAdminNotification = async (title, message, type = 'info', referenceId = null, referenceType = null) => {
  try {
    const admins = await User.findAll({
      where: { rol: 'admin', is_active: true },
      attributes: ['id']
    });

    const notifications = await Promise.all(
      admins.map(admin => 
        createNotification(admin.id, title, message, type, referenceId, referenceType)
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error creando notificaciones de admin:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createAdminNotification
};
