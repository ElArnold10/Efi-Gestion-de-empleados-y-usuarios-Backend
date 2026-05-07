const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    posicion: {
      type: DataTypes.ENUM('cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La posición es obligatoria'
        },
        isIn: {
          args: [['cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador']],
          msg: 'La posición debe ser una de las opciones válidas'
        }
      }
    },
    fecha_contratacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La fecha de contratación es obligatoria'
        },
        isDate: {
          msg: 'Debe proporcionar una fecha válida'
        },
        isBeforeToday(value) {
          if (new Date(value) > new Date()) {
            throw new Error('La fecha de contratación no puede ser futura');
          }
        }
      }
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        isBoolean: {
          msg: 'El estado debe ser un valor booleano'
        }
      }
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        msg: 'Este usuario ya tiene un registro de empleado'
      },
      validate: {
        notEmpty: {
          msg: 'El ID de usuario es obligatorio'
        },
        isInt: {
          msg: 'El ID de usuario debe ser un número entero'
        }
      }
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
    tableName: 'empleados',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['id_usuario']
      },
      {
        fields: ['posicion']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_contratacion']
      }
    ]
  });

  // Asociaciones
  Employee.associate = (models) => {
    // Relación uno a uno con User
    Employee.belongsTo(models.User, {
      foreignKey: 'id_usuario',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación uno a muchos con Schedule
    Employee.hasMany(models.Schedule, {
      foreignKey: 'id_empleado',
      as: 'horarios',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación uno a muchos con ScheduleRequest
    Employee.hasMany(models.ScheduleRequest, {
      foreignKey: 'id_empleado',
      as: 'solicitudes_horario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Métodos de instancia
  Employee.prototype.getAntiguedad = function() {
    const fechaContratacion = new Date(this.fecha_contratacion);
    const hoy = new Date();
    const diferencia = hoy - fechaContratacion;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const años = Math.floor(dias / 365);
    const meses = Math.floor((dias % 365) / 30);
    
    return { años, meses, dias: dias % 30 };
  };

  Employee.prototype.getHorariosActuales = function() {
    const hoy = new Date().toISOString().split('T')[0];
    return this.getHorarios({
      where: {
        fecha: {
          [sequelize.Sequelize.Op.gte]: hoy
        }
      },
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });
  };

  return Employee;
};
