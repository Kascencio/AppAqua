"use client"

import { useEffect, useRef, useState } from "react"

type AnimatedNumberProps = {
  value: number
  durationMs?: number
  format?: (value: number) => string
  className?: string
}

export function AnimatedNumber({
  value,
  durationMs = 500,
  format,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value)
  const fromRef = useRef<number>(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = Number.isFinite(value) ? value : 0

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    // If nothing changed, keep stable.
    if (from === to || durationMs <= 0) {
      setDisplay(to)
      fromRef.current = to
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (to - from) * eased
      setDisplay(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [value, durationMs])

  const text = format ? format(display) : String(Math.round(display))

  return <span className={className}>{text}</span>
}
