/**
 * WebSocket Manager para conexiones en tiempo real
 * 
 * El backend Fastify NO soporta suscripción dinámica via mensajes.
 * Solo acepta filtros en la URL de conexión:
 * - ws://host/ws/lecturas?instalacionId=5
 * - ws://host/ws/lecturas?sensorInstaladoId=1
 * 
 * Este manager:
 * 1. Mantiene un pool de conexiones WebSocket (una por instalación)
 * 2. Permite que múltiples componentes se suscriban a la misma conexión
 * 3. Reconecta automáticamente con backoff exponencial
 * 4. Distribuye eventos a todos los suscriptores
 */

import { buildLecturasWsUrl } from "@/lib/websocket-url"

type LecturaData = {
  id_lectura: number
  sensor_instalado_id: number
  instalacion_id: number
  tipo_medida: string
  tomada_en: string
  valor: number
}

type WebSocketMessage = {
  type: 'lectura.created' | 'error' | 'connected'
  data?: LecturaData
  message?: string
}

type SubscriberCallback = (data: LecturaData) => void
type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error'
type ConnectionStatusCallback = (status: ConnectionStatus, event?: Event | CloseEvent) => void

interface WebSocketConnection {
  socket: WebSocket
  instalacionId: number
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectDelay: number
  reconnectTimeout?: NodeJS.Timeout
  isConnecting: boolean
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private subscribers: Map<string, Set<SubscriberCallback>> = new Map()
  private statusSubscribers: Map<string, Set<ConnectionStatusCallback>> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private pendingCloseTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private baseUrl: string
  private debug = process.env.NEXT_PUBLIC_WS_DEBUG === 'true'

