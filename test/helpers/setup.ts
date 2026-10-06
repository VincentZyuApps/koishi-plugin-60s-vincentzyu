import { vi } from 'vitest'
import { DEFAULT_CUSTOM_COMMAND_OUTPUT } from '../../src/render/output'

/** 构造一个最小可用的 Session mock */
export function makeSession(overrides: any = {}) {
  const send = vi.fn().mockResolvedValue(['mock-msg-id'])
  const session: any = {
    send,
    platform: 'onebot',
    userId: '123',
    channelId: '456',
    messageId: 'msg-1',
    timestamp: Date.now(),
    subtype: undefined,
    quote: undefined,
    isDirect: false,
    bot: {
      config: { autoStreamText: false },
      internal: {
        sendMessage: vi.fn().mockResolvedValue({}),
        deleteMessage: vi.fn().mockResolvedValue({}),
      },
      deleteMessage: vi.fn().mockResolvedValue({}),
      sendMessage: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
  return session
}

/** 构造一个假 Client：所有方法返回 mock 结果或抛错 */
export function makeClient(overrides: Record<string, any> = {}) {
  const base: Record<string, any> = {}
  const methods = [
    'getDaily', 'getTodayInHistory',
    'getWeibo', 'getBili', 'getDouyin', 'getZhihu', 'getToutiao', 'getBaiduHot',
    'getQuark', 'getRednote', 'getDongchedi', 'getHackerNews', 'getITNewsRank', 'getMaoyan',
    'getWeatherRealtime', 'getWeatherForecast',
    'getExchangeRate', 'getFuelPrice', 'getGoldPrice',
    'getHitokoto', 'getDuanzi', 'getDadJoke', 'getFabing', 'getAnswer', 'getLuck', 'getMoyu',
    'getITNews', 'getAINews',
    'getLyric',
    'getQRCode', 'getIP', 'getPassword', 'checkPassword', 'getBaike', 'getHealth', 'translate',
    'getKuan', 'getQQProfile',
  ]
  for (const m of methods) {
    base[m] = vi.fn()
  }
  base.setVerbose = vi.fn((v: boolean) => false)
  return Object.assign(base, overrides) as any
}

/** 默认配置 */
export function makeConfig(overrides: any = {}) {
  return {
    baseUrl: 'http://127.0.0.1:4399',
    timeout: 15000,
    commandPrefix: '60s',
    renderPreset: 'general',
    customCommandOutput: { ...DEFAULT_CUSTOM_COMMAND_OUTPUT },
    enableQuote: false,
    enableWaitingHint: false,
    qqMarkdownKeyboardJson: '{}',
    qqMarkdownButtonMode: 'append-to-markdown',
    imageType: 'png',
    screenshotQuality: 88,
    imageWidth: 760,
    imageTheme: 'github',
    colorMode: 'system',
    fontMode: 'npm-lxgw',
    customFontPath: '',
    enableSchedule: false,
    scheduleTimezoneGmtOffset: 8,
    scheduledTasks: [],
    verboseConsoleLog: false,
    ...overrides,
  }
}

/** 运行命令注册并返回可调用的 action（配合 mockCommandContext 使用） */
export async function invokeAction(
  registrations: any,
  primary: string,
  args: any[] = [],
  sessionOverrides: any = {},
  options: any = {},
) {
  const reg = registrations.find((r: any) => r.primary === primary)
  if (!reg?.action) throw new Error(`命令 ${primary} 未注册 action`)
  const session = makeSession(sessionOverrides)
  await reg.action({ session, options }, ...args)
  return session
}
