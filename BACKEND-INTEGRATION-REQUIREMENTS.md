# Requisitos de Integración del Backend Externo

Este documento describe las funciones y endpoints que el backend externo (corriendo en puerto 3300) debe implementar para una integración completa con la aplicación.

## URL Base del Backend

El backend debe estar disponible en:
- **HTTP API**: `http://your-hosting-url:3300/api`
- **WebSocket**: `ws://your-hosting-url:3300/ws` o `wss://your-hosting-url:3300/ws` (para HTTPS)

## Variables de Entorno Requeridas

```env
NEXT_PUBLIC_EXTERNAL_API_URL="http://your-hosting-url:3300/api"
EXTERNAL_API_URL="http://your-hosting-url:3300/api"
NEXT_PUBLIC_WS_URL="ws://your-hosting-url:3300/ws"
```

## Endpoints HTTP Requeridos

### 1. Autenticación

El backend debe soportar autenticación mediante tokens JWT en el header:
```
Authorization: Bearer <token>
```

El token puede ser enviado desde:
- Cookie: `access_token`
- Header: `Authorization: Bearer <token>`
- Query parameter: `?token=<token>` (para WebSocket)

### 2. Sensores

#### GET `/api/sensors/:sensorId`
Obtener información de un sensor específico.

**Respuesta esperada:**
```json
{
  "id": "123",
  "name": "Sensor pH",
  "type": "ph",
  "unit": "pH",
  "status": "active",
  "lastReading": 7.5,
  "lastUpdated": "2024-01-01T12:00:00Z",
  "installationId": "456",
  "branchId": "789"
}
```

#### GET `/api/sensors/:sensorId/readings`
Obtener lecturas históricas de un sensor.

**Query Parameters:**
- `from` (ISO 8601): Fecha de inicio
- `to` (ISO 8601): Fecha de fin
- `limit` (number): Límite de resultados

**Respuesta esperada:**
```json
[
  {
    "id": "reading1",
    "sensorId": "123",
    "value": 7.5,
    "timestamp": "2024-01-01T12:00:00Z",
    "status": "normal",
    "parameter": "ph",
    "unit": "pH"
  }
]
```

#### GET `/api/sensors/:sensorId/readings/latest`
Obtener la última lectura de un sensor.

**Respuesta esperada:**
```json
{
  "id": "reading1",
  "sensorId": "123",
  "value": 7.5,
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "normal",
  "parameter": "ph",
  "unit": "pH"
}
```

### 3. Instalaciones

#### GET `/api/installations/:installationId/sensors`
Obtener todos los sensores de una instalación.

**Respuesta esperada:**
```json
[
  {
    "id": "123",
    "name": "Sensor pH",
    "type": "ph",
    "unit": "pH",
    "status": "active",
    "lastReading": 7.5
  }
]
```

### 4. Lecturas en Tiempo Real

#### POST `/api/readings/realtime`
Obtener lecturas en tiempo real de múltiples sensores.

**Request Body:**
```json
{
  "sensorIds": ["123", "456", "789"]
}
```

**Respuesta esperada:**
```json
{
  "123": {
    "value": 7.5,
    "timestamp": "2024-01-01T12:00:00Z",
    "status": "normal"
  },
  "456": {
    "value": 25.3,
    "timestamp": "2024-01-01T12:00:00Z",
    "status": "warning"
  }
}
```

## WebSocket API

### Conexión

El cliente se conecta a: `ws://your-hosting-url:3300/ws`

### Autenticación

El token puede ser enviado como:
1. Query parameter: `ws://your-hosting-url:3300/ws?token=<token>`
2. Header: `Authorization: Bearer <token>` (si el cliente soporta headers en WebSocket)

### Mensajes del Cliente

#### Suscripción a Sensores
```json
{
  "type": "subscribe",
  "sensorIds": ["123", "456", "789"]
}
```

#### Desuscripción
```json
{
  "type": "unsubscribe",
  "sensorIds": ["123"]
}
```

### Mensajes del Servidor

#### Actualización de Lectura
```json
{
  "type": "reading_update",
  "sensorId": "123",
  "value": 7.5,
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "normal",
  "parameter": "ph",
  "unit": "pH"
}
```

