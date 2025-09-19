"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function BranchStatusChart() {
  return (
    <ChartContainer
      config={{
        activas: {
          label: "Instalaciones Activas",
          color: "hsl(var(--chart-1))",
        },
        inactivas: {
          label: "Instalaciones Inactivas",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="activas" fill="var(--color-activas)" />
          <Bar dataKey="inactivas" fill="var(--color-inactivas)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
