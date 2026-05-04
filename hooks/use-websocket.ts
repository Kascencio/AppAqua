"use client"

import { useEffect, useRef, useState } from "react"
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
  const callbacksRef = useRef({ onMessage, onError, onConnect, onDisconnect })

  useEffect(() => {
    callbacksRef.current = { onMessage, onError, onConnect, onDisconnect }
  }, [onMessage, onError, onConnect, onDisconnect])

  useEffect(() => {
    // Validar que tengamos instalacionId
    if (!enabled || !instalacionId) {
      if (!instalacionId && enabled) {
        const errorMsg = "useWebSocket requiere instalacionId para funcionar correctamente"
        setError(errorMsg)
        callbacksRef.current.onError?.(errorMsg)
      }
      setIsConnected(false)
      return
    }

    const instId = Number(instalacionId)
    if (isNaN(instId)) {
      const errorMsg = `instalacionId inválido: ${instalacionId}`
      setError(errorMsg)
      callbacksRef.current.onError?.(errorMsg)
      setIsConnected(false)
      return
    }

    setError(null)
    setIsConnected(false)

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
      callbacksRef.current.onMessage?.(mappedMessage)
    }, (status) => {
      if (status === 'open') {
        setIsConnected(true)
        setError(null)
        callbacksRef.current.onConnect?.()
        return
      }

      if (status === 'connecting') {
        setIsConnected(false)
        setError(null)
        return
      }

      if (status === 'error') {
        const errorMsg = 'Error en la conexión WebSocket'
        setIsConnected(false)
        setError(errorMsg)
        callbacksRef.current.onError?.(errorMsg)
        return
      }

      setIsConnected(false)
      callbacksRef.current.onDisconnect?.()
    })

    // Cleanup al desmontar
    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [enabled, instalacionId, sensorId])

  return {
    isConnected,
    lastMessage,
    error,
  }
}
