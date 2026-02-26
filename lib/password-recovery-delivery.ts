import "server-only"

import nodemailer from "nodemailer"
import { Resend } from "resend"
import { sendTelegramMessage } from "@/lib/telegram"

type SendRecoveryParams = {
  email: string
  userName?: string
  token?: string
  resetUrl?: string
}

export type RecoveryDeliveryResult = {
  ok: boolean
  channel: "email" | "telegram" | "none"
  error?: string
}

function normalizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const inner = trimmed.slice(1, -1).trim()
    return inner || undefined
  }

  return trimmed
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  )
}

function buildResetUrl(token?: string, explicitResetUrl?: string): string {
  if (explicitResetUrl && explicitResetUrl.trim().length > 0) {
    return explicitResetUrl.trim()
  }

  if (!token) {
    return `${getBaseUrl()}/forgot-password`
  }

  return `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`
}

function buildEmailHtml(userName: string | undefined, resetUrl: string): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin-bottom:8px">Recuperación de contraseña</h2>
      <p>Hola${userName ? ` ${userName}` : ""},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0284c7;color:#fff;text-decoration:none;border-radius:6px">
          Restablecer contraseña
        </a>
      </p>
      <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      <p style="font-size:12px;color:#64748b">Enlace: ${resetUrl}</p>
    </div>
  `
}

async function sendByResend(params: SendRecoveryParams, resetUrl: string): Promise<RecoveryDeliveryResult> {
  const resendApiKey = normalizeEnv(process.env.RESEND_API_KEY)
  if (!resendApiKey) {
    return { ok: false, channel: "none", error: "RESEND_API_KEY no configurado" }
  }

  try {
    const resend = new Resend(resendApiKey)
    const from =
      normalizeEnv(process.env.EMAIL_FROM) ||
      normalizeEnv(process.env.RESEND_FROM) ||
      "AQUA <noreply@aquamonitor.local>"

    const { error } = await resend.emails.send({
      from,
      to: [params.email],
      subject: "Restablecer contraseña - AQUA",
      html: buildEmailHtml(params.userName, resetUrl),
      text: `Hola${params.userName ? ` ${params.userName}` : ""}, restablece tu contraseña en: ${resetUrl}`,
    })

    if (error) {
      return { ok: false, channel: "none", error: String(error.message || error.name || "Error Resend") }
    }

    return { ok: true, channel: "email" }
  } catch (error: any) {
    return { ok: false, channel: "none", error: String(error?.message || "Excepción Resend") }
  }
}

async function sendBySmtp(params: SendRecoveryParams, resetUrl: string): Promise<RecoveryDeliveryResult> {
  const host = normalizeEnv(process.env.SMTP_HOST)
  const port = Number(normalizeEnv(process.env.SMTP_PORT) || 587)
  const user = normalizeEnv(process.env.SMTP_USER)
  const pass = normalizeEnv(process.env.SMTP_PASS)

  if (!host || !user || !pass) {
    return { ok: false, channel: "none", error: "SMTP no configurado" }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: normalizeEnv(process.env.SMTP_FROM) || normalizeEnv(process.env.EMAIL_FROM) || `AQUA <${user}>`,
      to: params.email,
      subject: "Restablecer contraseña - AQUA",
      html: buildEmailHtml(params.userName, resetUrl),
      text: `Hola${params.userName ? ` ${params.userName}` : ""}, restablece tu contraseña en: ${resetUrl}`,
    })

    return { ok: true, channel: "email" }
  } catch (error: any) {
    return { ok: false, channel: "none", error: String(error?.message || "Excepción SMTP") }
  }
}

async function sendByTelegram(params: SendRecoveryParams, resetUrl: string, fallbackReason?: string): Promise<RecoveryDeliveryResult> {
  const messageLines = [
    "*Recuperación de contraseña*",
    `Usuario: ${params.email}`,
    params.userName ? `Nombre: ${params.userName}` : "",
    `Enlace: ${resetUrl}`,
    fallbackReason ? `_Fallback a Telegram: ${fallbackReason}_` : "",
  ].filter(Boolean)

  const telegram = await sendTelegramMessage(messageLines.join("\n"))
  if (!telegram.ok) {
    return { ok: false, channel: "none", error: telegram.error || "No se pudo enviar por Telegram" }
  }

  return { ok: true, channel: "telegram" }
}

export async function sendPasswordRecoveryInstructions(params: SendRecoveryParams): Promise<RecoveryDeliveryResult> {
  const resetUrl = buildResetUrl(params.token, params.resetUrl)
  const resendApiKey = normalizeEnv(process.env.RESEND_API_KEY)

  const emailAttempt =
    resendApiKey
      ? await sendByResend(params, resetUrl)
      : await sendBySmtp(params, resetUrl)

  if (emailAttempt.ok) {
    return emailAttempt
  }

  return sendByTelegram(params, resetUrl, emailAttempt.error)
}
