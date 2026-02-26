export interface TelegramSendOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  disable_web_page_preview?: boolean
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

export async function sendTelegramMessage(message: string, chatId?: string, options?: TelegramSendOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = normalizeEnv(process.env.TELEGRAM_BOT_TOKEN)
    const defaultChatId = normalizeEnv(process.env.TELEGRAM_CHAT_ID_ADMIN) || normalizeEnv(process.env.TELEGRAM_CHAT_ID)
    const targetChatId = normalizeEnv(chatId) || defaultChatId

    if (!token || !targetChatId) {
      return { ok: false, error: 'TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID(_ADMIN) deben estar configurados' }
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: options?.parse_mode ?? 'Markdown',
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data?.description || 'Error enviando a Telegram' }
    }

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Error inesperado enviando a Telegram' }
  }
}

export function buildRecoveryMessage(params: { correo: string; token: string }): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(params.token)}`
  return [
    `*Recuperación de contraseña*`,
    `Usuario: ${params.correo}`,
    `Enlace (1 hora): ${link}`,
  ].join('\n')
}
