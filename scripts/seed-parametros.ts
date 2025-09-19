// Cargar prisma runtime como CJS
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("../lib/generated/prisma")
const prisma = new PrismaClient()

async function main() {
  const base = [
    { nombre_parametro: "pH", unidad_medida: "pH" },
    { nombre_parametro: "Temperatura", unidad_medida: "°C" },
    { nombre_parametro: "Oxígeno Disuelto", unidad_medida: "mg/L" },
    { nombre_parametro: "Salinidad", unidad_medida: "ppt" },
    { nombre_parametro: "Turbidez", unidad_medida: "NTU" },
    { nombre_parametro: "Nitratos", unidad_medida: "mg/L" },
    { nombre_parametro: "Amonio", unidad_medida: "mg/L" },
  ]

  for (const p of base) {
    const exists = await prisma.parametros.findFirst({
      where: { nombre_parametro: p.nombre_parametro },
    })
    if (!exists) {
      await prisma.parametros.create({ data: p })
      console.log(`✔ Parámetro creado: ${p.nombre_parametro}`)
    } else {
      console.log(`• Parámetro ya existe: ${p.nombre_parametro}`)
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log("Seed de parametros completado.")
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


