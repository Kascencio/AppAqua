# 🔐 Sistema de Autenticación AquaMonitor

## 📋 Resumen

Se ha implementado un sistema de autenticación completo y seguro para AquaMonitor que incluye:

- ✅ **Login seguro** con hash de contraseñas (bcrypt)
- ✅ **Registro de usuarios** con validaciones robustas
- ✅ **Recuperación de contraseñas** con tokens seguros
- ✅ **JWT tokens** con refresh automático
- ✅ **Middleware de seguridad** para proteger rutas
- ✅ **Rate limiting** para prevenir ataques
- ✅ **Validaciones de entrada** y sanitización
- ✅ **Logging de seguridad** para auditoría

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Base de datos
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"

# JWT (¡CAMBIAR EN PRODUCCIÓN!)
JWT_SECRET="tu-clave-secreta-super-segura-cambiar-en-produccion"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Email (para recuperación de contraseñas)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicacion"
SMTP_FROM="AquaMonitor <noreply@aquamonitor.com>"

# Aplicación
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NODE_ENV="development"
```

### 3. Configurar Base de Datos

Importa el esquema de la base de datos:

```bash
mysql -u root -p tu_base_datos < bd.sql
```

### 4. Poblar Base de Datos con Datos Iniciales

```bash
pnpm run seed
```

Esto creará:
- Usuario administrador por defecto
- Roles de usuario
- Datos geográficos (estados, municipios, etc.)
- Especies y parámetros
- Sensores de ejemplo
- Instalaciones de prueba

### 5. Iniciar la Aplicación

```bash
pnpm run dev
```

## 🔑 Credenciales por Defecto

Después del seed, puedes acceder con:

- **Email**: `admin@aquamonitor.com`
- **Contraseña**: `admin123`

## 📁 Estructura de Archivos Creados

```
lib/
├── auth-utils.ts              # Utilidades de autenticación
app/api/auth/
├── login/route.ts             # API de login
├── register/route.ts          # API de registro
├── forgot-password/route.ts   # API de recuperación
├── reset-password/route.ts    # API de restablecimiento
├── refresh/route.ts           # API de refresh token
├── logout/route.ts            # API de logout
└── me/route.ts                # API de datos del usuario
app/
├── login/page.tsx             # Página de login
├── register/page.tsx          # Página de registro
├── forgot-password/page.tsx   # Página de recuperación
└── reset-password/page.tsx    # Página de restablecimiento
context/
└── auth-context.tsx           # Contexto de autenticación actualizado
hooks/
└── use-auth-token.ts          # Hook para manejo de tokens
middleware.ts                  # Middleware de seguridad
scripts/
├── seed-database.ts           # Script de seed
└── run-seed.ts                # Ejecutor del seed
```

## 🔒 Características de Seguridad

### Hash de Contraseñas
- Usa bcrypt con 12 rounds de salt
- Validación de fortaleza de contraseña
- Requisitos: 8+ caracteres, mayúscula, minúscula, número, carácter especial

### JWT Tokens
- Access tokens con expiración de 24 horas
- Refresh tokens con expiración de 7 días
- Tokens firmados con clave secreta
- Verificación de audiencia e issuer

### Rate Limiting
- Máximo 5 intentos de login por IP cada 15 minutos
- Prevención de ataques de fuerza bruta
- Limpieza automática de intentos antiguos

### Validaciones
- Sanitización de entrada de usuario
- Validación de formato de email
- Validación de formato de teléfono
- Prevención de inyección SQL

### Logging de Seguridad
- Registro de intentos de login fallidos
- Registro de logins exitosos
- Registro de cambios de contraseña
- Registro de accesos no autorizados

## 🛡️ Middleware de Seguridad

El middleware protege automáticamente:
- Rutas que requieren autenticación
- Redirección automática al login
- Verificación de tokens JWT
- Headers de usuario para APIs

## 📱 Páginas de Autenticación

### Login (`/login`)
- Formulario de email y contraseña
- Mostrar/ocultar contraseña
- Validación en tiempo real
- Enlaces a registro y recuperación

### Registro (`/register`)
- Formulario completo de registro
- Validación de fortaleza de contraseña
- Confirmación de contraseña
- Validación en tiempo real

### Recuperación (`/forgot-password`)
- Solicitud de enlace de recuperación
- Mensaje de confirmación
- Prevención de enumeración de usuarios

### Restablecimiento (`/reset-password`)
- Formulario de nueva contraseña
- Validación de token
- Validación de fortaleza
- Confirmación de cambio

## 🔄 Flujo de Autenticación

1. **Login**: Usuario ingresa credenciales → Verificación → Tokens JWT
2. **Refresh**: Token expirado → Refresh automático → Nuevos tokens
3. **Logout**: Limpieza de tokens y cookies
4. **Recuperación**: Email → Token temporal → Nueva contraseña

## 🧪 Testing

Para probar el sistema:

1. **Registro**: Crea una cuenta nueva
2. **Login**: Inicia sesión con las credenciales
3. **Recuperación**: Solicita recuperación de contraseña
4. **Restablecimiento**: Usa el token para cambiar contraseña

## 🚨 Consideraciones de Producción

### Variables de Entorno Críticas
- `JWT_SECRET`: Debe ser una clave fuerte y única
- `DATABASE_URL`: Configuración segura de base de datos
- `SMTP_*`: Configuración de email para recuperación

### Seguridad Adicional
- Usar HTTPS en producción
- Configurar CORS apropiadamente
- Implementar backup de base de datos
- Monitorear logs de seguridad
- Actualizar dependencias regularmente

## 📞 Soporte

Si encuentras problemas:

1. Verifica las variables de entorno
2. Confirma la conexión a la base de datos
3. Revisa los logs de la consola
4. Ejecuta el seed nuevamente si es necesario

## 🎯 Próximos Pasos

- [ ] Implementar envío de emails real
- [ ] Agregar autenticación de dos factores
- [ ] Implementar auditoría de sesiones
- [ ] Agregar captcha para prevenir bots
- [ ] Implementar políticas de contraseñas por rol
