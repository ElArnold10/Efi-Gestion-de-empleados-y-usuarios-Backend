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
El proyecto utiliza variables de entorno para mantener la configuración segura y separada del código.

**1. Copiar el archivo de ejemplo:**
```bash
cp .env.example .env
```

**2. Configurar las variables en el archivo `.env`:**
```env
# Configuración del servidor
NODE_ENV=development
PORT=3001

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_horarios
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME_TEST=sistema_horarios_test
DB_SSL=false

# Configuración de base de datos para producción (Railway)
MYSQL_URL=mysql://username:password@host:port/database
RAILWAY_PRIVATE_MYSQL_USER=
RAILWAY_PRIVATE_MYSQL_PASSWORD=
RAILWAY_PRIVATE_MYSQL_DATABASE=
RAILWAY_PRIVATE_MYSQL_HOST=
RAILWAY_PRIVATE_MYSQL_PORT=

# JWT
JWT_SECRET=secreto_super_seguro_para_jwt
JWT_EXPIRES_IN=24h

# Email - SendGrid (principal)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=tu_email@gmail.com

# Email - Gmail SMTP (fallback)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_app

# URLs de la aplicación
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Configuración de seguridad
BCRYPT_ROUNDS=10
```

**⚠️ Importante:** 
- Nunca subas el archivo `.env` al repositorio (ya está configurado en `.gitignore`)
- Usa valores seguros para `JWT_SECRET` y contraseñas en producción
- Configura las credenciales de email para poder enviar notificaciones

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
# Sistema de Gestión de Horarios - Backend

Backend API para el sistema de gestión de horarios y empleados. Construido con Node.js, Express y MySQL.

## 📋 Tabla de Contenido

- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Despliegue](#-despliegue)

## 🚀 Instalación

### Prerrequisitos
- Node.js 16+
- npm o yarn
- MySQL 8.0+

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd backend-sistema-gestion-usuarios
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Luego edita el archivo `.env` con tus configuraciones (ver sección [Variables de Entorno](#-variables-de-entorno)).

4. **Configurar base de datos:**
   ```bash
   # Crear base de datos en MySQL
   mysql -u tu_usuario -p
   CREATE DATABASE sistema_horarios;
   
   # Sincronizar modelos
   npm run db:sync
   ```

5. **Iniciar el servidor:**
   ```bash
   npm start
   ```

## 🔧 Variables de Entorno

El proyecto utiliza el archivo `.env.example` como plantilla para las variables de entorno. Copia este archivo a `.env` y configúralo con tus valores:

### Configuración Obligatoria
```env
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_horarios
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql

# JWT
JWT_SECRET=secreto_super_seguro_para_jwt
```

### Configuración Opcional
```env
# Servidor
NODE_ENV=development
PORT=3001

# Email (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=tu_email@gmail.com

# Email (Gmail SMTP fallback)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# URLs
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Seguridad
BCRYPT_ROUNDS=10
```

### Variables de Producción (Railway)
```env
MYSQL_URL=mysql://username:password@host:port/database
RAILWAY_PRIVATE_MYSQL_USER=
RAILWAY_PRIVATE_MYSQL_PASSWORD=
RAILWAY_PRIVATE_MYSQL_DATABASE=
RAILWAY_PRIVATE_MYSQL_HOST=
RAILWAY_PRIVATE_MYSQL_PORT=
```

## 📜 Scripts Disponibles

### Desarrollo
```bash
npm start          # Iniciar servidor en modo producción
npm run dev        # Iniciar servidor con nodemon (desarrollo)
npm run debug      # Iniciar con modo debug
```

### Base de Datos
```bash
npm run db:sync    # Sincronizar modelos con la base de datos
npm run db:reset   # Resetear base de datos (¡CUIDADO! Borra datos)
npm run db:seed    # Poblar base de datos con datos de prueba
```

### Testing
```bash
npm test           # Ejecutar tests
npm run test:watch # Ejecutar tests en modo watch
npm run test:cover # Ejecutar tests con cobertura
```

### Utilidades
```bash
npm run lint       # Verificar código con ESLint
npm run lint:fix   # Corregir problemas de linting automáticamente
npm run logs       # Ver logs del servidor
npm run clean      # Limpiar node_modules y reinstalar
```

## 📁 Estructura del Proyecto

```
backend-sistema-gestion-usuarios/
├── backend/                    # Código fuente del backend
│   ├── config/                # Archivos de configuración
│   │   ├── database.js        # Configuración de base de datos
│   │   ├── email.js          # Configuración de email
│   │   └── security.js       # Configuración de seguridad
│   ├── middleware/           # Middlewares personalizados
│   │   ├── auth.js          # Autenticación JWT
│   │   ├── validation.js    # Validación de datos
│   │   └── security.js      # Seguridad y rate limiting
│   ├── models/              # Modelos de Sequelize
│   │   ├── Employee.js      # Modelo de empleado
│   │   ├── User.js         # Modelo de usuario
│   │   └── ...
│   ├── routes/              # Rutas de la API
│   │   ├── auth.js         # Rutas de autenticación
│   │   ├── employees.js    # Rutas de empleados
│   │   └── ...
│   ├── services/           # Lógica de negocio
│   ├── utils/              # Utilidades varias
│   ├── server.js           # Punto de entrada del servidor
│   └── package.json        # Dependencias del backend
├── database/               # Scripts y configuración de BD
│   ├── config/           # Configuración adicional
│   ├── models/           # Modelos de base de datos
│   ├── scripts/          # Scripts SQL
│   └── setup.js         # Script de configuración
├── .env.example          # Plantilla de variables de entorno
├── .gitignore           # Archivos ignorados por Git
├── package.json         # Dependencias del proyecto
├── README.md           # Este archivo
└── railway.json        # Configuración de despliegue
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token

### Empleados
- `GET /api/employees` - Listar empleados
- `POST /api/employees` - Crear empleado
- `GET /api/employees/:id` - Obtener empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Horarios
- `GET /api/schedules` - Listar horarios
- `POST /api/schedules` - Crear horario
- `GET /api/schedules/:id` - Obtener horario
- `PUT /api/schedules/:id` - Actualizar horario

### Solicitudes
- `GET /api/requests` - Listar solicitudes
- `POST /api/requests` - Crear solicitud
- `PUT /api/requests/:id/approve` - Aprobar solicitud
- `PUT /api/requests/:id/reject` - Rechazar solicitud

## 🚀 Despliegue

### Railway
1. Conectar repositorio a Railway
2. Configurar variables de entorno en el dashboard de Railway
3. Railway detectará automáticamente que es un proyecto Node.js

### Variables de Producción
- `NODE_ENV=production`
- `MYSQL_URL` (URL completa de MySQL)
- `JWT_SECRET` (secreto seguro)
- `SENDGRID_API_KEY` (para emails)

### Docker
```bash
# Construir imagen
docker build -t sistema-horarios-backend .

# Ejecutar contenedor
docker run -p 3001:3001 --env-file .env sistema-horarios-backend
```

## 🛠️ Troubleshooting

### Problemas Comunes

**Error: Conexión a base de datos**
- Verifica que MySQL esté corriendo
- Confirma credenciales en `.env`
- Asegúrate que la base de datos exista

**Error: Module not found**
- Ejecuta `npm install`
- Limpia caché: `npm cache clean --force`

**Error: JWT secret**
- Configura `JWT_SECRET` en `.env`
- Usa un valor seguro y único

## 📄 Licencia

MIT License
>>>>>>> 8bf3d2cdb98a72ddd7e94c47908b2d118e5e5e4b
