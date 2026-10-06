import { Schema } from 'koishi'
import {
  COMMAND_OUTPUT_DEFINITIONS,
  DEFAULT_CUSTOM_COMMAND_OUTPUT,
  OUTPUT_MODE,
  OUTPUT_MODE_NAMES,
  RENDER_PRESET,
  type CommandOutputId,
  type OutputMode,
  type RenderPreset,
} from './render/output'

// ==================== 卡片主题 ====================

export const IMAGE_THEME = {
  KOISHI: 'koishi',
  GITHUB: 'github',
} as const

export type ImageTheme = typeof IMAGE_THEME[keyof typeof IMAGE_THEME]

export const COLOR_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export type ColorMode = typeof COLOR_MODE[keyof typeof COLOR_MODE]

// ==================== Puppeteer 字体 ====================

export const FONT_MODE = {
  NPM_LXGW: 'npm-lxgw',
  RELEASE_LXGW: 'release-lxgw',
  CUSTOM_PATH: 'custom-path',
  SYSTEM_DEFAULT: 'system-default',
} as const

export type FontMode = typeof FONT_MODE[keyof typeof FONT_MODE]

// ==================== QQ 按钮模式 ====================

export const QQ_BUTTON_MODE = {
  NONE: 'none',
  STANDALONE: 'standalone',
  APPEND_MARKDOWN: 'append-to-markdown',
} as const

export type QQButtonMode = typeof QQ_BUTTON_MODE[keyof typeof QQ_BUTTON_MODE]

// ==================== 定时任务 ====================

export interface ScheduledTaskConfig {
  name: string
  command: string
  cron: string
  platform: string
  selfId: string
  channelId: string
  enabled: boolean
}

export const DEFAULT_SCHEDULED_TASKS: ScheduledTaskConfig[] = [
  { name: '📰 每日早报', command: '60s.早报', cron: '0 8 * * *', platform: '', selfId: '', channelId: '', enabled: false },
  { name: '🌤️ 上海天气', command: '60s.天气 上海', cron: '5 8 * * *', platform: '', selfId: '', channelId: '', enabled: false },
  { name: '📜 历史上的今天', command: '60s.历史', cron: '10 8 * * *', platform: '', selfId: '', channelId: '', enabled: false },
  { name: '📺 B 站热搜', command: '60s.热榜.bili', cron: '15 8 * * *', platform: '', selfId: '', channelId: '', enabled: false },
  { name: '💻 IT 之家热榜', command: '60s.热榜.it-rank', cron: '20 8 * * *', platform: '', selfId: '', channelId: '', enabled: false },
]

// ==================== 配置接口 ====================

export type CustomCommandOutput = Record<CommandOutputId, OutputMode>

export interface Config {
  // ⚙️ 基础
  baseUrl: string
  timeout: number
  commandPrefix: string
  // 🎨 渲染
  renderPreset: RenderPreset
  customCommandOutput: CustomCommandOutput
  enableQuote: boolean
  enableWaitingHint: boolean
  // 🤖 QQ官方bot
  qqMarkdownKeyboardJson: string
  qqMarkdownButtonMode: QQButtonMode
  // 🖼️ Puppeteer
  imageType: 'png' | 'jpeg' | 'webp'
  screenshotQuality: number
  imageWidth: number
  imageTheme: ImageTheme
  colorMode: ColorMode
  fontMode: FontMode
  customFontPath: string
  // ⏰ 定时任务
  enableSchedule: boolean
  scheduleTimezoneGmtOffset: number
  scheduledTasks: ScheduledTaskConfig[]
  // 🔍 调试
  verboseConsoleLog: boolean
}

const CUSTOM_OUTPUT_GROUPS = [
  ['news', '📰 早报与资讯'],
  ['hot', '🔥 热榜来源'],
  ['finance', '🌤️ 天气与行情'],
  ['fun', '💬 娱乐与单条内容'],
  ['tools', '🛠️ 工具'],
] as const

function outputModeSchema(definition: typeof COMMAND_OUTPUT_DEFINITIONS[number]) {
  return Schema.union(definition.modes.map((mode) => Schema.const(mode).description(OUTPUT_MODE_NAMES[mode])))
    .role('radio')
    .default(definition.defaultMode)
    .description(`🎯 ${definition.label} 的输出方式。`)
}

const customCommandOutputSchema = Schema.intersect(
  CUSTOM_OUTPUT_GROUPS.map(([group, title]) => Schema.object(Object.fromEntries(
    COMMAND_OUTPUT_DEFINITIONS
      .filter((definition) => definition.group === group)
      .map((definition) => [definition.id, outputModeSchema(definition)]),
  )).description(title)),
)

// ==================== 配置 Schema ====================