  constructor() {
    this.baseUrl = buildLecturasWsUrl()
    
    // Cleanup al cerrar la página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.closeAll()
      })
    }
  }

  /**
   * Obtener clave única para una instalación
   */
  private getConnectionKey(instalacionId: number): string {
    return `instalacion-${instalacionId}`
  }

  private log(message: string, ...args: unknown[]) {
    if (this.debug) console.log(message, ...args)
  }

  private warn(message: string, ...args: unknown[]) {
    if (this.debug) console.warn(message, ...args)
  }

  private notifyStatus(key: string, status: ConnectionStatus, event?: Event | CloseEvent) {
    const subscribers = this.statusSubscribers.get(key)
    if (!subscribers || subscribers.size === 0) return

    subscribers.forEach((callback) => {
      try {
        callback(status, event)
      } catch (error) {
        this.warn('[WS Manager] Error en callback de estado:', error)
      }
    })
  }

  private cancelPendingClose(key: string) {
    const timeout = this.pendingCloseTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.pendingCloseTimeouts.delete(key)
    }
  }

  /**
   * Obtener o crear conexión WebSocket para una instalación
   */
  private getOrCreateConnection(instalacionId: number): WebSocketConnection | null {
    const key = this.getConnectionKey(instalacionId)

    if (this.connections.has(key)) {
      return this.connections.get(key)!
    }

    // Obtener token de autenticación
    let token: string | null = null
    if (typeof document !== 'undefined') {
      token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1] || null

      if (token) {
        token = decodeURIComponent(token)
      }
      
      if (!token) {
        // AuthContext guarda el token en `localStorage.setItem('token', ...)`
        token = localStorage.getItem('token') || localStorage.getItem('access_token')
      }
    }

    // Construir URL con filtro de instalación y token
    let wsUrl = `${this.baseUrl}?instalacionId=${instalacionId}`
    if (token) {
      wsUrl += `&token=${encodeURIComponent(token)}`
    }

    this.notifyStatus(key, 'connecting')
    this.log(`[WS Manager] Creando conexión para instalación ${instalacionId}`)

    let socket: WebSocket
    try {
      socket = new WebSocket(wsUrl)
    } catch (error) {
      this.notifyStatus(key, 'error', error instanceof Event ? error : undefined)
      this.warn(`[WS Manager] No se pudo abrir el WebSocket para instalación ${instalacionId}:`, error)
      return null
    }

    const connection: WebSocketConnection = {
      socket,
      instalacionId,
      reconnectAttempts: this.reconnectAttempts.get(key) ?? 0,
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      isConnecting: true
    }

    this.setupEventHandlers(connection, key)
    this.connections.set(key, connection)

    return connection
  }

  /**
   * Configurar event handlers del WebSocket
   */
  private setupEventHandlers(connection: WebSocketConnection, key: string) {
    const { socket, instalacionId } = connection

    socket.onopen = () => {
      this.log(`[WS Manager] Conectado a instalación ${instalacionId}`)
      connection.reconnectAttempts = 0
      this.reconnectAttempts.set(key, 0)
      connection.isConnecting = false
      this.notifyStatus(key, 'open')
      
      // Limpiar timeout de reconexión si existe
      if (connection.reconnectTimeout) {
        clearTimeout(connection.reconnectTimeout)
        connection.reconnectTimeout = undefined
      }
    }

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        // Manejar evento de lectura creada
        if (message.type === 'lectura.created' && message.data) {
          this.log(`[WS Manager] Lectura recibida - Sensor: ${message.data.sensor_instalado_id}, Valor: ${message.data.valor}`)
          
          // Notificar a todos los suscriptores de esta instalación
          const subscribers = this.subscribers.get(key)
          if (subscribers && subscribers.size > 0) {
            subscribers.forEach(callback => {
              try {
                callback(message.data!)
              } catch (error) {
                this.warn('[WS Manager] Error en callback de suscriptor:', error)
              }
            })
          }
        } else if (message.type === 'error') {
          this.warn(`[WS Manager] Error del servidor:`, message.message)
        } else if (message.type === 'connected') {
          this.log(`[WS Manager] Conexión establecida:`, message.message)
        }
      } catch (error) {
        this.warn('[WS Manager] Error parseando mensaje:', error)
      }
    }

    socket.onerror = (error) => {
      this.notifyStatus(key, 'error', error)
      this.warn(`[WS Manager] Error en conexión de instalación ${instalacionId}:`, error)
      connection.isConnecting = false
    }

    socket.onclose = (event) => {
      this.log(`[WS Manager] Desconectado de instalación ${instalacionId} (code: ${event.code})`)
      connection.isConnecting = false
      this.notifyStatus(key, 'closed', event)
      
      // Limpiar conexión del pool
      this.connections.delete(key)

      // Intentar reconectar si no excedemos el límite y hay suscriptores
      const subscribers = this.subscribers.get(key)
      const attempts = this.reconnectAttempts.get(key) ?? connection.reconnectAttempts
      if (
        attempts < connection.maxReconnectAttempts &&
        subscribers &&
        subscribers.size > 0
      ) {
        // Calcular delay con backoff exponencial
        const delay = connection.reconnectDelay * Math.pow(2, attempts)
        const nextAttempts = attempts + 1
        connection.reconnectAttempts = nextAttempts
        this.reconnectAttempts.set(key, nextAttempts)

        this.log(`[WS Manager] Reconectando en ${delay}ms... (intento ${nextAttempts}/${connection.maxReconnectAttempts})`)

        connection.reconnectTimeout = setTimeout(() => {
          this.notifyStatus(key, 'connecting')
          this.log(`[WS Manager] Intentando reconectar instalación ${instalacionId}...`)
          this.getOrCreateConnection(instalacionId)
        }, delay)
      } else if (attempts >= connection.maxReconnectAttempts) {
        this.warn(`[WS Manager] Máximo de reintentos alcanzado para instalación ${instalacionId}`)
      }
    }
  }

  /**
   * Suscribirse a eventos de lecturas de una instalación
   * 
   * @param instalacionId - ID de la instalación a monitorear
   * @param callback - Función a ejecutar cuando se reciba una nueva lectura
   * @returns Función de cleanup para cancelar la suscripción
   */
  subscribe(instalacionId: number, callback: SubscriberCallback, onStatus?: ConnectionStatusCallback): () => void {
    const key = this.getConnectionKey(instalacionId)
    this.cancelPendingClose(key)

    // Crear set de suscriptores si no existe
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }

    // Añadir callback al set de suscriptores
    this.subscribers.get(key)!.add(callback)
    if (onStatus) {
      if (!this.statusSubscribers.has(key)) {
        this.statusSubscribers.set(key, new Set())
      }
      this.statusSubscribers.get(key)!.add(onStatus)
    }

    // Asegurar que la conexión existe
    const connection = this.getOrCreateConnection(instalacionId)
    if (onStatus && connection) {
      if (connection.socket.readyState === WebSocket.OPEN) onStatus('open')
      else if (connection.socket.readyState === WebSocket.CONNECTING) onStatus('connecting')
      else onStatus('closed')
    }

    this.log(`[WS Manager] Suscriptor añadido para instalación ${instalacionId} (total: ${this.subscribers.get(key)!.size})`)

    // Devolver función de cleanup
    return () => {
      const subscribers = this.subscribers.get(key)
      if (subscribers) {
        subscribers.delete(callback)
        this.log(`[WS Manager] Suscriptor eliminado de instalación ${instalacionId} (restantes: ${subscribers.size})`)

        const statusSet = this.statusSubscribers.get(key)
        if (onStatus && statusSet) {
          statusSet.delete(onStatus)
          if (statusSet.size === 0) this.statusSubscribers.delete(key)
        }

        // Si no quedan suscriptores, cerrar la conexión
        if (subscribers.size === 0) {
          const timeout = setTimeout(() => {
            const currentSubscribers = this.subscribers.get(key)
            if (!currentSubscribers || currentSubscribers.size === 0) {
              this.closeConnection(instalacionId)
            }
            this.pendingCloseTimeouts.delete(key)
          }, 500)
          this.pendingCloseTimeouts.set(key, timeout)
        }
      }
    }
  }

  /**
   * Cerrar conexión de una instalación específica
   */
  private closeConnection(instalacionId: number) {
    const key = this.getConnectionKey(instalacionId)
    const connection = this.connections.get(key)
    this.cancelPendingClose(key)

    if (connection) {
      this.log(`[WS Manager] Cerrando conexión de instalación ${instalacionId}`)
      
      // Limpiar timeout de reconexión
      if (connection.reconnectTimeout) {
        clearTimeout(connection.reconnectTimeout)
      }

      // Cerrar socket
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close()
      } else if (connection.socket.readyState === WebSocket.CONNECTING) {
        connection.socket.onopen = () => connection.socket.close()
      }

      // Eliminar del pool
      this.connections.delete(key)
      this.notifyStatus(key, 'closed')
    }

    // Limpiar suscriptores
    this.subscribers.delete(key)
    this.statusSubscribers.delete(key)
    this.reconnectAttempts.delete(key)
  }

  /**
   * Cerrar todas las conexiones
   */
  closeAll() {
    this.log('[WS Manager] Cerrando todas las conexiones...')

    this.pendingCloseTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.pendingCloseTimeouts.clear()
    
    this.connections.forEach((connection, key) => {
      if (connection.reconnectTimeout) {
        clearTimeout(connection.reconnectTimeout)
      }
      
      if (connection.socket.readyState === WebSocket.OPEN || 
          connection.socket.readyState === WebSocket.CONNECTING) {
        connection.socket.close()
      }
    })

    this.connections.clear()
    this.subscribers.clear()
    this.statusSubscribers.clear()
    this.reconnectAttempts.clear()
  }

  /**
   * Obtener estadísticas de conexiones activas
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce(
        (total, set) => total + set.size,
        0
      ),
      connections: Array.from(this.connections.entries()).map(([key, conn]) => ({
        key,
        instalacionId: conn.instalacionId,
        isConnecting: conn.isConnecting,
        readyState: conn.socket.readyState,
        reconnectAttempts: conn.reconnectAttempts,
        subscribers: this.subscribers.get(key)?.size || 0
      }))
    }
  }
}

// Singleton global
export const wsManager = new WebSocketManager()

// Exportar tipos
export type { LecturaData, WebSocketMessage, ConnectionStatus }