#### Error
```json
{
  "type": "error",
  "message": "Sensor no encontrado",
  "sensorId": "123"
}
```

#### Conexión Establecida
```json
{
  "type": "connected",
  "message": "Conexión establecida exitosamente"
}
```

## Funcionalidades Críticas que el Backend Debe Implementar

### 1. WebSocket con Actualizaciones Individuales
- ✅ El backend debe enviar actualizaciones **solo** para los sensores suscritos
- ✅ Cada mensaje debe incluir el `sensorId` para que el frontend pueda actualizar solo la card correspondiente
- ✅ No debe enviar actualizaciones para todos los sensores si solo se suscribió a algunos

### 2. Manejo de Reconexión
- ✅ El backend debe soportar reconexiones automáticas
- ✅ Debe mantener las suscripciones activas durante reconexiones rápidas
- ✅ Debe enviar el estado actual de los sensores suscritos al reconectar

### 3. Autenticación y Autorización
- ✅ Validar tokens JWT en cada request
- ✅ Verificar permisos del usuario para acceder a sensores específicos
- ✅ Devolver error 401 si el token no es válido
- ✅ Devolver error 403 si el usuario no tiene permisos

### 4. Rate Limiting
- ✅ Implementar rate limiting para evitar abuso
- ✅ Limitar conexiones WebSocket por usuario/IP
- ✅ Limitar requests HTTP por segundo

### 5. Validación de Datos
- ✅ Validar que los valores de las lecturas estén en rangos válidos
- ✅ Validar formatos de fecha (ISO 8601)
- ✅ Validar que los sensorIds existan antes de enviar actualizaciones

### 6. Manejo de Errores
- ✅ Devolver códigos de estado HTTP apropiados
- ✅ Incluir mensajes de error descriptivos
- ✅ Manejar errores de conexión WebSocket gracefully

## Endpoints Opcionales (Recomendados)

### Health Check
```
GET /api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### Estadísticas
```
GET /api/stats
```

**Respuesta:**
```json
{
  "totalSensors": 100,
  "activeSensors": 95,
  "totalReadings": 10000,
  "readingsToday": 500
}
```

## Notas de Implementación

1. **Formato de Fechas**: Todas las fechas deben estar en formato ISO 8601 (UTC)
2. **CORS**: El backend debe configurar CORS para permitir requests desde el frontend
3. **Compresión**: Considerar comprimir respuestas grandes (gzip)
4. **Cache**: Implementar cache apropiado para datos históricos
5. **Logging**: Registrar todas las operaciones importantes para debugging

## Ejemplo de Implementación WebSocket (Node.js)

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3300 });

wss.on('connection', (ws, req) => {
  // Extraer token de query parameter
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  
  // Validar token
  if (!validateToken(token)) {
    ws.close(1008, 'Token inválido');
    return;
  }
  
  const subscriptions = new Set();
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        data.sensorIds.forEach(id => subscriptions.add(id));
        ws.send(JSON.stringify({ type: 'subscribed', sensorIds: Array.from(subscriptions) }));
      } else if (data.type === 'unsubscribe') {
        data.sensorIds.forEach(id => subscriptions.delete(id));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  // Enviar actualizaciones periódicas
  const interval = setInterval(() => {
    subscriptions.forEach(sensorId => {
      const reading = getLatestReading(sensorId);
      if (reading) {
        ws.send(JSON.stringify({
          type: 'reading_update',
          sensorId,
          value: reading.value,
          timestamp: reading.timestamp,
          status: reading.status
        }));
      }
    });
  }, 1000); // Cada segundo
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

## Checklist de Integración

- [ ] Backend configurado en puerto 3300
- [ ] Endpoints HTTP implementados
- [ ] WebSocket server implementado
- [ ] Autenticación JWT funcionando
- [ ] Suscripciones individuales por sensor funcionando
- [ ] Actualizaciones en tiempo real enviadas correctamente
- [ ] Manejo de errores implementado
- [ ] Rate limiting configurado
- [ ] CORS configurado
- [ ] Logging implementado
- [ ] Documentación de API actualizada

