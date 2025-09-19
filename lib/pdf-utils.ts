import type { EmpresaSucursal, Instalacion, SensorInstalado, CatalogoSensor, Lectura, Especie } from "@/types"

// Helper function to get optimal range for different sensor types
export const getOptimalRange = (sensorType: string) => {
  const ranges: Record<string, { min: number; max: number; unit: string }> = {
    pH: { min: 6.5, max: 8.5, unit: "pH" },
    Temperatura: { min: 22, max: 30, unit: "°C" },
    "Oxígeno Disuelto": { min: 5, max: 12, unit: "mg/L" },
    Conductividad: { min: 100, max: 1000, unit: "µS/cm" },
    Turbidez: { min: 0, max: 10, unit: "NTU" },
    Amonio: { min: 0, max: 0.5, unit: "mg/L" },
    Nitrito: { min: 0, max: 0.1, unit: "mg/L" },
    Nitrato: { min: 0, max: 40, unit: "mg/L" },
    Salinidad: { min: 0, max: 35, unit: "ppt" },
    Alcalinidad: { min: 80, max: 120, unit: "mg/L" },
  }
  return ranges[sensorType] || { min: 0, max: 100, unit: "" }
}

// Helper function to get sensor status with color
export const getSensorStatus = (value: number, optimalMin: number, optimalMax: number) => {
  if (value >= optimalMin && value <= optimalMax) {
    return { status: "ÓPTIMO", color: "#22c55e", bgColor: "#dcfce7" }
  } else if ((value >= optimalMin - 2 && value < optimalMin) || (value > optimalMax && value <= optimalMax + 2)) {
    return { status: "ADVERTENCIA", color: "#eab308", bgColor: "#fef3c7" }
  } else {
    return { status: "CRÍTICO", color: "#dc2626", bgColor: "#fee2e2" }
  }
}

// Common CSS styles for PDF reports
export const getPdfStyles = () => `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    margin: 0; 
    padding: 20px; 
    background: white;
    color: #333;
    line-height: 1.5;
    font-size: 12px;
  }
  .header { 
    text-align: center; 
    margin-bottom: 30px; 
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 8px;
    padding: 20px;
  }
  .header h1 {
    color: #1e40af;
    font-size: 28px;
    margin: 0 0 10px 0;
    font-weight: bold;
  }
  .header .subtitle {
    color: #64748b;
    font-size: 16px;
    margin: 5px 0;
  }
  .header .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }
  .stat-card {
    background: white;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    text-align: center;
  }
  .stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #1e40af;
  }
  .stat-label {
    font-size: 12px;
    color: #64748b;
    margin-top: 5px;
  }
  .section { 
    border: 1px solid #e5e7eb; 
    margin: 25px 0; 
    padding: 25px; 
    border-radius: 12px;
    background: #fafafa;
    page-break-inside: avoid;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .section-header { 
    font-size: 20px; 
    font-weight: bold; 
    margin-bottom: 20px;
    color: #1f2937;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-icon {
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
  }
  .info-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
    gap: 20px; 
    margin-bottom: 25px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .info-item { 
    margin: 8px 0; 
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .info-label { 
    font-weight: bold; 
    color: #374151;
    min-width: 120px;
    font-size: 13px;
  }
  .info-value {
    color: #1f2937;
    flex: 1;
  }
  .badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .badge-empresa { background: #dbeafe; color: #1e40af; }
  .badge-sucursal { background: #e0e7ff; color: #5b21b6; }
  .badge-activo { background: #dcfce7; color: #166534; }
  .badge-inactivo { background: #fee2e2; color: #991b1b; }
  .badge-acuicultura { background: #dbeafe; color: #1e40af; }
  .badge-tratamiento { background: #dcfce7; color: #166534; }
  .badge-otros { background: #f3e8ff; color: #7c3aed; }
  .subsection { 
    margin-top: 25px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .subsection-header {
    background: #f8fafc;
    padding: 15px 20px;
    font-weight: bold;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
    font-size: 16px;
  }
  .subsection-content {
    padding: 20px;
  }
  .installation-card { 
    background: white; 
    padding: 20px; 
    margin: 15px 0; 
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .installation-header {
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 15px;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sensors-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 11px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .sensors-table th {
    background: #f1f5f9;
    padding: 12px 8px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    font-weight: bold;
    color: #475569;
    font-size: 12px;
  }
  .sensors-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #f1f5f9;
    color: #1f2937;
  }
  .sensors-table tr:hover {
    background: #f8fafc;
  }
  .sensors-table tr:last-child td {
    border-bottom: none;
  }
  .status-optimal { 
    color: #22c55e; 
    font-weight: bold; 
    background: #dcfce7;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
  }
  .status-warning { 
    color: #eab308; 
    font-weight: bold; 
    background: #fef3c7;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
  }
  .status-critical { 
    color: #dc2626; 
    font-weight: bold; 
    background: #fee2e2;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
  }
  .no-data { 
    color: #9ca3af; 
    font-style: italic; 
    text-align: center; 
    padding: 30px;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px dashed #d1d5db;
  }
  .events-section {
    margin-top: 20px;
    background: #fefbf3;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #fed7aa;
  }
  .events-title {
    font-weight: bold;
    color: #ea580c;
    margin-bottom: 15px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }
  .summary-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .summary-card h3 {
    margin: 0 0 10px 0;
    color: #1f2937;
    font-size: 14px;
  }
  .summary-card .number {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 11px;
  }
  .page-break {
    page-break-before: always;
  }
  @media print {
    body { margin: 0; font-size: 11px; }
    .section { page-break-inside: avoid; margin: 15px 0; }
    .installation-card { page-break-inside: avoid; }
    .sensors-table { page-break-inside: avoid; }
  }
`

