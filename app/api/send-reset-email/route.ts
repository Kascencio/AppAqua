import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend("re_ds2RPLBG_DvgQAAVjM6z12DK9RiioKHZv")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, resetToken } = body

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Generar URL de reset (ajustar dominio según ambiente)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    const { data, error } = await resend.emails.send({
      from: "AQUA System <onboarding@resend.dev>",
      to: [email],
      subject: "Restablecer contraseña - AQUA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablecer contraseña</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐟 AQUA</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sistema de Gestión Acuícola</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #0f172a; margin-top: 0;">Hola${name ? ` ${name}` : ""},</h2>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              Este enlace expirará en 1 hora por seguridad.
            </p>
            
            <p style="color: #64748b; font-size: 14px;">
              Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #0ea5e9; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} AQUA - Sistema de Gestión Acuícola</p>
            <p style="margin: 5px 0 0 0;">Este es un correo automático, por favor no respondas.</p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("[send-reset-email] Resend error:", error)
      return NextResponse.json({ error: "Error al enviar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("[send-reset-email] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
