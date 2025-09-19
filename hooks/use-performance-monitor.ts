"use client"

import { useEffect, useRef, useState } from "react"

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  fps: number
  loadTime: number
  networkRequests: number
  cacheHitRate: number
}

interface PerformanceAlert {
  type: "warning" | "error"
  message: string
  metric: keyof PerformanceMetrics
  value: number
  threshold: number
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    loadTime: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  })

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const renderTimes = useRef<number[]>([])

  // Monitorear FPS
  useEffect(() => {
    let animationId: number

    const measureFPS = () => {
      frameCount.current++
      const currentTime = performance.now()

      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))

        setMetrics((prev) => ({ ...prev, fps }))

        // Alerta si FPS es muy bajo
        if (fps < 30) {
          setAlerts((prev) => [
            ...prev,
            {
              type: "warning",
              message: `FPS bajo detectado: ${fps}`,
              metric: "fps",
              value: fps,
              threshold: 30,
            },
          ])
        }

        frameCount.current = 0
        lastTime.current = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(animationId)
  }, [])

  // Monitorear memoria
  useEffect(() => {
    const measureMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB

        setMetrics((prev) => ({ ...prev, memoryUsage }))

        // Alerta si uso de memoria es alto
        if (memoryUsage > 100) {
          setAlerts((prev) => [
            ...prev,
            {
              type: "warning",
              message: `Alto uso de memoria: ${memoryUsage}MB`,
              metric: "memoryUsage",
              value: memoryUsage,
              threshold: 100,
            },
          ])
        }
      }
    }

    const interval = setInterval(measureMemory, 5000)
    return () => clearInterval(interval)
  }, [])

  // Monitorear tiempo de renderizado
  const measureRenderTime = (componentName: string) => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      renderTimes.current.push(renderTime)
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift()
      }

      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length

      setMetrics((prev) => ({ ...prev, renderTime: avgRenderTime }))

      // Alerta si tiempo de renderizado es alto
      if (renderTime > 16) {
        // 60fps = 16ms por frame
        setAlerts((prev) => [
          ...prev,
          {
            type: "warning",
            message: `Renderizado lento en ${componentName}: ${renderTime.toFixed(2)}ms`,
            metric: "renderTime",
            value: renderTime,
            threshold: 16,
          },
        ])
      }
    }
  }

  // Monitorear requests de red
  const trackNetworkRequest = (url: string, duration: number, fromCache: boolean) => {
    setMetrics((prev) => ({
      ...prev,
      networkRequests: prev.networkRequests + 1,
      cacheHitRate: fromCache
        ? (prev.cacheHitRate * prev.networkRequests + 1) / (prev.networkRequests + 1)
        : (prev.cacheHitRate * prev.networkRequests) / (prev.networkRequests + 1),
    }))
  }

  // Limpiar alertas
  const clearAlerts = () => setAlerts([])

  // Obtener reporte de rendimiento
  const getPerformanceReport = () => {
    return {
      metrics,
      alerts,
      recommendations: generateRecommendations(metrics, alerts),
    }
  }

  return {
    metrics,
    alerts,
    measureRenderTime,
    trackNetworkRequest,
    clearAlerts,
    getPerformanceReport,
  }
}

function generateRecommendations(metrics: PerformanceMetrics, alerts: PerformanceAlert[]) {
  const recommendations: string[] = []

  if (metrics.fps < 30) {
    recommendations.push("Considera reducir la complejidad de las animaciones o usar React.memo en más componentes")
  }

  if (metrics.memoryUsage > 100) {
    recommendations.push("Revisa si hay memory leaks en useEffect o referencias circulares")
  }

  if (metrics.renderTime > 16) {
    recommendations.push("Optimiza los componentes que se renderizan frecuentemente con useMemo y useCallback")
  }

  if (metrics.cacheHitRate < 0.7) {
    recommendations.push("Mejora la estrategia de cache para reducir requests de red")
  }

  return recommendations
}
