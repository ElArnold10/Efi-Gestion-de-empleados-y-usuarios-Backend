const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeRequest = sequelize.define('EmployeeRequest', {
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
    posicion_deseada: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La posición deseada es obligatoria'
        },
        len: {
          args: [2, 100],
          msg: 'La posición deseada debe tener entre 2 y 100 caracteres'
        }
      }
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'El mensaje no puede exceder 1000 caracteres'
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
    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_revision: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revisado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    comentarios_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Los comentarios no pueden exceder 500 caracteres'
        }
      }
    }
  }, {
    tableName: 'employee_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['id_usuario']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_solicitud']
      },
      {
        fields: ['revisado_por']
      }
    ]
  });

  // Asociaciones
  EmployeeRequest.associate = (models) => {
    // Relación con el usuario solicitante
    EmployeeRequest.belongsTo(models.User, {
      foreignKey: 'id_usuario',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación con el administrador que revisa
    EmployeeRequest.belongsTo(models.User, {
      foreignKey: 'revisado_por',
      as: 'revisor',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  // Métodos de instancia
  EmployeeRequest.prototype.aprobar = async function(adminId, comentarios = null) {
    this.estado = 'aprobada';
    this.fecha_revision = new Date();
    this.revisado_por = adminId;
    if (comentarios) {
      this.comentarios_admin = comentarios;
    }
    
    await this.save();
    
    // Cambiar el rol del usuario a empleado
    const User = sequelize.models.User;
    const Employee = sequelize.models.Employee;
    
    const usuario = await User.findByPk(this.id_usuario);
    if (usuario) {
      await usuario.update({ rol: 'empleado' });
      
      // Crear registro de empleado
      const existingEmployee = await Employee.findOne({ 
        where: { id_usuario: this.id_usuario } 
      });
      
      if (!existingEmployee) {
        await Employee.create({
          id_usuario: this.id_usuario,
          posicion: this.posicion_deseada,
          fecha_contratacion: new Date(),
          estado: true
        });
      }
    }
  };

  EmployeeRequest.prototype.rechazar = async function(adminId, comentarios = null) {
    this.estado = 'rechazada';
    this.fecha_revision = new Date();
    this.revisado_por = adminId;
    if (comentarios) {
      this.comentarios_admin = comentarios;
    }
    
    await this.save();
  };

  return EmployeeRequest;
};
