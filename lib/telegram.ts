export interface TelegramSendOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  disable_web_page_preview?: boolean
}

export async function sendTelegramMessage(message: string, chatId?: string, options?: TelegramSendOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const defaultChatId = process.env.TELEGRAM_CHAT_ID_ADMIN
    const targetChatId = chatId || defaultChatId

    if (!token || !targetChatId) {
      return { ok: false, error: 'TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID_ADMIN no configurados' }
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

