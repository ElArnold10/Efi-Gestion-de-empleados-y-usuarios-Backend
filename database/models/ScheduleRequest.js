const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduleRequest = sequelize.define('ScheduleRequest', {
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
    fecha_solicitada: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La fecha solicitada es obligatoria'
        },
        isDate: {
          msg: 'Debe proporcionar una fecha válida'
        },
        isNotPast(value) {
          if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
            throw new Error('No se pueden solicitar cambios para fechas pasadas');
          }
        }
      }
    },
    nueva_hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La nueva hora de inicio es obligatoria'
        },
        is: {
          args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: 'La hora de inicio debe tener formato HH:MM (24 horas)'
        }
      }
    },
    nueva_hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La nueva hora de fin es obligatoria'
        },
        is: {
          args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: 'La hora de fin debe tener formato HH:MM (24 horas)'
        },
        isAfterInicio(value) {
          if (value <= this.nueva_hora_inicio) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio');
          }
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
      allowNull: false,
      defaultValue: 'pendiente',
      validate: {
        isIn: {
          args: [['pendiente', 'aprobada', 'rechazada']],
          msg: 'El estado debe ser pendiente, aprobada o rechazada'
        }
      }
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'El motivo no puede exceder 500 caracteres'
        }
      }
    },
    id_revisor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'El ID del revisor debe ser un número entero'
        }
      }
    },
    fecha_revision: {
      type: DataTypes.DATE,
      allowNull: true
    },
    comentarios_revision: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Los comentarios de revisión no pueden exceder 500 caracteres'
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
    tableName: 'schedule_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['id_empleado']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_solicitada']
      },
      {
        fields: ['id_empleado', 'estado']
      },
      {
        fields: ['id_revisor']
      }
    ]
  });

  // Asociaciones
  ScheduleRequest.associate = (models) => {
    // Relación muchos a uno con Employee (quien solicita)
    ScheduleRequest.belongsTo(models.Employee, {
      foreignKey: 'id_empleado',
      as: 'empleado_solicitante',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación muchos a uno con User (quien revisa)
    ScheduleRequest.belongsTo(models.User, {
      foreignKey: 'id_revisor',
      as: 'revisor',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  // Métodos de instancia
  ScheduleRequest.prototype.getDuracionNueva = function() {
    const inicio = new Date(`2000-01-01T${this.nueva_hora_inicio}`);
    const fin = new Date(`2000-01-01T${this.nueva_hora_fin}`);
    const diferencia = fin - inicio;
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return { horas, minutos };
  };

  ScheduleRequest.prototype.aprobar = function(revisorId, comentarios) {
    return this.update({
      estado: 'aprobada',
      id_revisor: revisorId,
      fecha_revision: new Date(),
      comentarios_revision: comentarios || null
    });
  };

  ScheduleRequest.prototype.rechazar = function(revisorId, comentarios) {
    return this.update({
      estado: 'rechazada',
      id_revisor: revisorId,
      fecha_revision: new Date(),
      comentarios_revision: comentarios || null
    });
  };

  // Scopes para consultas comunes
  ScheduleRequest.addScope('pendientes', () => ({
    where: {
      estado: 'pendiente'
    }
  }));

  ScheduleRequest.addScope('aprobadas', () => ({
    where: {
      estado: 'aprobada'
    }
  }));

  ScheduleRequest.addScope('rechazadas', () => ({
    where: {
      estado: 'rechazada'
    }
  }));

  ScheduleRequest.addScope('deEmpleado', (empleadoId) => ({
    where: {
      id_empleado: empleadoId
    }
  }));

  ScheduleRequest.addScope('delDia', (fecha) => ({
    where: {
      fecha_solicitada: fecha
    }
  }));

  return ScheduleRequest;
};
