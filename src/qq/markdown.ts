import { h, Session } from 'koishi'
import type { Config, QQButtonMode } from '../config'
import { QQ_BUTTON_MODE } from '../config'

export async function sendQQMarkdown(
  session: Session,
  markdown: string,
  config: Config,
  command?: string,
) {
  const keyboard = buildKeyboard(config, command)
  const payload: any = {
    msg_type: 2,
    content: '60s API',
    markdown: { content: markdown },
  }

  if (config.qqMarkdownButtonMode.includes(QQ_BUTTON_MODE.APPEND_QQ_MARKDOWN) && keyboard?.rows?.length) {
    payload.keyboard = { content: keyboard }
  }

  if (session.messageId) {
    const now = Date.now()
    const msgTime = session.timestamp ?? now
    if (now - msgTime < 300000) {
      payload.msg_id = session.messageId
      payload.msg_seq = Math.floor(Math.random() * 0xffffff) + 1
    }
  }

  const bot = session.bot as any
  if (bot.config?.autoStreamText) {
    const attrs: any = { content: markdown }
    if (config.qqMarkdownButtonMode.includes(QQ_BUTTON_MODE.APPEND_QQ_MARKDOWN) && keyboard?.rows?.length) {
      attrs.keyboard = keyboard
    }
    await session.send(h('qq:rawmarkdown', attrs))
    return
  }

  const qq = (session as any).qq
  if (qq?.sendPrivateMessage && session.isDirect) {
    await qq.sendPrivateMessage(session.channelId, payload)
    return
  }
  if (qq?.sendMessage) {
    await qq.sendMessage(session.channelId, payload)
    return
  }
  await bot.internal.sendMessage(session.channelId, payload)
}

export async function sendStandaloneButton(session: Session, config: Config, command?: string) {
  if (!config.qqMarkdownButtonMode.includes(QQ_BUTTON_MODE.STANDALONE)) return
  const keyboard = buildKeyboard(config, command)
  if (!keyboard?.rows?.length) return
  const payload: any = {
    msg_type: 2,
    content: '# 60s 操作按钮',
    keyboard: { content: keyboard },
  }
  const bot = session.bot as any
  const qq = (session as any).qq
  if (qq?.sendMessage) {
    await qq.sendMessage(session.channelId, payload)
    return
  }
  await bot.internal.sendMessage(session.channelId, payload)
}

function buildKeyboard(config: Config, command?: string): any {
  let raw = config.qqMarkdownKeyboardJson
  if (command) raw = raw.replace(/\$\{command\}/g, command)
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.rows?.[0]?.buttons?.length) return parsed
  } catch {}
  return buildDefaultKeyboard(command)
}

function buildDefaultKeyboard(command?: string): any {
  const cmd = command || '60s'
  return {
    rows: [
      {
        buttons: [
          {
            render_data: { label: '🔄 再来一次', style: 1 },
            action: { type: 2, permission: { type: 2 }, data: cmd, enter: true },
          },
          {
            render_data: { label: '❓ 帮助', style: 0 },
            action: { type: 2, permission: { type: 2 }, data: `${cmd} --help`, enter: true },
          },
        ],
      },
    ],
  }
}

export type { QQButtonMode }
