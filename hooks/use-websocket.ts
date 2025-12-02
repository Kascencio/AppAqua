"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getWebSocketUrl } from "@/lib/external-api-client"

export interface WebSocketMessage {
  type: string
  sensorId: string | number
  data?: any
  timestamp?: string
  value?: number
  status?: "normal" | "warning" | "critical" | "offline"
}

export interface UseWebSocketOptions {
  sensorId?: string | number
  sensorIds?: (string | number)[]
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectInterval?: number
  enabled?: boolean
}

/**
 * Hook para manejar conexiones WebSocket individuales por sensor
 * Permite actualizar solo la card específica sin recargar toda la página
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    sensorId,
    sensorIds,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    enabled = true,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Obtener IDs de sensores a suscribir
  const targetSensorIds = sensorIds || (sensorId ? [sensorId] : [])

  const connect = useCallback(() => {
    if (!enabled || targetSensorIds.length === 0) {
      return
    }

    const wsUrl = getWebSocketUrl()
    if (!wsUrl) {
      setError("WebSocket URL no configurada. Verifique NEXT_PUBLIC_WS_URL en las variables de entorno.")
      return
    }

    try {
      // Cerrar conexión existente si hay
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Obtener token de autenticación
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1] || localStorage.getItem('access_token')

      // Construir URL con token si está disponible
      const urlWithAuth = token ? `${wsUrl}?token=${token}` : wsUrl

      const ws = new WebSocket(urlWithAuth)

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        
        // Suscribirse a los sensores específicos
        if (targetSensorIds.length > 0) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            sensorIds: targetSensorIds,
          }))
        }

        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        setError("Error en la conexión WebSocket")
        onError?.(event)
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnect?.()

        // Intentar reconectar si no excedimos el límite
        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, reconnectInterval)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("No se pudo conectar después de varios intentos")
        }
      }

      wsRef.current = ws
    } catch (err) {
      setError(`Error al conectar WebSocket: ${err}`)
    }
  }, [enabled, targetSensorIds, onMessage, onError, onConnect, onDisconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket no está conectado. No se puede enviar mensaje.")
    }
  }, [])

  useEffect(() => {
    if (enabled && targetSensorIds.length > 0) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, targetSensorIds.join(','), connect, disconnect])

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
  }
}

