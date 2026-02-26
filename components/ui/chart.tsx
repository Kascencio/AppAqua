"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
>

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactElement
  }
>(({ className, config, style, children, ...props }, ref) => {
  const chartVars = React.useMemo(() => {
    return Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color
      }
      return acc
    }, {})
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn("w-full text-xs", className)}
        style={{
          ...chartVars,
          ...style,
        }}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

type TooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  labelFormatter,
  valueFormatter,
}: React.ComponentProps<"div"> & {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "dot" | "line"
  labelFormatter?: (value: string | number | undefined) => React.ReactNode
  valueFormatter?: (value: number | string | undefined, name: string | undefined, item: TooltipPayloadItem) => React.ReactNode
}) {
  const { config } = useChart()

  if (!active || !payload || payload.length === 0) return null

  const labelContent = hideLabel
    ? null
    : (labelFormatter ? labelFormatter(label) : (label ?? ""))

  return (
    <div className={cn("grid min-w-[8rem] gap-1.5 rounded-lg border bg-background p-2.5 shadow-xl", className)}>
      {labelContent ? <div className="font-medium text-foreground">{labelContent}</div> : null}
      <div className="grid gap-1">
        {payload.map((item, index) => {
          const dataKey = String(item.dataKey || item.name || "")
          const itemConfig = config[dataKey]
          const color = item.color || itemConfig?.color || "hsl(var(--foreground))"
          const labelText = itemConfig?.label || item.name || dataKey

          return (
            <div key={`${dataKey}-${index}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                {!hideIndicator && indicator === "dot" ? (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                ) : null}
                {!hideIndicator && indicator === "line" ? (
                  <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} />
                ) : null}
                <span>{labelText}</span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {valueFormatter ? valueFormatter(item.value, item.name, item) : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type LegendPayloadItem = {
  value?: string
  color?: string
  dataKey?: string
}

function ChartLegendContent({
  payload,
  className,
}: React.ComponentProps<"div"> & { payload?: LegendPayloadItem[] }) {
  const { config } = useChart()
  if (!payload || payload.length === 0) return null

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey || item.value || "")
        const itemConfig = config[key]
        const color = item.color || itemConfig?.color || "hsl(var(--foreground))"
        const label = itemConfig?.label || item.value || key
        return (
          <div key={`${key}-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
}
