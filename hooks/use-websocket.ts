"use client"

import { useEffect, useState } from "react"
import { wsManager, type LecturaData } from "@/lib/websocket-manager"

export interface WebSocketMessage {
  type: string
  sensorId: string | number
  data?: any
  timestamp?: string
  value?: number
  status?: "normal" | "warning" | "critical" | "offline"
  parameter?: string
  unit?: string
}

export interface UseWebSocketOptions {
  sensorId?: string | number
  instalacionId?: string | number
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
  enabled?: boolean
}

/**
 * Hook para manejar conexiones WebSocket usando el manager global
 * 
 * IMPORTANTE: El backend NO soporta suscripción dinámica.
 * Se conecta por instalación y filtra eventos por sensor si se especifica.
 * 
 * Permite actualizar solo la card específica sin recargar toda la página.
 * 
 * @example
 * const { isConnected, lastMessage } = useWebSocket({
 *   instalacionId: 5,
 *   sensorId: 123, // Opcional: filtrar por sensor específico
 *   onMessage: (msg) => console.log(msg)
 * })
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    sensorId,
    instalacionId,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    enabled = true,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Validar que tengamos instalacionId
    if (!enabled || !instalacionId) {
      if (!instalacionId && enabled) {
        const errorMsg = "useWebSocket requiere instalacionId para funcionar correctamente"
        setError(errorMsg)
        onError?.(errorMsg)
        console.warn("[useWebSocket]", errorMsg)
      }
      return
    }

    const instId = Number(instalacionId)
    if (isNaN(instId)) {
      const errorMsg = `instalacionId inválido: ${instalacionId}`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsConnected(true)
    setError(null)
    onConnect?.()

    // Suscribirse al WebSocketManager
    const unsubscribe = wsManager.subscribe(instId, (data: LecturaData) => {
      // Filtrar por sensor específico si se proporciona
      if (sensorId && data.sensor_instalado_id !== Number(sensorId)) {
        return
      }

      // Mapear datos del backend al formato esperado por los componentes
      const mappedMessage: WebSocketMessage = {
        type: 'reading_update',
        sensorId: data.sensor_instalado_id,
        value: data.valor,
        timestamp: data.tomada_en,
        parameter: data.tipo_medida,
        status: 'normal', // TODO: determinar status basado en umbrales
        data: data
      }

      setLastMessage(mappedMessage)
      onMessage?.(mappedMessage)
    })

    // Cleanup al desmontar
    return () => {
      unsubscribe()
      setIsConnected(false)
      onDisconnect?.()
    }
  }, [enabled, instalacionId, sensorId, onMessage, onError, onConnect, onDisconnect])

  return {
    isConnected,
    lastMessage,
    error,
  }
}

