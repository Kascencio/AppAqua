import type { EmpresaSucursalCompleta } from "@/types"
import type { User } from "@/types/user"

function toPositiveNumber(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN
  if (!Number.isFinite(num)) return null
  const normalized = Math.trunc(num)
  return normalized > 0 ? normalized : null
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toText(value: unknown): string {
  return String(value ?? "").trim()
}

function toDirectoryStatus(value: unknown): "activa" | "inactiva" {
  const normalized = toText(value).toLowerCase()
  return normalized === "inactivo" || normalized === "inactive" || normalized === "inactiva"
    ? "inactiva"
    : "activa"
}

function sortDirectory(entries: EmpresaSucursalCompleta[]): EmpresaSucursalCompleta[] {
  return [...entries].sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === "empresa" ? -1 : 1
    }
    return String(a.nombre || "").localeCompare(String(b.nombre || ""))
  })
}

export function canReadOrganizationDirectory(role: User["role"] | null | undefined): boolean {
  return role === "superadmin" || role === "admin"
}

export function deriveDirectoryFromInstalaciones(instalaciones: any[]): {
  organizaciones: EmpresaSucursalCompleta[]
  sucursales: EmpresaSucursalCompleta[]
} {
  const organizaciones = new Map<number, EmpresaSucursalCompleta>()
  const sucursales = new Map<number, EmpresaSucursalCompleta>()

  for (const inst of instalaciones) {
    const organizationId = toPositiveNumber(inst?.id_organizacion)
    const organizationName = toText(inst?.nombre_organizacion ?? inst?.nombre_empresa)
    const branchId = toPositiveNumber(inst?.id_organizacion_sucursal ?? inst?.id_empresa_sucursal ?? inst?.id_sucursal)
    const branchName = toText(inst?.sucursal_nombre)
    const registeredAt = String(inst?.fecha_instalacion ?? inst?.created_at ?? new Date().toISOString())

    if (organizationId && organizationName && !organizaciones.has(organizationId)) {
      organizaciones.set(organizationId, {
        id_empresa_sucursal: organizationId,
        nombre: organizationName,
        tipo: "empresa",
        estado_operativo: "activa",
        fecha_registro: registeredAt,
        id_estado: 0,
        id_cp: 0,
        id_colonia: 0,
        calle: "",
        telefono: null,
        email: null,
        latitud: null,
        longitud: null,
      })
    }

    if (branchId && branchName && !sucursales.has(branchId)) {
      sucursales.set(branchId, {
        id_empresa_sucursal: 10000 + branchId,
        id_padre: organizationId,
        nombre: branchName,
        tipo: "sucursal",
        estado_operativo: toDirectoryStatus(inst?.estado_operativo),
        fecha_registro: registeredAt,
        id_estado: 0,
        id_cp: 0,
        id_colonia: 0,
        calle: toText(inst?.ubicacion),
        telefono: null,
        email: null,
        latitud: toNullableNumber(inst?.latitud),
        longitud: toNullableNumber(inst?.longitud),
        padre: organizationName || undefined,
      })
    }
  }

  return {
    organizaciones: sortDirectory(Array.from(organizaciones.values())),
    sucursales: sortDirectory(Array.from(sucursales.values())),
  }
}
