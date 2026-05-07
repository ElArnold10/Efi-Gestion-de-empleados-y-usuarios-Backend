const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El título es obligatorio'
        },
        len: {
          args: [1, 200],
          msg: 'El título debe tener entre 1 y 200 caracteres'
        }
      }
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El mensaje es obligatorio'
        }
      }
    },
    tipo: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'employment_request', 'employment_approved', 'employment_rejected'),
      allowNull: false,
      defaultValue: 'info',
      validate: {
        isIn: {
          args: [['info', 'success', 'warning', 'error', 'employment_request', 'employment_approved', 'employment_rejected']],
          msg: 'Tipo de notificación no válido'
        }
      }
    },
    leida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    id_referencia: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del objeto relacionado (ej: id_solicitud_empleo)'
    },
    tipo_referencia: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo del objeto relacionado (ej: employee_request)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['id_usuario']
      },
      {
        fields: ['leida']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['id_usuario', 'leida']
      }
    ]
  });

  // Asociaciones
  Notification.associate = (models) => {
    // Relación con User (muchas a uno)
    Notification.belongsTo(models.User, {
      foreignKey: 'id_usuario',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Notification;
};
