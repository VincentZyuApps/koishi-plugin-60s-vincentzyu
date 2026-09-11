import type { Context, Session } from 'koishi'
import { h } from 'koishi'
import type { Config, RenderPriorityEntry, RenderMode } from '../config'
import { RENDER_MODE } from '../config'
import type { Client } from '../client'
import { renderCard } from './index'
import { sendQQMarkdown } from '../qq/markdown'

export type CardTemplate = 'daily' | 'hot' | 'weather' | 'simple'

export interface CardData {
  title: string
  subtitle?: string
  items?: Array<{ text: string; hot?: string | number }>
  body?: string
  temp?: string
  infoLines?: string[]
  sections?: Array<{ title: string; lines: string[] }>
  footer?: string
}

export interface RenderPayload {
  text: string
  markdown?: string
  imageUrl?: string
  cardData?: CardData
  cardTemplate?: CardTemplate
  /** 内容类别，供智能模式选择 */
  kind?: 'list' | 'single' | 'image'
  /** 强制指定渲染方式（--mode 选项），优先级高于配置表 */
  modeOverride?: RenderMode
}

export interface RenderResult {
  elements: string
  mode: RenderMode
}

const QQ_AUTO_KIND_MODE: Record<NonNullable<RenderPayload['kind']>, RenderMode> = {
  list: RENDER_MODE.QQ_MARKDOWN,
  single: RENDER_MODE.TEXT,
  image: RENDER_MODE.IMAGE,
}

const GENERAL_AUTO_KIND_MODE: Record<NonNullable<RenderPayload['kind']>, RenderMode> = {
  list: RENDER_MODE.IMAGE,
  single: RENDER_MODE.TEXT,
  image: RENDER_MODE.IMAGE,
}

function isQQOfficial(session: Session): boolean {
  return session.platform === 'qq' && !!(session.bot as any)?.internal?.sendMessage
}

function canUseImage(ctx: Context): boolean {
  return !!(ctx as any).puppeteer
}

function uniquePriority(list: RenderPriorityEntry[]): RenderPriorityEntry[] {
  const seen = new Set<RenderMode>()
  const out: RenderPriorityEntry[] = []
  for (const entry of list) {
    if (seen.has(entry.mode)) continue
    seen.add(entry.mode)
    out.push(entry)
  }
  return out
}

function resolveMode(mode: RenderMode, kind: RenderPayload['kind'], session: Session): RenderMode {
  const contentKind = kind || 'single'
  if (mode === RENDER_MODE.QQ_AUTO) {
    return (isQQOfficial(session) ? QQ_AUTO_KIND_MODE : GENERAL_AUTO_KIND_MODE)[contentKind]
  }
  if (mode === RENDER_MODE.GENERAL_AUTO) return GENERAL_AUTO_KIND_MODE[contentKind]
  return mode
}

/**
 * 渲染一条回复。modeOverride（--mode）会优先尝试，未命中时再按优先级表继续。
 */
export async function renderReply(
  ctx: Context,
  session: Session,
  client: Client,
  config: Config,
  payload: RenderPayload,
  command?: string,
): Promise<RenderResult> {
  const priority = uniquePriority([
    ...(payload.modeOverride ? [{ mode: payload.modeOverride, enabled: true }] : []),
    ...config.renderModePriority.filter((e) => e.enabled),
  ])
  // 显式 TEXT 也作为备选，保证兜底
  priority.push({ mode: RENDER_MODE.TEXT, enabled: true })

  for (const entry of priority) {
    const result = await renderWithMode(ctx, session, config, payload, entry.mode, command)
    if (result) return result
  }

  // 兜底：纯文本
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
  rawMode: RenderMode,
  command?: string,
): Promise<RenderResult | null> {
  const mode = resolveMode(rawMode, payload.kind, session)

  if (mode === RENDER_MODE.QQ_MARKDOWN) {
    if (!config.enableQQMarkdown || !isQQOfficial(session)) return null
    const md = payload.markdown || payload.text
    try {
      await sendQQMarkdown(session, md, config, command)
      return { elements: '', mode: RENDER_MODE.QQ_MARKDOWN }
    } catch (e) {
      ctx.logger.warn(`[60s] QQ markdown 发送失败，fallback: ${e?.message || e}`)
      return null
    }
  }

  if (mode === RENDER_MODE.IMAGE) {
    if (payload.cardData && canUseImage(ctx)) {
      try {
        const dataUrl = await renderCard(ctx, config, payload.cardData, payload.cardTemplate || 'hot')
        const img = h.image(dataUrl)
        const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${img}`
        return { elements, mode: RENDER_MODE.IMAGE }
      } catch (e) {
        ctx.logger.warn(`[60s] puppeteer 渲染失败，fallback: ${e?.message || e}`)
        return null
      }
    }

    if (payload.imageUrl) {
      const img = h.image(payload.imageUrl)
      const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${img}`
      return { elements, mode: RENDER_MODE.IMAGE }
    }
    // 既无可截图的卡片，也没有可直接发送的图片 → 该模式不可用。
    return null
  }

  if (mode === RENDER_MODE.TEXT) {
    return renderText(ctx, session, config, payload)
  }

  return null
}

function renderText(ctx: Context, session: Session, config: Config, payload: RenderPayload): RenderResult {
  const elements = `${config.enableQuote ? h.quote(session.messageId) : ''}${h.text(payload.text)}`
  return { elements, mode: RENDER_MODE.TEXT }
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
