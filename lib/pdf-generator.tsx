import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { EmpresaSucursal, Instalacion, SensorInstalado, CatalogoSensor, Lectura } from "@/types"

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 24,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 24,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b5563",
    width: 100,
  },
  infoValue: {
    fontSize: 10,
    color: "#111827",
    flex: 1,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    flex: 1,
    textAlign: "left",
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    textAlign: "left",
  },
  statusOptimal: {
    color: "#22c55e",
    fontWeight: "bold",
  },
  statusWarning: {
    color: "#eab308",
    fontWeight: "bold",
  },
  statusCritical: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  noData: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    padding: 12,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    fontSize: 8,
    color: "#9ca3af",
  },
})

// Helper function to determine sensor status
const getSensorStatus = (value: number, optimalMin: number, optimalMax: number) => {
  if (value >= optimalMin && value <= optimalMax) {
    return { status: "ÓPTIMO", style: styles.statusOptimal }
  } else if ((value >= optimalMin - 2 && value < optimalMin) || (value > optimalMax && value <= optimalMax + 2)) {
    return { status: "ADVERTENCIA", style: styles.statusWarning }
  } else {
    return { status: "CRÍTICO", style: styles.statusCritical }
  }
}

// Helper function to get optimal ranges for different sensor types
const getOptimalRange = (sensorType: string) => {
  const ranges: Record<string, { min: number; max: number; unit: string }> = {
    pH: { min: 6.5, max: 8.5, unit: "pH" },
    Temperatura: { min: 22, max: 30, unit: "°C" },
    "Oxígeno Disuelto": { min: 5, max: 12, unit: "mg/L" },
    Conductividad: { min: 100, max: 1000, unit: "µS/cm" },
    Turbidez: { min: 0, max: 10, unit: "NTU" },
    Amonio: { min: 0, max: 0.5, unit: "mg/L" },
    Nitrito: { min: 0, max: 0.1, unit: "mg/L" },
    Nitrato: { min: 0, max: 40, unit: "mg/L" },
  }
  return ranges[sensorType] || { min: 0, max: 100, unit: "" }
}

