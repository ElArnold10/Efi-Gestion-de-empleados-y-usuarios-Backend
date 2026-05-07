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
      type: DataTypes.ENUM('admin', 'empleado'),
      allowNull: false,
      defaultValue: 'empleado',
      validate: {
        isIn: {
          args: [['admin', 'empleado']],
          msg: 'El rol debe ser admin o empleado'
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
  };

  // Métodos de instancia
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.contraseña;
    return values;
  };

  return User;
};
