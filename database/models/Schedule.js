const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_empleado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El ID del empleado es obligatorio'
        },
        isInt: {
          msg: 'El ID del empleado debe ser un número entero'
        }
      }
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La fecha es obligatoria'
        },
        isDate: {
          msg: 'Debe proporcionar una fecha válida'
        },
        isNotPast(value) {
          if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
            throw new Error('No se pueden crear horarios para fechas pasadas');
          }
        }
      }
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La hora de inicio es obligatoria'
        },
        is: {
          args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: 'La hora de inicio debe tener formato HH:MM (24 horas)'
        }
      }
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La hora de fin es obligatoria'
        },
        is: {
          args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: 'La hora de fin debe tener formato HH:MM (24 horas)'
        },
        isAfterInicio(value) {
          if (value <= this.hora_inicio) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio');
          }
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
    tableName: 'schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['id_empleado']
      },
      {
        fields: ['fecha']
      },
      {
        fields: ['id_empleado', 'fecha']
      },
      {
        fields: ['fecha', 'hora_inicio']
      }
    ]
  });

  // Asociaciones
  Schedule.associate = (models) => {
    // Relación muchos a uno con Employee
    Schedule.belongsTo(models.Employee, {
      foreignKey: 'id_empleado',
      as: 'empleado',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Métodos de instancia
  Schedule.prototype.getDuracion = function() {
    const inicio = new Date(`2000-01-01T${this.hora_inicio}`);
    const fin = new Date(`2000-01-01T${this.hora_fin}`);
    const diferencia = fin - inicio;
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return { horas, minutos };
  };

  Schedule.prototype.getDiaSemana = function() {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const fecha = new Date(this.fecha);
    return dias[fecha.getDay()];
  };

  // Scopes para consultas comunes
  Schedule.addScope('delDia', (fecha) => ({
    where: {
      fecha: fecha
    }
  }));

  Schedule.addScope('deEmpleado', (empleadoId) => ({
    where: {
      id_empleado: empleadoId
    }
  }));

  Schedule.addScope('futuros', () => ({
    where: {
      fecha: {
        [sequelize.Sequelize.Op.gte]: new Date().toISOString().split('T')[0]
      }
    }
  }));

  return Schedule;
};
