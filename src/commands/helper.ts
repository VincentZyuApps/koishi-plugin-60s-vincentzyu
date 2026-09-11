import type { Context, Session } from 'koishi'
import type { Config, RenderMode } from '../config'
import type { Client } from '../client'
import { sendReply, type CardData, type CardTemplate, type RenderPayload } from '../render/dispatch'
export interface CommandCtx {
  ctx: Context
  session: Session
  client: Client
  config: Config
}

/** 根据错误信息猜测可能原因，返回可读的排查建议 */
export function guessError(error: unknown): string {
  const msg = String((error as any)?.message || error || '')
  const raw = String((error as any)?.cause?.message || '') + msg

  if (/ECONNREFUSED|ECONNRESET|EADDRNOTAVAIL|fetch failed|connection refused/i.test(raw)) {
    return '无法连接 60s 服务：可能是 baseUrl 地址填错了（IP/端口），或 60s 服务没在运行。'
  }
  if (/ETIMEDOUT|timeout|timed out/i.test(raw)) {
    return '请求 60s 超时：baseUrl 可能不可达，或网络较慢。可以检查 timeout 配置并稍后再试。'
  }
  if (/ENOTFOUND|EAI_AGAIN|DNS|lookup/i.test(raw)) {
    return '域名解析失败：baseUrl 里的域名可能写错了，或网络 DNS 有问题。'
  }
  if (/空响应|返回了空|HTTP 200 但无内容/i.test(raw)) {
    return '60s 服务本身返回了空内容：该功能的上游数据源（如百度百科）可能暂时不可用或正在维护。可以稍后再试，或换一个命令验证 60s 服务是否正常。'
  }
  if (/未找到相关内容|未找到相关词条/i.test(raw)) {
    return '该词条在数据源中不存在：检查输入是否准确，或换一个关键词试试。'
  }
  if (/400|不能为空|参数/i.test(raw)) {
    return '60s 服务拒绝了请求：可能是指令参数不对，也可能是该功能的上游数据源（如百度百科）暂时不可用。可稍后再试，或换一个关键词/命令验证。'
  }
  if (/404|not found|ENOENT/i.test(raw)) {
    return '请求的资源不存在：可能是 60s API 版本/路径不匹配。'
  }
  if (/tls|ssl|certificate|self signed/i.test(raw)) {
    return 'HTTPS 证书问题：baseUrl 用了 https 但证书不受信任。可以改 http 或用有效证书。'
  }
  return '发生了未知错误。可以检查 baseUrl 配置是否正确、60s 服务是否可用。'
}

/** 包装命令 action：捕获错误 → 智能猜测 → session 输出 + console 日志
 * 若传入 client 且 commandVerbose 为 true，则临时开启 verbose 日志，执行后恢复。 */
export async function safeAction(
  ctx: Context,
  session: Session,
  fn: () => Promise<void>,
  options: { client?: Client; config?: Config; commandVerbose?: boolean } = {},
): Promise<void> {
  const { client, config, commandVerbose } = options
  const effectiveVerbose = !!(config?.verboseConsoleLog || commandVerbose)
  const prevVerbose = client ? client.setVerbose(effectiveVerbose) : undefined

  if (effectiveVerbose) {
    ctx.logger.info(
      `[60s] ⚙️ 命令开始 | platform=${session.platform} | userId=${session.userId} | channel=${session.channelId}` +
        (session.subtype ? ` | subtype=${session.subtype}` : '') +
        (session.quote?.content ? ` | 引用消息=${session.quote.content.slice(0, 30)}` : ''),
    )
  }
  const start = Date.now()
  try {
    await fn()
    if (effectiveVerbose) ctx.logger.info(`[60s] ✅ 命令完成 | 耗时 ${Date.now() - start}ms`)
  } catch (e: any) {
    const message = e?.message || String(e || '')
    const guess = guessError(e)
    const hint = `${message}\n💡 ${guess}`

    // 控制台详细日志（含堆栈）
    ctx.logger.error(`[60s] ❌ 命令执行失败 | 耗时 ${Date.now() - start}ms | ${hint}`)
    if (e?.stack) ctx.logger.debug(`[60s] 堆栈: ${e.stack}`)

    // session 输出给用户（404 已在 client 层生成友好文案，直接展示）
    try {
      await session.send(`❌ ${hint}`)
    } catch {
      // 发送失败就静默，避免二次异常
    }
  } finally {
    if (client && prevVerbose !== undefined) client.setVerbose(prevVerbose)
  }
}

export function makePayload(text: string, kind: RenderPayload['kind'] = 'single'): RenderPayload {
  return { text, kind }
}

export function listPayload(text: string): RenderPayload {
  return { text, markdown: text, kind: 'list' }
}

export function imagePayload(imageUrl: string): RenderPayload {
  return { text: '', imageUrl, kind: 'image' }
}

/** 构造卡片 payload（结构化数据，供 puppeteer 渲染） */
export function cardPayload(data: CardData, template: CardTemplate, kind: RenderPayload['kind'] = 'list'): RenderPayload {
  return { text: data.body || data.title, cardData: data, cardTemplate: template, kind }
}

/** 从 --mode 选项值解析渲染模式，非法值返回 undefined（走默认） */
export function parseModeOption(value: string | undefined): RenderMode | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'qq-auto' || v === 'general-auto' || v === 'text' || v === 'image' || v === 'qq-markdown') {
    return v as RenderMode
  }
  return undefined
}

/** 给命令链追加统一的 --mode option */
export function addModeOption(command: any): any {
  return command.option('mode', '-m, --mode <qq-auto|general-auto|text|image|qq-markdown> 临时优先尝试渲染方式')
}

/** 从 action options 提取 modeOverride 附加到 payload */
export function withMode(payload: RenderPayload, options: any): RenderPayload {
  const override = parseModeOption(options?.mode)
  return override ? { ...payload, modeOverride: override } : payload
}

export { sendReply }
export type { RenderPayload }
