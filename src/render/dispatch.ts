import type { Context, Session } from 'koishi'
import { h } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { renderCard } from './index'
import { sendQQMarkdown } from '../qq/markdown'
import {
  COMMAND_OUTPUT_BY_ID,
  OUTPUT_MODE,
  RENDER_PRESET,
  type CommandOutputId,
  type OutputMode,
} from './output'

export type CardTemplate = 'daily' | 'hot' | 'weather' | 'simple' | 'media'

export interface CardData {
  title: string
  subtitle?: string
  items?: Array<{ text: string; hot?: string | number }>
  body?: string
  temp?: string
  infoLines?: string[]
  sections?: Array<{ title: string; lines: string[] }>
  footer?: string
  mediaUrl?: string
  mediaShape?: 'square' | 'circle' | 'cover'
}

export interface RenderPayload {
  text: string
  markdown?: string
  imageUrl?: string
  cardData?: CardData
  cardTemplate?: CardTemplate
  /** 内容类别，供预设选择 */
  kind?: 'list' | 'single' | 'image'
  /** 规范命令 ID，供自定义命令输出配置查找。 */
  commandId?: CommandOutputId
  /** -m/--mode 临时输出覆盖。 */
  modeOverride?: OutputMode
}

export interface RenderResult {
  elements: string
  mode: OutputMode
}

export class OutputUnavailableError extends Error {}

function isQQOfficial(session: Session): boolean {
  return session.platform === 'qq' && !!(session.bot as any)?.internal?.sendMessage
}

function canUseImage(ctx: Context): boolean {
  return !!(ctx as any).puppeteer
}

function generalOutput(payload: RenderPayload): OutputMode {
  if (payload.kind === 'list') return OUTPUT_MODE.CARD
  if (payload.kind === 'image') return OUTPUT_MODE.IMAGE
  return OUTPUT_MODE.TEXT
}

function configuredOutput(config: Config, payload: RenderPayload): OutputMode {
  const definition = payload.commandId && COMMAND_OUTPUT_BY_ID[payload.commandId]
  return payload.commandId
    ? config.customCommandOutput?.[payload.commandId] || definition?.defaultMode || generalOutput(payload)
    : generalOutput(payload)
}

function unavailableMessage(payload: RenderPayload, mode: OutputMode) {
  const name = payload.commandId ? COMMAND_OUTPUT_BY_ID[payload.commandId]?.label || payload.commandId : '当前指令'
  const reason = mode === OUTPUT_MODE.CARD
    ? '未启用 koishi-plugin-puppeteer 或该指令没有可用的卡片数据'
    : mode === OUTPUT_MODE.IMAGE
      ? '该指令没有可直接发送的原始图片'
      : mode === OUTPUT_MODE.QQ_MARKDOWN
        ? '当前平台不是 QQ 官方 Bot，或该指令没有 Markdown 内容'
        : '该指令没有可用的文本内容'
  return `${name} 已配置为「${mode}」，但${reason}。请在配置项中修改该指令的输出方式。`
}

/**
 * 渲染一条回复。临时覆盖先尝试；固定预设允许降级，自定义配置严格执行。
 */
