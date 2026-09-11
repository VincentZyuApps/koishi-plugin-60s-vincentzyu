export const OUTPUT_MODE = {
  TEXT: 'text',
  CARD: 'card',
  IMAGE: 'image',
  QQ_MARKDOWN: 'qq-markdown',
} as const

export type OutputMode = typeof OUTPUT_MODE[keyof typeof OUTPUT_MODE]

export const RENDER_PRESET = {
  GENERAL: 'general',
  QQ_OFFICIAL: 'qq-official',
  CUSTOM: 'custom',
} as const

export type RenderPreset = typeof RENDER_PRESET[keyof typeof RENDER_PRESET]

export type CommandOutputId =
  | 'daily' | 'history' | 'it-news' | 'ai-news' | 'hacker-news'
  | 'hot-weibo' | 'hot-bili' | 'hot-douyin' | 'hot-zhihu' | 'hot-toutiao' | 'hot-baidu' | 'hot-quark' | 'hot-rednote' | 'hot-dongchedi' | 'hot-hn' | 'hot-it-rank'
  | 'exchange-rate' | 'fuel-price' | 'gold-price' | 'weather'
  | 'hitokoto' | 'duanzi' | 'joke' | 'fabing' | 'answer' | 'luck' | 'moyu'
  | 'qrcode' | 'ip' | 'password' | 'password-check' | 'baike' | 'translate' | 'lyric' | 'health' | 'maoyan' | 'kuan' | 'qq-profile'

export interface CommandOutputDefinition {
  id: CommandOutputId
  label: string
  group: 'news' | 'hot' | 'finance' | 'fun' | 'tools'
  defaultMode: OutputMode
  modes: OutputMode[]
}

const CONTENT_MODES: OutputMode[] = [OUTPUT_MODE.TEXT, OUTPUT_MODE.CARD, OUTPUT_MODE.QQ_MARKDOWN]
const MEDIA_MODES: OutputMode[] = [OUTPUT_MODE.TEXT, OUTPUT_MODE.CARD, OUTPUT_MODE.IMAGE]

export const COMMAND_OUTPUT_DEFINITIONS: CommandOutputDefinition[] = [
  { id: 'daily', label: '📰 早报', group: 'news', defaultMode: OUTPUT_MODE.CARD, modes: [...CONTENT_MODES, OUTPUT_MODE.IMAGE] },
  { id: 'history', label: '📜 历史上的今天', group: 'news', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'it-news', label: '📰 IT 资讯', group: 'news', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'ai-news', label: '🤖 AI 资讯', group: 'news', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'hacker-news', label: '🐙 Hacker News', group: 'news', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  ...[
    ['hot-weibo', '🔥 微博热搜'], ['hot-bili', '🔥 B 站热搜'], ['hot-douyin', '🔥 抖音热榜'],
    ['hot-zhihu', '🔥 知乎热榜'], ['hot-toutiao', '🔥 头条热榜'], ['hot-baidu', '🔥 百度热搜'],
    ['hot-quark', '🔥 夸克热榜'], ['hot-rednote', '🔥 小红书热榜'], ['hot-dongchedi', '🔥 懂车帝热榜'],
    ['hot-hn', '🔥 Hacker News 热榜'], ['hot-it-rank', '🔥 IT 之家热榜'],
  ].map(([id, label]) => ({ id: id as CommandOutputId, label, group: 'hot' as const, defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES })),
  { id: 'exchange-rate', label: '💱 汇率', group: 'finance', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'fuel-price', label: '⛽ 油价', group: 'finance', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'gold-price', label: '🥇 金价', group: 'finance', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'weather', label: '🌤️ 天气', group: 'finance', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  ...[
    ['hitokoto', '💬 一言'], ['duanzi', '😂 段子'], ['joke', '🤣 笑话'], ['fabing', '💘 发病文学'],
    ['answer', '🔮 答案之书'], ['luck', '✨ 运势'],
  ].map(([id, label]) => ({ id: id as CommandOutputId, label, group: 'fun' as const, defaultMode: OUTPUT_MODE.TEXT, modes: CONTENT_MODES })),
  { id: 'moyu', label: '🐟 摸鱼', group: 'fun', defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES },
  { id: 'qrcode', label: '🔳 二维码', group: 'tools', defaultMode: OUTPUT_MODE.IMAGE, modes: MEDIA_MODES },
  ...[
    ['ip', '🌐 IP 查询'], ['password', '🔐 随机密码'], ['password-check', '🔒 密码校验'],
    ['lyric', '🎵 歌词'], ['health', '❤️ 健康'], ['maoyan', '🎬 猫眼'], ['kuan', '📱 酷安'],
  ].map(([id, label]) => ({ id: id as CommandOutputId, label, group: 'tools' as const, defaultMode: OUTPUT_MODE.CARD, modes: CONTENT_MODES })),
  { id: 'baike', label: '📖 百科', group: 'tools', defaultMode: OUTPUT_MODE.TEXT, modes: CONTENT_MODES },
  { id: 'translate', label: '🈶 翻译', group: 'tools', defaultMode: OUTPUT_MODE.TEXT, modes: CONTENT_MODES },
  { id: 'qq-profile', label: '👤 QQ 资料', group: 'tools', defaultMode: OUTPUT_MODE.IMAGE, modes: MEDIA_MODES },
]

export const COMMAND_OUTPUT_BY_ID = Object.fromEntries(
  COMMAND_OUTPUT_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<CommandOutputId, CommandOutputDefinition>

export const DEFAULT_CUSTOM_COMMAND_OUTPUT = Object.fromEntries(
  COMMAND_OUTPUT_DEFINITIONS.map((definition) => [definition.id, definition.defaultMode]),
) as Record<CommandOutputId, OutputMode>

export const OUTPUT_MODE_NAMES: Record<OutputMode, string> = {
  [OUTPUT_MODE.TEXT]: '🔤 纯文本',
  [OUTPUT_MODE.CARD]: '🖼️ Puppeteer 卡片图',
  [OUTPUT_MODE.IMAGE]: '🖼️ 直接图片',
  [OUTPUT_MODE.QQ_MARKDOWN]: '🤖 QQ 原生 Markdown',
}
