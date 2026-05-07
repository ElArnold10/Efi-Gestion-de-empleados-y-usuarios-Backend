# Deploy en Railway - Sistema de Gestión de Empleados

## 🚀 Configuración para Railway

Tu proyecto ya está configurado para deploy en Railway. Los archivos creados:

- `railway.json` - Configuración del build y deploy
- `package.json` - Scripts para Railway
- `Procfile` - Comando de inicio
- `.env.production` - Variables de entorno de referencia

## 📋 Pasos para Deploy

### 1. Conectar Repository a Railway

```bash
# Opción A: Via CLI
railway login
railway link

# Opción B: Via Dashboard
# 1. Ve a railway.app
# 2. Click "New Project" 
# 3. "Deploy from GitHub repo"
# 4. Selecciona tu repositorio
```

### 2. Configurar Base de Datos

En Railway Dashboard:

1. **Añadir MySQL Plugin:**
   - Ve a tu proyecto
   - Click "New Service"
   - Busca "MySQL" y añádelo

2. **Configurar Variables de Entorno:**
   - Ve a "Settings" → "Variables"
   - Añade estas variables:

```bash
# Variables obligatorias
JWT_SECRET=tu_secreto_super_seguro_para_jwt
NODE_ENV=production

# SendGrid (opcional, para emails)
SENDGRID_API_KEY=sg_your_api_key_here
SENDGRID_FROM_EMAIL=tu_email@example.com
```

### 3. Deploy Automático

Railway detectará los cambios automáticamente y hará deploy:

- Build: Instalará dependencias desde `backend/package.json`
- Start: Ejecutará `npm start` (que corre `cd backend && npm start`)
- Health Check: Verificará `/api/health`

## 🔧 Variables de Entorno Disponibles

Railway proporcionará automáticamente:

- `$PORT` - Puerto del servidor
- `$RAILWAY_PRIVATE_MYSQL_HOST` - Host de la BD
- `$RAILWAY_PRIVATE_MYSQL_PORT` - Puerto de la BD
- `$RAILWAY_PRIVATE_MYSQL_DATABASE` - Nombre de la BD
- `$RAILWAY_PRIVATE_MYSQL_USER` - Usuario de la BD
- `$RAILWAY_PRIVATE_MYSQL_PASSWORD` - Contraseña de la BD

## 🌐 URLs después del Deploy

- **API URL**: `https://tu-app.railway.app/api`
- **Health Check**: `https://tu-app.railway.app/api/health`

## 🛠️ Comandos Útiles

```bash
# Ver logs del deploy
railway logs

# Re-deploy manual
railway up

# Ver variables de entorno
railway variables

# Acceder a la base de datos
railway mysql
```

## 🔍 Verificación del Deploy

1. **Health Check**: Abre tu URL + `/api/health`
2. **API Test**: Abre tu URL + `/api/users` (debería responder con error 401)
3. **Logs**: Revisa que no haya errores en los logs

## ⚠️ Notas Importantes

- La base de datos se sincronizará automáticamente en el primer deploy
- Asegúrate de configurar `JWT_SECRET` antes del deploy
- El frontend necesitará actualizar `REACT_APP_API_URL` a tu nueva URL de Railway

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que el plugin MySQL esté activo
- Espera 2-3 minutos después de añadir MySQL para que se inicialice

### Error: "Port already in use"
- Railway asigna automáticamente el puerto via `$PORT`
- No configures un puerto fijo en producción

### Error: "Module not found"
- Verifica que `backend/package.json` tenga todas las dependencias
- El build debe ejecutar `npm install` en el directorio backend

## 📚 Recursos Adicionales

- [Railway Docs](https://docs.railway.app/)
- [Node.js on Railway](https://docs.railway.app/guides/deploying-a-nodejs-app)
- [MySQL Plugin](https://docs.railway.app/guides/mysql)