export async function renderReply(
  ctx: Context,
  session: Session,
  client: Client,
  config: Config,
  payload: RenderPayload,
  command?: string,
): Promise<RenderResult> {
  if (payload.modeOverride) {
    const result = await renderWithMode(ctx, session, config, payload, payload.modeOverride, command)
    if (result) return result
  }

  const custom = config.renderPreset === RENDER_PRESET.CUSTOM
  const qqPreset = config.renderPreset === RENDER_PRESET.QQ_OFFICIAL && isQQOfficial(session)
  const mode = custom
    ? configuredOutput(config, payload)
    : qqPreset && payload.kind === 'list'
      ? OUTPUT_MODE.QQ_MARKDOWN
      : generalOutput(payload)
  const result = await renderWithMode(ctx, session, config, payload, mode, command)
  if (result) return result

  if (custom) {
    const message = unavailableMessage(payload, mode)
    ctx.logger.error(`[60s] 自定义输出不可用 | command=${payload.commandId || '-'} | platform=${session.platform} | mode=${mode} | ${message}`)
    throw new OutputUnavailableError(message)
  }

  // QQ 预设的 Markdown 无法发送时，与非 QQ 平台一样按通用预设处理。
  if (qqPreset && mode === OUTPUT_MODE.QQ_MARKDOWN) {
    const generalResult = await renderWithMode(ctx, session, config, payload, generalOutput(payload), command)
    if (generalResult) return generalResult
  }

  // 通用预设中，早报等带官方图片的列表在卡片不可用时优先发送原图。
  if (mode === OUTPUT_MODE.CARD && payload.imageUrl) {
    const imageResult = await renderWithMode(ctx, session, config, payload, OUTPUT_MODE.IMAGE, command)
    if (imageResult) return imageResult
  }
  return renderText(ctx, session, config, payload)
}

/**
 * 用指定模式渲染。返回 null 表示该模式不可用（供优先级表继续尝试），否则返回结果。
 */
async function renderWithMode(
  ctx: Context,
  session: Session,
  config: Config,
  payload: RenderPayload,
  mode: OutputMode,
  command?: string,
): Promise<RenderResult | null> {
  if (mode === OUTPUT_MODE.QQ_MARKDOWN) {
    if (!isQQOfficial(session) || !(payload.markdown || payload.text)) return null
    const md = payload.markdown || payload.text
    try {
      await sendQQMarkdown(session, md, config, command)
      return { elements: '', mode: OUTPUT_MODE.QQ_MARKDOWN }
    } catch (e) {
      ctx.logger.warn(`[60s] QQ markdown 发送失败，fallback: ${e?.message || e}`)
      return null
    }
  }

  if (mode === OUTPUT_MODE.CARD) {
    if (payload.cardData && canUseImage(ctx)) {
      try {
        const dataUrl = await renderCard(ctx, config, payload.cardData, payload.cardTemplate || 'hot')
        const img = h.image(dataUrl)
        const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${img}`
        return { elements, mode: OUTPUT_MODE.CARD }
      } catch (e) {
        ctx.logger.warn(`[60s] puppeteer 渲染失败，fallback: ${e?.message || e}`)
        return null
      }
    }

    return null
  }

  if (mode === OUTPUT_MODE.IMAGE) {
    if (!payload.imageUrl) return null
    const img = h.image(payload.imageUrl)
    const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${img}`
    return { elements, mode: OUTPUT_MODE.IMAGE }
  }

  if (mode === OUTPUT_MODE.TEXT) {
    return renderText(ctx, session, config, payload)
  }

  return null
}

function renderText(ctx: Context, session: Session, config: Config, payload: RenderPayload): RenderResult {
  const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${h.text(payload.text)}`
  return { elements, mode: OUTPUT_MODE.TEXT }
}

/** 简化：直接发送 payload（内部走 renderReply + session.send） */
export async function sendReply(
  ctx: Context,
  session: Session,
  client: Client,
  config: Config,
  payload: RenderPayload,
  command?: string,
): Promise<void> {
  if (config.enableWaitingHint) {
    const waitingHint = `${config.enableQuote ? h.quote(session.messageId) : ''}${h.text('⏳ 获取中，请稍候…')}`
    const hintId = (await session.send(waitingHint))[0]
    try {
      const result = await renderReply(ctx, session, client, config, payload, command)
      if (result.elements) await session.send(result.elements)
      if (hintId !== undefined) {
        await session.bot.deleteMessage(session.channelId, hintId as any).catch(() => {})
      }
    } catch (e) {
      if (hintId !== undefined) {
        await session.bot.deleteMessage(session.channelId, hintId as any).catch(() => {})
      }
      throw e
    }
    return
  }
  const result = await renderReply(ctx, session, client, config, payload, command)
  if (result.elements) await session.send(result.elements)
}