export const Config = Schema.intersect([
  // ⚙️ 基础设置
  Schema.object({
    baseUrl: Schema.string()
      .default('http://127.0.0.1:4399')
      .description([
        '🌐 60s API 地址，支持 <code>http://ip:port</code> 或 <code>https://域名</code>。',
        '默认指向本机 60s 服务 <code>http://127.0.0.1:4399</code>。',
        '若使用远端服务，请填写你自行部署或确认可用的 60s 实例地址。',
      ].join('<br/>')),
    timeout: Schema.number()
      .min(1000)
      .step(500)
      .default(15000)
      .description('⏱️ 请求 60s API 的超时时间（毫秒）。'),
    commandPrefix: Schema.string()
      .default('60s')
      .description([
        '📌 命令前缀。所有子命令都以此为前缀，如 <code>60s早报</code>、<code>60s热榜</code>。',
        '修改后英文 alias 会变成 <code>{prefix} news</code> 形式。',
      ].join('<br/>')),
  }).description('⚙️ 基础设置'),

  // 🎨 渲染设置
  Schema.object({
    renderPreset: Schema.union([
      Schema.const(RENDER_PRESET.GENERAL).description('📱 通用预设（推荐）'),
      Schema.const(RENDER_PRESET.QQ_OFFICIAL).description('🤖 QQ 官方 Bot 预设'),
      Schema.const(RENDER_PRESET.CUSTOM).description('⚙️ 自定义命令输出'),
    ])
      .role('radio')
      .default(RENDER_PRESET.GENERAL)
      .description([
        '🎨 选择插件的默认输出策略。',
        '<i><code>【通用预设】</code>列表优先卡片图，单条内容纯文本，天然图片直接发送。</i>',
        '<i><code>【QQ 官方 Bot 预设】</code>QQ 官方 Bot 的列表优先原生 Markdown；其他平台按通用预设输出。</i>',
        '<i><code>【自定义命令输出】</code>仅在此预设生效。严格按底部每条规范命令的选择执行；中文与英文 alias 共用同一项。卡片图、直接图片或 QQ 原生 Markdown 不可用时会返回简洁错误并在控制台记录详细原因，不自动降级。</i>',
        '💡 每条指令可用 <code>-m/--mode &lt;text|card|image|qq-markdown&gt;</code> 临时优先尝试一种输出；失败后回到本预设规则。',
      ].join('<br/>')),
    enableQuote: Schema.boolean()
      .default(true)
      .description('💬 是否引用触发指令的消息。'),
    enableWaitingHint: Schema.boolean()
      .default(true)
      .description('⏳ 是否发送「获取中，请稍候…」提示消息，发送完成后自动撤回。'),
  }).description('🎨 渲染设置'),

  // 🤖 QQ官方bot
  Schema.object({
    qqMarkdownKeyboardJson: Schema.string()
      .role('textarea', { rows: [5, 10] })
      .default(JSON.stringify({
        rows: [
          {
            buttons: [
              {
                render_data: { label: '🔄 再来一次', style: 1 },
                action: { type: 2, permission: { type: 2 }, data: '${command}', enter: true },
              },
              {
                render_data: { label: '❓ 帮助', style: 0 },
                action: { type: 2, permission: { type: 2 }, data: '${command} --help', enter: true },
              },
            ],
          },
        ],
      }, null, 2))
      .description([
        '📋 QQ Markdown 按钮 JSON 配置。只在命中 QQ 原生 Markdown 且按钮模式不是“不发按钮”时使用。',
        '支持变量 <code>${command}</code>（替换为触发时命中的子命令名）。',
        'JSON 解析失败或结构无效时自动退回默认按钮。',
      ].join('<br/>')),
    qqMarkdownButtonMode: Schema.union([
      Schema.const(QQ_BUTTON_MODE.NONE).description('🚫 不发按钮'),
      Schema.const(QQ_BUTTON_MODE.STANDALONE).description('🧷 单独发按钮'),
      Schema.const(QQ_BUTTON_MODE.APPEND_MARKDOWN).description('📎 附在 QQ Markdown 后面'),
    ])
      .role('radio')
      .default(QQ_BUTTON_MODE.APPEND_MARKDOWN)
      .description('🤖 QQ Markdown 按钮发送方式。仅 QQ 官方 Bot 的原生 Markdown 输出生效。'),
  }).description('🤖 QQ 官方 Bot Markdown'),

  // 🖼️ Puppeteer
  Schema.object({
    imageType: Schema.union([
      Schema.const('png').description('🖼️ PNG'),
      Schema.const('jpeg').description('🌄 JPEG'),
      Schema.const('webp').description('🌐 WEBP'),
    ])
      .role('radio')
      .default('png')
      .description('🖼️ Puppeteer 卡片图输出格式。PNG 不支持质量参数。'),
    screenshotQuality: Schema.number()
      .role('slider')
      .min(1)
      .max(100)
      .step(1)
      .default(88)
      .description('🎚️ 截图质量，仅 JPEG / WEBP 生效。'),
    imageWidth: Schema.number()
      .min(480)
      .max(1600)
      .step(20)
      .default(760)
      .description('📐 卡片图宽度（px）。'),
    imageTheme: Schema.union([
      Schema.const(IMAGE_THEME.KOISHI).description('💜 Koishi 紫灰'),
      Schema.const(IMAGE_THEME.GITHUB).description('⚫ GitHub 黑白灰'),
    ])
      .role('radio')
      .default(IMAGE_THEME.GITHUB)
      .description('🎨 Puppeteer 卡片图主题风格。'),
    colorMode: Schema.union([
      Schema.const(COLOR_MODE.LIGHT).description('☀️ 白天模式'),
      Schema.const(COLOR_MODE.DARK).description('🌙 黑夜模式'),
      Schema.const(COLOR_MODE.SYSTEM).description('🖥️ 跟随 Chromium 系统偏好'),
    ])
      .role('radio')
      .default(COLOR_MODE.SYSTEM)
      .description('🌓 Puppeteer 卡片图明暗模式。跟随系统由 Chromium 的 <code>prefers-color-scheme</code> 决定。'),
    fontMode: Schema.union([
      Schema.const(FONT_MODE.NPM_LXGW).description('📦 霞鹜文楷（内置 npm，默认）'),
      Schema.const(FONT_MODE.RELEASE_LXGW).description('☁️ 霞鹜文楷等宽版（Gitee / GitHub Release 下载）'),
      Schema.const(FONT_MODE.CUSTOM_PATH).description('📁 指定字体绝对路径'),
      Schema.const(FONT_MODE.SYSTEM_DEFAULT).description('🔤 系统默认字体'),
    ])
      .role('radio')
      .default(FONT_MODE.NPM_LXGW)
      .description([
        '🔤 Puppeteer 卡片图字体，影响本插件全部截图卡片。',
        '<i>【npm-lxgw】使用随插件安装的霞鹜文楷普通版，不联网。</i>',
        '<i>【release-lxgw】首次使用时下载霞鹜文楷等宽版到 Koishi 根目录 <code>data/fonts</code>，依次尝试 Gitee 与 GitHub。</i>',
        '<i>【custom-path】使用下方填写的 Koishi 服务端字体绝对路径。</i>',
        '<i>【system-default】使用系统字体栈，不读取字体文件。</i>',
        '⚠️ 所选字体不可用时，本次 Puppeteer 截图会明确报错，不会自动改用其他字体。',
      ].join('<br/>')),
    customFontPath: Schema.string()
      .default('')
      .description('📁 自定义字体绝对路径，仅选择【custom-path】时生效。支持 <code>.ttf</code>、<code>.otf</code>、<code>.woff</code>、<code>.woff2</code>，路径位于 Koishi 服务端。'),
  }).description('🖼️ Puppeteer 卡片图'),

  // ⏰ 定时任务
  Schema.object({
    enableSchedule: Schema.boolean()
      .default(false)
      .description('⏰ 是否开启 Cron 定时任务。默认关闭，开启后才会按配置注册后台定时器。'),
    scheduleTimezoneGmtOffset: Schema.number()
      .min(-12)
      .max(14)
      .step(1)
      .default(8)
      .description('🌍 Cron 时区 GMT 偏移。默认 <code>8</code> 即 GMT+8；不受 Koishi 宿主机时区影响。'),
    scheduledTasks: Schema.array(Schema.object({
      name: Schema.string().default('').description('📝 任务名'),
      command: Schema.string().default('').description('⌨️ 完整 Koishi 指令，交由 Session.execute() 执行'),
      cron: Schema.string().default('0 8 * * *').description('⏰ 五段 Cron：分 时 日 月 星期'),
      platform: Schema.string().default('').description('🎯 Bot 平台，如 onebot / qq'),
      selfId: Schema.string().default('').description('🤖 Bot selfId'),
      channelId: Schema.string().default('').description('📡 频道或群号'),
      enabled: Schema.boolean().default(false).description('✅ 是否启用'),
    }))
      .role('table')
      .default(DEFAULT_SCHEDULED_TASKS)
      .description([
        '⏰ 通用 Cron 主动推送任务。仅启用且填写完整 <code>platform</code>、<code>selfId</code>、<code>channelId</code> 的行会注册。',
        '执行时使用对应 Bot 建立主动 Session，并调用 <code>session.execute(command)</code>，因此复用普通指令的输出、渲染和平台适配。',
        'Cron 使用五段式：<code>0 8 * * *</code> 表示每天 08:00。连续失败 3 次会向目标发送一次简短提醒；任意成功会重置计数。',
      ].join('<br/>')),
  }).description('⏰ 定时任务'),

  // ⚙️ 自定义指令输出
  Schema.object({
    customCommandOutput: customCommandOutputSchema
      .default(DEFAULT_CUSTOM_COMMAND_OUTPUT),
  }).description('⚙️ 自定义指令输出（仅选择自定义预设时生效；格式不可用时不自动降级）'),

  // 🔍 调试
  Schema.object({
    verboseConsoleLog: Schema.boolean()
      .default(false)
      .description([
        '🧾 是否在控制台输出详细调试信息。',
        '开启后输出：请求 URL、HTTP 状态码、响应耗时、响应体摘要、解析结果、QQ Markdown 发送详情等。',
        '每条指令也支持 <code>--verbose</code> 选项临时开启（优先级高于此配置）。',
      ].join('<br/>')),
  }).description('🔍 调试'),
]) as Schema<Config>
