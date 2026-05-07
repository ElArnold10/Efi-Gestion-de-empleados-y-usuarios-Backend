const { User } = require('../models');

// Obtener todos los usuarios (solo admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['contraseña'] },
      include: [{
        model: require('../models').Employee,
        as: 'empleado',
        attributes: ['id', 'posicion', 'fecha_contratacion', 'estado']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: 'GET_USERS_ERROR'
    });
  }
};

// Obtener usuario por ID (solo admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['contraseña'] },
      include: [{
        model: require('../models').Employee,
        as: 'empleado',
        attributes: ['id', 'posicion', 'fecha_contratacion', 'estado']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: 'GET_USER_ERROR'
    });
  }
};

// Actualizar usuario (solo admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, rol, is_active } = req.body;

    // Verificar si el usuario existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Si se actualiza el correo, verificar que no exista
    if (correo && correo !== user.correo) {
      const existingUser = await User.findOne({ 
        where: { 
          correo,
          id: { [require('../models').Sequelize.Op.ne]: id }
        } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }

    // Actualizar usuario
    const [updatedRowsCount] = await User.update(
      { nombre, correo, rol, is_active },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Obtener usuario actualizado
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['contraseña'] },
      include: [{
        model: require('../models').Employee,
        as: 'empleado',
        attributes: ['id', 'posicion', 'fecha_contratacion', 'estado']
      }]
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: 'UPDATE_USER_ERROR'
    });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // No permitir eliminar al usuario autenticado si es admin
    if (req.user.id === parseInt(id) && req.user.rol === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta de administrador',
        error: 'CANNOT_DELETE_SELF_ADMIN'
      });
    }

    // Eliminar usuario
    await User.destroy({ where: { id } });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: 'DELETE_USER_ERROR'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
