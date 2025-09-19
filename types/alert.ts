import type { SensorParameter } from "./sensor"

export type AlertSeverity = "low" | "medium" | "high" | "critical"
export type AlertStatus = "active" | "acknowledged" | "resolved"

export interface Alert {
  id: string
  facilityId: string
  facilityName: string
  branchId: string
  branchName: string
  parameter: SensorParameter
  value: number
  minValue: number
  maxValue: number
  timestamp: Date
  severity: AlertSeverity
  status: AlertStatus
  acknowledgedBy?: string
  resolvedBy?: string
  resolvedAt?: Date
  notes?: string
}