// Generate comprehensive PDF report for sucursales
export const generateSucursalesPdfReport = (
  sucursales: EmpresaSucursal[],
  instalaciones: Instalacion[],
  sensores: SensorInstalado[],
  catalogoSensores: CatalogoSensor[],
  lecturas: Lectura[],
  especies?: Especie[],
) => {
  const fecha = new Date().toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calculate statistics
  const totalInstalaciones = instalaciones.filter((i) =>
    sucursales.some((s) => s.id_empresa_sucursal === i.id_empresa_sucursal),
  ).length

  const totalSensores = sensores.filter((sensor) =>
    instalaciones.some(
      (inst) =>
        inst.id_instalacion === sensor.id_instalacion &&
        sucursales.some((s) => s.id_empresa_sucursal === inst.id_empresa_sucursal),
    ),
  ).length

  const sensoresActivos = sensores.filter((sensor) => {
    const instalacion = instalaciones.find((inst) => inst.id_instalacion === sensor.id_instalacion)
    return (
      instalacion &&
      instalacion.estado_operativo === "activo" &&
      sucursales.some((s) => s.id_empresa_sucursal === instalacion.id_empresa_sucursal)
    )
  }).length

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Sucursales - ${new Date().toLocaleDateString()}</title>
      <meta charset="UTF-8">
      <style>${getPdfStyles()}</style>
    </head>
    <body>
      <div class="header">
        <h1>🏢 Reporte de Monitoreo Acuícola</h1>
        <div class="subtitle">Análisis Integral de Sucursales e Instalaciones</div>
        <div class="subtitle">Generado el: ${fecha}</div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${sucursales.length}</div>
            <div class="stat-label">Sucursales</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalInstalaciones}</div>
            <div class="stat-label">Instalaciones</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalSensores}</div>
            <div class="stat-label">Sensores</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${sensoresActivos}</div>
            <div class="stat-label">Sensores Activos</div>
          </div>
        </div>
      </div>
  `

  sucursales.forEach((sucursal, index) => {
    const sucursalInstalaciones = instalaciones.filter(
      (instalacion) => instalacion.id_empresa_sucursal === sucursal.id_empresa_sucursal,
    )

    const sucursalSensores = sensores.filter((sensor) =>
      sucursalInstalaciones.some((inst) => inst.id_instalacion === sensor.id_instalacion),
    )

    htmlContent += `
      ${index > 0 ? '<div class="page-break"></div>' : ""}
      <div class="section">
        <div class="section-header">
          <span class="section-icon">${index + 1}</span>
          ${sucursal.nombre}
          <span class="badge badge-${sucursal.tipo}">${sucursal.tipo === "empresa" ? "Empresa" : "Sucursal"}</span>
          <span class="badge badge-${sucursal.estado_operativo === "activa" ? "activo" : "inactivo"}">
            ${sucursal.estado_operativo === "activa" ? "Activa" : "Inactiva"}
          </span>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">🆔 ID:</span>
            <span class="info-value">${sucursal.id_empresa_sucursal}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📍 Ubicación:</span>
            <span class="info-value">${sucursal.estado || "No especificado"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📞 Teléfono:</span>
            <span class="info-value">${sucursal.telefono || "No especificado"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📧 Email:</span>
            <span class="info-value">${sucursal.email || "No especificado"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📅 Fecha registro:</span>
            <span class="info-value">${new Date(sucursal.fecha_registro).toLocaleDateString("es-ES")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">🏭 Instalaciones:</span>
            <span class="info-value">${sucursalInstalaciones.length}</span>
          </div>
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <h3>Instalaciones Activas</h3>
            <div class="number">${sucursalInstalaciones.filter((i) => i.estado_operativo === "activo").length}</div>
          </div>
          <div class="summary-card">
            <h3>Total Sensores</h3>
            <div class="number">${sucursalSensores.length}</div>
          </div>
          <div class="summary-card">
            <h3>Sensores Activos</h3>
            <div class="number">${
              sucursalSensores.filter((s) => {
                const inst = sucursalInstalaciones.find((i) => i.id_instalacion === s.id_instalacion)
                return inst?.estado_operativo === "activo"
              }).length
            }</div>
          </div>
        </div>
    `

    if (sucursalInstalaciones.length > 0) {
      htmlContent += `
        <div class="subsection">
          <div class="subsection-header">
            🏭 Instalaciones Detalladas (${sucursalInstalaciones.length})
          </div>
          <div class="subsection-content">
      `

      sucursalInstalaciones.forEach((instalacion) => {
        const instalacionSensores = sensores.filter((sensor) => sensor.id_instalacion === instalacion.id_instalacion)
        const especie = especies?.find((e) => e.id_especie === instalacion.id_proceso)

        htmlContent += `
          <div class="installation-card">
            <div class="installation-header">
              🏭 ${instalacion.nombre_instalacion}
              <span class="badge badge-${instalacion.tipo_uso}">${instalacion.tipo_uso}</span>
              <span class="badge badge-${instalacion.estado_operativo === "activo" ? "activo" : "inactivo"}">
                ${instalacion.estado_operativo === "activo" ? "Activo" : "Inactivo"}
              </span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📝 Descripción:</span>
                <span class="info-value">${instalacion.descripcion}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🐟 Especie:</span>
                <span class="info-value">${especie?.nombre_comun || instalacion.nombre_proceso || "No especificada"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Fecha instalación:</span>
                <span class="info-value">${new Date(instalacion.fecha_instalacion).toLocaleDateString("es-ES")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🔧 Sensores:</span>
                <span class="info-value">${instalacionSensores.length}</span>
              </div>
            </div>
        `

        if (instalacionSensores.length > 0) {
          htmlContent += `
            <table class="sensors-table">
              <thead>
                <tr>
                  <th>🔧 Sensor</th>
                  <th>📅 Instalación</th>
                  <th>📊 Última Lectura</th>
                  <th>⚡ Estado</th>
                  <th>📏 Rango Óptimo</th>
                  <th>📈 Tendencia</th>
                </tr>
              </thead>
              <tbody>
          `

          instalacionSensores.forEach((sensor) => {
            const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor.id_sensor)
            const sensorLecturas = lecturas
              .filter((lectura) => lectura.id_sensor_instalado === sensor.id_sensor_instalado)
              .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())

            const ultimaLectura = sensorLecturas[0]
            const penultimaLectura = sensorLecturas[1]

            const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
            const sensorStatus = ultimaLectura
              ? getSensorStatus(ultimaLectura.valor, optimalRange.min, optimalRange.max)
              : { status: "SIN DATOS", color: "#9ca3af", bgColor: "#f3f4f6" }

            // Calculate trend
            let trend = "→"
            if (ultimaLectura && penultimaLectura) {
              if (ultimaLectura.valor > penultimaLectura.valor) trend = "↗️"
              else if (ultimaLectura.valor < penultimaLectura.valor) trend = "↘️"
            }

            htmlContent += `
              <tr>
                <td><strong>${sensorInfo?.sensor || "Sensor desconocido"}</strong></td>
                <td>${new Date(sensor.fecha_instalada).toLocaleDateString("es-ES")}</td>
                <td>${
                  ultimaLectura
                    ? `<strong>${ultimaLectura.valor}</strong> ${optimalRange.unit}`
                    : '<span style="color: #9ca3af;">Sin datos</span>'
                }</td>
                <td><span class="status-${sensorStatus.status.toLowerCase().replace("ó", "o")}">${
                  sensorStatus.status
                }</span></td>
                <td>${optimalRange.min} - ${optimalRange.max} ${optimalRange.unit}</td>
                <td style="font-size: 16px; text-align: center;">${trend}</td>
              </tr>
            `
          })

          htmlContent += `
              </tbody>
            </table>
          `

          // Events out of range
          const eventosOutOfRange = lecturas
            .filter((lectura) => {
              const sensor = sensores.find(
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
            .slice(0, 10) // Last 10 events

          htmlContent += `
            <div class="events-section">
              <div class="events-title">
                ⚠️ Eventos Fuera de Rango (últimos 10)
              </div>
          `

          if (eventosOutOfRange.length > 0) {
            htmlContent += `
              <table class="sensors-table">
                <thead>
                  <tr>
                    <th>📅 Fecha</th>
                    <th>🕐 Hora</th>
                    <th>🔧 Sensor</th>
                    <th>📊 Valor</th>
                    <th>⚡ Estado</th>
                    <th>📏 Desviación</th>
                  </tr>
                </thead>
                <tbody>
            `

            eventosOutOfRange.forEach((evento) => {
              const sensor = sensores.find((s) => s.id_sensor_instalado === evento.id_sensor_instalado)
              const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor?.id_sensor)
              const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
              const status = getSensorStatus(evento.valor, optimalRange.min, optimalRange.max)

              // Calculate deviation
              let deviation = ""
              if (evento.valor < optimalRange.min) {
                deviation = `${(optimalRange.min - evento.valor).toFixed(1)} por debajo`
              } else if (evento.valor > optimalRange.max) {
                deviation = `${(evento.valor - optimalRange.max).toFixed(1)} por encima`
              }

              htmlContent += `
                <tr>
                  <td>${new Date(evento.fecha_hora).toLocaleDateString("es-ES")}</td>
                  <td>${new Date(evento.fecha_hora).toLocaleTimeString("es-ES")}</td>
                  <td>${sensorInfo?.sensor || "Desconocido"}</td>
                  <td><strong>${evento.valor}</strong> ${optimalRange.unit}</td>
                  <td><span class="status-${status.status.toLowerCase().replace("ó", "o")}">${status.status}</span></td>
                  <td style="color: ${status.color}; font-weight: bold;">${deviation}</td>
                </tr>
              `
            })

            htmlContent += `
                </tbody>
              </table>
            `
          } else {
            htmlContent += `<div class="no-data">✅ Sin registros fuera de rango en los últimos días</div>`
          }

          htmlContent += `</div>`
        } else {
          htmlContent += `<div class="no-data">⚠️ No hay sensores instalados en esta instalación</div>`
        }

        htmlContent += `</div>`
      })

      htmlContent += `
          </div>
        </div>
      `
    } else {
      htmlContent += `<div class="no-data">⚠️ No hay instalaciones asociadas a esta sucursal</div>`
    }

    htmlContent += `</div>`
  })

  htmlContent += `
      <div class="footer">
        <p><strong>Reporte generado automáticamente</strong> | Sistema de Monitoreo Acuícola</p>
        <p>Fecha: ${fecha} | Total de páginas: ${sucursales.length}</p>
      </div>
    </body>
    </html>
  `

  return openPrintWindow(htmlContent, `reporte_sucursales_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Generate comprehensive PDF report for instalaciones
export const generateInstalacionesPdfReport = (
  instalaciones: Instalacion[],
  sensores: SensorInstalado[],
  catalogoSensores: CatalogoSensor[],
  lecturas: Lectura[],
  especies?: Especie[],
  empresas?: EmpresaSucursal[],
) => {
  const fecha = new Date().toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calculate statistics
  const totalSensores = sensores.filter((sensor) =>
    instalaciones.some((inst) => inst.id_instalacion === sensor.id_instalacion),
  ).length

  const sensoresActivos = sensores.filter((sensor) => {
    const instalacion = instalaciones.find((inst) => inst.id_instalacion === sensor.id_instalacion)
    return instalacion && instalacion.estado_operativo === "activo"
  }).length

  const instalacionesActivas = instalaciones.filter((i) => i.estado_operativo === "activo").length

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Instalaciones - ${new Date().toLocaleDateString()}</title>
      <meta charset="UTF-8">
      <style>${getPdfStyles()}</style>
    </head>
    <body>
      <div class="header">
        <h1>🏭 Reporte de Instalaciones</h1>
        <div class="subtitle">Análisis Detallado de Instalaciones y Sensores</div>
        <div class="subtitle">Generado el: ${fecha}</div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${instalaciones.length}</div>
            <div class="stat-label">Instalaciones</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${instalacionesActivas}</div>
            <div class="stat-label">Activas</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalSensores}</div>
            <div class="stat-label">Total Sensores</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${sensoresActivos}</div>
            <div class="stat-label">Sensores Activos</div>
          </div>
        </div>
      </div>
  `

  instalaciones.forEach((instalacion, index) => {
    const instalacionSensores = sensores.filter((sensor) => sensor.id_instalacion === instalacion.id_instalacion)
    const especie = especies?.find((e) => e.id_especie === instalacion.id_proceso)
    const empresa = empresas?.find((e) => e.id_empresa_sucursal === instalacion.id_empresa_sucursal)

    htmlContent += `
      ${index > 0 ? '<div class="page-break"></div>' : ""}
      <div class="section">
        <div class="section-header">
          <span class="section-icon">${index + 1}</span>
          ${instalacion.nombre_instalacion}
          <span class="badge badge-${instalacion.tipo_uso}">${instalacion.tipo_uso}</span>
          <span class="badge badge-${instalacion.estado_operativo === "activo" ? "activo" : "inactivo"}">
            ${instalacion.estado_operativo === "activo" ? "Activo" : "Inactivo"}
          </span>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">🆔 ID:</span>
            <span class="info-value">${instalacion.id_instalacion}</span>
          </div>
          <div class="info-item">
            <span class="info-label">🏢 Sucursal:</span>
            <span class="info-value">${empresa?.nombre || instalacion.nombre_empresa || "No especificada"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📝 Descripción:</span>
            <span class="info-value">${instalacion.descripcion}</span>
          </div>
          <div class="info-item">
            <span class="info-label">🐟 Especie:</span>
            <span class="info-value">${especie?.nombre_comun || instalacion.nombre_proceso || "No especificada"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📅 Fecha instalación:</span>
            <span class="info-value">${new Date(instalacion.fecha_instalacion).toLocaleDateString("es-ES")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">🔧 Sensores:</span>
            <span class="info-value">${instalacionSensores.length}</span>
          </div>
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <h3>Sensores Instalados</h3>
            <div class="number">${instalacionSensores.length}</div>
          </div>
          <div class="summary-card">
            <h3>Lecturas Hoy</h3>
            <div class="number">${
              lecturas.filter(
                (l) =>
                  instalacionSensores.some((s) => s.id_sensor_instalado === l.id_sensor_instalado) &&
                  new Date(l.fecha_hora).toDateString() === new Date().toDateString(),
              ).length
            }</div>
          </div>
          <div class="summary-card">
            <h3>Parámetros Monitoreados</h3>
            <div class="number">${
              new Set(
                instalacionSensores.map((s) => {
                  const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === s.id_sensor)
                  return sensorInfo?.sensor
                }),
              ).size
            }</div>
          </div>
        </div>
    `

    if (instalacionSensores.length > 0) {
      htmlContent += `
        <div class="subsection">
          <div class="subsection-header">
            🔧 Sensores Detallados (${instalacionSensores.length})
          </div>
          <div class="subsection-content">
            <table class="sensors-table">
              <thead>
                <tr>
                  <th>🔧 Sensor</th>
                  <th>📅 Instalación</th>
                  <th>📊 Última Lectura</th>
                  <th>⚡ Estado</th>
                  <th>📏 Rango Óptimo</th>
                  <th>📈 Tendencia</th>
                  <th>📝 Descripción</th>
                </tr>
              </thead>
              <tbody>
      `

      instalacionSensores.forEach((sensor) => {
        const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor.id_sensor)
        const sensorLecturas = lecturas
          .filter((lectura) => lectura.id_sensor_instalado === sensor.id_sensor_instalado)
          .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())

        const ultimaLectura = sensorLecturas[0]
        const penultimaLectura = sensorLecturas[1]

        const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
        const sensorStatus = ultimaLectura
          ? getSensorStatus(ultimaLectura.valor, optimalRange.min, optimalRange.max)
          : { status: "SIN DATOS", color: "#9ca3af", bgColor: "#f3f4f6" }

        // Calculate trend
        let trend = "→"
        if (ultimaLectura && penultimaLectura) {
          if (ultimaLectura.valor > penultimaLectura.valor) trend = "↗️"
          else if (ultimaLectura.valor < penultimaLectura.valor) trend = "↘️"
        }

        htmlContent += `
          <tr>
            <td><strong>${sensorInfo?.sensor || "Sensor desconocido"}</strong></td>
            <td>${new Date(sensor.fecha_instalada).toLocaleDateString("es-ES")}</td>
            <td>${
              ultimaLectura
                ? `<strong>${ultimaLectura.valor}</strong> ${optimalRange.unit}`
                : '<span style="color: #9ca3af;">Sin datos</span>'
            }</td>
            <td><span class="status-${sensorStatus.status.toLowerCase().replace("ó", "o")}">${
              sensorStatus.status
            }</span></td>
            <td>${optimalRange.min} - ${optimalRange.max} ${optimalRange.unit}</td>
            <td style="font-size: 16px; text-align: center;">${trend}</td>
            <td>${sensor.descripcion || "Sin descripción"}</td>
          </tr>
        `
      })

      htmlContent += `
              </tbody>
            </table>
      `

      // Events out of range for this installation
      const eventosOutOfRange = lecturas
        .filter((lectura) => {
          const sensor = sensores.find(
            (s) =>
              s.id_sensor_instalado === lectura.id_sensor_instalado && s.id_instalacion === instalacion.id_instalacion,
          )
          if (!sensor) return false

          const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor.id_sensor)
          const optimalRange = getOptimalRange(sensorInfo?.sensor || "")

          return lectura.valor < optimalRange.min || lectura.valor > optimalRange.max
        })
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
        .slice(0, 15) // Last 15 events

      htmlContent += `
            <div class="events-section">
              <div class="events-title">
                ⚠️ Eventos Fuera de Rango (últimos 15)
              </div>
      `

      if (eventosOutOfRange.length > 0) {
        htmlContent += `
          <table class="sensors-table">
            <thead>
              <tr>
                <th>📅 Fecha</th>
                <th>🕐 Hora</th>
                <th>🔧 Sensor</th>
                <th>📊 Valor</th>
                <th>⚡ Estado</th>
                <th>📏 Desviación</th>
              </tr>
            </thead>
            <tbody>
        `

        eventosOutOfRange.forEach((evento) => {
          const sensor = sensores.find((s) => s.id_sensor_instalado === evento.id_sensor_instalado)
          const sensorInfo = catalogoSensores.find((cat) => cat.id_sensor === sensor?.id_sensor)
          const optimalRange = getOptimalRange(sensorInfo?.sensor || "")
          const status = getSensorStatus(evento.valor, optimalRange.min, optimalRange.max)

          // Calculate deviation
          let deviation = ""
          if (evento.valor < optimalRange.min) {
            deviation = `${(optimalRange.min - evento.valor).toFixed(1)} por debajo`
          } else if (evento.valor > optimalRange.max) {
            deviation = `${(evento.valor - optimalRange.max).toFixed(1)} por encima`
          }

          htmlContent += `
            <tr>
              <td>${new Date(evento.fecha_hora).toLocaleDateString("es-ES")}</td>
              <td>${new Date(evento.fecha_hora).toLocaleTimeString("es-ES")}</td>
              <td>${sensorInfo?.sensor || "Desconocido"}</td>
              <td><strong>${evento.valor}</strong> ${optimalRange.unit}</td>
              <td><span class="status-${status.status.toLowerCase().replace("ó", "o")}">${status.status}</span></td>
              <td style="color: ${status.color}; font-weight: bold;">${deviation}</td>
            </tr>
          `
        })

        htmlContent += `
            </tbody>
          </table>
        `
      } else {
        htmlContent += `<div class="no-data">✅ Sin registros fuera de rango en los últimos días</div>`
      }

      htmlContent += `
            </div>
          </div>
        </div>
      `
    } else {
      htmlContent += `<div class="no-data">⚠️ No hay sensores instalados en esta instalación</div>`
    }

    htmlContent += `</div>`
  })

  htmlContent += `
      <div class="footer">
        <p><strong>Reporte generado automáticamente</strong> | Sistema de Monitoreo Acuícola</p>
        <p>Fecha: ${fecha} | Total de instalaciones: ${instalaciones.length}</p>
      </div>
    </body>
    </html>
  `

  return openPrintWindow(htmlContent, `reporte_instalaciones_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Helper function to open print window
const openPrintWindow = (htmlContent: string, filename: string) => {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      // Close window after printing (optional)
      printWindow.onafterprint = () => {
        printWindow.close()
      }
    }, 1000)

    return true
  } else {
    alert("No se pudo abrir la ventana de impresión. Por favor, verifique que no esté bloqueada por el navegador.")
    return false
  }
}
