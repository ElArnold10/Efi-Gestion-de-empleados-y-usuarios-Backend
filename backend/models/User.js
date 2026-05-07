const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre es obligatorio'
        },
        len: {
          args: [2, 100],
          msg: 'El nombre debe tener entre 2 y 100 caracteres'
        }
      }
    },
    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        msg: 'Este correo electrónico ya está registrado'
      },
      validate: {
        isEmail: {
          msg: 'Debe proporcionar un correo electrónico válido'
        },
        notEmpty: {
          msg: 'El correo es obligatorio'
        }
      }
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La contraseña es obligatoria'
        },
        len: {
          args: [6, 255],
          msg: 'La contraseña debe tener al menos 6 caracteres'
        }
      }
    },
    rol: {
      type: DataTypes.ENUM('admin', 'empleado', 'solicitante'),
      allowNull: false,
      defaultValue: 'solicitante',
      validate: {
        isIn: {
          args: [['admin', 'empleado', 'solicitante']],
          msg: 'El rol debe ser admin, empleado o solicitante'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['correo']
      },
      {
        fields: ['rol']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['reset_token']
      },
      {
        fields: ['reset_token_expiry']
      }
    ]
  });

  // Asociaciones
  User.associate = (models) => {
    // Relación uno a uno con Employee
    User.hasOne(models.Employee, {
      foreignKey: 'id_usuario',
      as: 'empleado',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación uno a muchos con EmployeeRequest (como solicitante)
    User.hasMany(models.EmployeeRequest, {
      foreignKey: 'id_usuario',
      as: 'solicitudes_empleo',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación uno a muchos con EmployeeRequest (como revisor)
    User.hasMany(models.EmployeeRequest, {
      foreignKey: 'revisado_por',
      as: 'solicitudes_revisadas',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Relación uno a muchos con Notification
    User.hasMany(models.Notification, {
      foreignKey: 'id_usuario',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Métodos de instancia
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.contraseña;
    return values;
  };

  return User;
};
