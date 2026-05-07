<<<<<<< HEAD
# Sistema de Gestión de Horarios - Estructura Separada

Este proyecto ahora tiene una estructura separada con el backend y la base de datos en un directorio, y el frontend en otro.

## 📁 Estructura de Directorios

```
/home/ma1k1/Documentos/
├── backend-sistema-gestion-usuarios/
│   ├── backend/          # API REST y servidor
│   └── database/         # Archivos de base de datos
└── sistema-gestion-horarios-V3-.../
    └── frontend/         # Aplicación React
```

## 🚀 Guía de Instalación y Ejecución

### Requisitos Previos
- Node.js 16+ 
- npm o yarn
- MySQL (para la base de datos)

---

## 📦 Paso 1: Configurar el Backend

### 1.1 Navegar al directorio del backend
```bash
cd /home/ma1k1/Documentos/backend-sistema-gestion-usuarios/backend
```

### 1.2 Instalar dependencias
```bash
npm install
```

### 1.3 Configurar variables de entorno
Crear un archivo `.env` en el directorio `backend/`:
```env
# Configuración del servidor
PORT=3001
NODE_ENV=development

# Base de datos MySQL
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=sistema_horarios

# JWT
JWT_SECRET=secreto_super_seguro_para_jwt

# Email (opcional)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_app
```

### 1.4 Configurar la base de datos
```bash
# Crear la base de datos en MySQL
mysql -u tu_usuario_mysql -p
CREATE DATABASE sistema_horarios;

# Sincronizar los modelos con la base de datos
npm run db:sync
```

---

## 🌐 Paso 2: Configurar el Frontend

### 2.1 Navegar al directorio del frontend
```bash
cd /home/ma1k1/Documentos/sistema-gestion-horarios-V3-NOTIFICACIONES-HORARIOS-SOLI_DE_CAMBIO-PERFIL_EMPLEADO\(1\)/sistema-gestion-horarios/sistema-gestion-horarios/frontend
```

### 2.2 Instalar dependencias
```bash
npm install
```

### 2.3 Configurar variables de entorno
Crear un archivo `.env` en el directorio `frontend/`:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🏃‍♂️ Paso 3: Ejecutar las Aplicaciones

### Opción A: Ejecución en Terminales Separados

**Terminal 1 - Backend:**
```bash
cd /home/ma1k1/Documentos/backend-sistema-gestion-usuarios/backend
npm start
```
El servidor backend se iniciará en `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd /home/ma1k1/Documentos/sistema-gestion-horarios-V3-NOTIFICACIONES-HORARIOS-SOLI_DE_CAMBIO-PERFIL_EMPLEADO\(1\)/sistema-gestion-horarios/sistema-gestion-horarios/frontend
npm start
```
La aplicación frontend se iniciará en `http://localhost:3000`

### Opción B: Ejecución con Scripts (Recomendado)

Puedes usar los scripts `start.sh` y `stop.sh` ubicados en el directorio principal del frontend:

```bash
# Desde el directorio del frontend
./start.sh    # Inicia ambos servicios
./stop.sh     # Detiene ambos servicios
```

---

## 🔍 Verificación de Funcionamiento

Una vez iniciados ambos servicios:

1. **Backend**: Abre `http://localhost:3001/api/users` - Deberías ver un mensaje de error de autenticación (lo que indica que el servidor está funcionando)

2. **Frontend**: Abre `http://localhost:3000` - Deberías ver la página de login del sistema

---

## 📋 Flujo de Trabajo Típico

### 1. Primer Usuario (Administrador)
1. Regístrate en la aplicación
2. El primer usuario automáticamente tendrá rol de administrador
3. Podrás gestionar empleados, horarios y solicitudes

### 2. Usuarios Empleados
1. Los nuevos usuarios se registran con rol "user"
2. Deben solicitar ser empleados
3. El administrador aprueba la solicitud
4. Pueden ver sus horarios y solicitar cambios

---

## 🛠️ Comandos Útiles

### Backend
```bash
npm start          # Iniciar servidor
npm run dev        # Iniciar con nodemon (desarrollo)
npm run db:sync    # Sincronizar base de datos
npm run db:reset   # Resetear base de datos
```

### Frontend
```bash
npm start          # Iniciar aplicación
npm run build      # Compilar para producción
npm test           # Ejecutar tests
```

---

## 🔧 Solución de Problemas

### Problemas Comunes

**1. Error de conexión a la base de datos**
- Verifica que MySQL esté corriendo
- Confirma las credenciales en el archivo `.env`
- Asegúrate de que la base de datos `sistema_horarios` exista

**2. Error de CORS**
- Verifica que el backend esté corriendo en el puerto 3001
- Confirma que `REACT_APP_API_URL` esté configurado correctamente

**3. Error de módulos no encontrados**
- Ejecuta `npm install` en ambos directorios (backend y frontend)
- Limpia la caché de npm: `npm cache clean --force`

**4. Puerto en uso**
- Cambia el puerto en el archivo `.env` del backend
- Actualiza `REACT_APP_API_URL` en el frontend con el nuevo puerto

---

## 📚 Documentación Adicional

- **API Endpoints**: Consulta el README original para la documentación completa de la API
- **Estructura de la Base de Datos**: Revisa los archivos en `backend/models/`
- **Guía de Testing**: Consulta `TESTING_GUIDE.md` en el directorio principal

---

## 🤝 Contribución

1. Realiza cambios en los directorios correspondientes
2. Prueba ambos componentes (backend y frontend)
3. Asegúrate de que la integración funcione correctamente
4. Documenta los cambios realizados

---

## 📄 Licencia

MIT License - Ver el archivo original para más detalles.
=======
# Efi-Gestion-de-empleados-y-usuarios-Backend
>>>>>>> 8bf3d2cdb98a72ddd7e94c47908b2d118e5e5e4b