// PDF Document Component
const PDFDocument = ({
  instalaciones,
  sensoresInstalados,
  catalogoSensores,
  lecturas,
  sucursales,
}: {
  instalaciones: Instalacion[]
  sensoresInstalados: SensorInstalado[]
  catalogoSensores: CatalogoSensor[]
  lecturas: Lectura[]
  sucursales?: EmpresaSucursal[]
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reporte de {sucursales ? "Sucursales e" : ""} Instalaciones</Text>
        <Text style={styles.subtitle}>Generado el: {new Date().toLocaleString("es-ES")}</Text>
        <Text style={styles.subtitle}>Total de instalaciones: {instalaciones.length}</Text>
      </View>

      {/* Content */}
      {instalaciones.map((instalacion, index) => {
        const instalacionSensores = sensoresInstalados.filter(
          (sensor) => sensor.id_instalacion === instalacion.id_instalacion,
        )

        const sucursal = sucursales?.find((s) => s.id_empresa_sucursal === instalacion.id_empresa_sucursal)

        return (
          <View key={instalacion.id_instalacion} style={styles.section}>
            {/* Installation Header */}
            <Text style={styles.sectionTitle}>{instalacion.nombre_instalacion}</Text>

            {sucursal && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sucursal:</Text>
                <Text style={styles.infoValue}>{sucursal.nombre}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de uso:</Text>
              <Text style={styles.infoValue}>
                {instalacion.tipo_uso.charAt(0).toUpperCase() + instalacion.tipo_uso.slice(1)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Especie:</Text>
              <Text style={styles.infoValue}>{instalacion.nombre_proceso || "No especificada"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <Text style={styles.infoValue}>{instalacion.estado_operativo === "activo" ? "Activo" : "Inactivo"}</Text>
            </View>

            {/* Sensors Table */}
            {instalacionSensores.length > 0 ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Sensor</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1 }]}>Instalación</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1 }]}>Última Lectura</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1 }]}>Estado</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Rango Óptimo</Text>
                </View>

                {instalacionSensores.map((sensor) => {
                  const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor.id_sensor)
                  const ultimaLectura = lecturas
                    .filter((lectura) => lectura.id_sensor_instalado === sensor.id_sensor_instalado)
                    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())[0]

                  const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
                  const sensorStatus = ultimaLectura
                    ? getSensorStatus(ultimaLectura.valor, optimalRange.min, optimalRange.max)
                    : { status: "SIN DATOS", style: styles.noData }

                  return (
                    <View key={sensor.id_sensor_instalado} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>
                        {sensorInfo?.sensor || "Sensor desconocido"}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{sensor.fecha_instalada}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>
                        {ultimaLectura ? `${ultimaLectura.valor} ${optimalRange.unit}` : "Sin datos"}
                      </Text>
                      <Text style={[styles.tableCell, sensorStatus.style, { flex: 1 }]}>{sensorStatus.status}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>
                        {optimalRange.min} - {optimalRange.max} {optimalRange.unit}
                      </Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <Text style={styles.noData}>No hay sensores instalados en esta instalación</Text>
            )}

            {/* Events out of range */}
            <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 12 }]}>
              Eventos fuera de rango (últimos 7 días)
            </Text>

            {(() => {
              const eventosOutOfRange = lecturas
                .filter((lectura) => {
                  const sensor = sensoresInstalados.find(
                    (s) =>
                      s.id_sensor_instalado === lectura.id_sensor_instalado &&
                      s.id_instalacion === instalacion.id_instalacion,
                  )
                  if (!sensor) return false

                  const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor.id_sensor)
                  const optimalRange = getOptimalRange(sensorInfo?.sensor || "")

                  return lectura.valor < optimalRange.min || lectura.valor > optimalRange.max
                })
                .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
                .slice(0, 10) // Últimos 10 eventos

              return eventosOutOfRange.length > 0 ? (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, { flex: 1 }]}>Fecha</Text>
                    <Text style={[styles.tableCellHeader, { flex: 1 }]}>Hora</Text>
                    <Text style={[styles.tableCellHeader, { flex: 1 }]}>Valor</Text>
                    <Text style={[styles.tableCellHeader, { flex: 1 }]}>Estado</Text>
                  </View>
                  {eventosOutOfRange.map((evento, idx) => {
                    const sensor = sensoresInstalados.find((s) => s.id_sensor_instalado === evento.id_sensor_instalado)
                    const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor?.id_sensor)
                    const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
                    const status = getSensorStatus(evento.valor, optimalRange.min, optimalRange.max)

                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 1 }]}>
                          {new Date(evento.fecha_hora).toLocaleDateString("es-ES")}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>
                          {new Date(evento.fecha_hora).toLocaleTimeString("es-ES")}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>
                          {evento.valor} {optimalRange.unit}
                        </Text>
                        <Text style={[styles.tableCell, status.style, { flex: 1 }]}>{status.status}</Text>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <Text style={styles.noData}>Sin registros fuera de rango en los últimos 7 días</Text>
              )
            })()}
          </View>
        )
      })}

      {/* Footer */}
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
)

// Main PDF generation functions
export const generatePdfReport = async (
  instalaciones: Instalacion[],
  sensoresInstalados: SensorInstalado[],
  catalogoSensores: CatalogoSensor[],
  lecturas: Lectura[],
  sucursales?: EmpresaSucursal[],
) => {
  const doc = (
    <PDFDocument
      instalaciones={instalaciones}
      sensoresInstalados={sensoresInstalados}
      catalogoSensores={catalogoSensores}
      lecturas={lecturas}
      sucursales={sucursales}
    />
  )

  const asPdf = pdf(doc)
  const blob = await asPdf.toBlob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `reporte-instalaciones-${new Date().toISOString().split("T")[0]}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// For Sucursales module
export const generateSucursalesPdfReport = async (
  sucursales: EmpresaSucursal[],
  instalaciones: Instalacion[],
  sensoresInstalados: SensorInstalado[],
  catalogoSensores: CatalogoSensor[],
  lecturas: Lectura[],
) => {
  const instalacionesFiltered = instalaciones.filter((instalacion) =>
    sucursales.some((sucursal) => sucursal.id_empresa_sucursal === instalacion.id_empresa_sucursal),
  )

  await generatePdfReport(instalacionesFiltered, sensoresInstalados, catalogoSensores, lecturas, sucursales)
}
