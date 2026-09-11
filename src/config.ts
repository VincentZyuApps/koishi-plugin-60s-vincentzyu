import { Schema } from 'koishi'

// ==================== 渲染模式枚举 ====================

export const RENDER_MODE = {
  QQ_AUTO: 'qq-auto',
  GENERAL_AUTO: 'general-auto',
  TEXT: 'text',
  IMAGE: 'image',
  QQ_MARKDOWN: 'qq-markdown',
} as const

export type RenderMode = typeof RENDER_MODE[keyof typeof RENDER_MODE]

export const RENDER_MODE_NAMES: Record<RenderMode, string> = {
  [RENDER_MODE.QQ_AUTO]: '🖥️ QQ 智能',
  [RENDER_MODE.GENERAL_AUTO]: '📱 常规智能',
  [RENDER_MODE.TEXT]: '🔤 纯文本',
  [RENDER_MODE.IMAGE]: '🖼️ 图片 / Puppeteer 卡片图',
  [RENDER_MODE.QQ_MARKDOWN]: '🤖 QQ 原生 Markdown',
}

export const DEFAULT_RENDER_PRIORITY = [
  { mode: RENDER_MODE.GENERAL_AUTO, enabled: true },
]

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
  STANDALONE: 'standalone',
  APPEND_QQ_MARKDOWN: 'append-qq-markdown',
  APPEND_PUPPETEER_IMAGE: 'append-puppeteer-image',
} as const

export type QQButtonMode = typeof QQ_BUTTON_MODE[keyof typeof QQ_BUTTON_MODE]

// ==================== 配置接口 ====================

export interface RenderPriorityEntry {
  mode: RenderMode
  enabled: boolean
}

export interface Config {
  // ⚙️ 基础
  baseUrl: string
  timeout: number
  commandPrefix: string
  // 🎨 渲染
  renderModePriority: RenderPriorityEntry[]
  enableQuote: boolean
  enableWaitingHint: boolean
  // 🤖 QQ官方bot
  enableQQMarkdown: boolean
  qqMarkdownKeyboardJson: string
  qqMarkdownButtonMode: QQButtonMode[]
  // 🖼️ Puppeteer
  imageType: 'png' | 'jpeg' | 'webp'
  screenshotQuality: number
  imageWidth: number
  imageTheme: ImageTheme
  colorMode: ColorMode
  fontMode: FontMode
  customFontPath: string
  // 🔍 调试
  verboseConsoleLog: boolean
}

// ==================== 配置 Schema ====================

export const Config: Schema<Config> = Schema.intersect([
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
    renderModePriority: Schema.array(Schema.object({
      mode: Schema.union(
        Object.values(RENDER_MODE).map((m) => Schema.const(m).description(`【${m}】${RENDER_MODE_NAMES[m]}`)),
      )
        .role('radio')
        .description('渲染方式'),
      enabled: Schema.boolean()
        .default(true)
        .description('是否启用'),
    }))
      .role('table')
      .default(DEFAULT_RENDER_PRIORITY)
      .description([
        '🎨 渲染模式优先级表。运行时按表格从上到下逐项尝试，第一个可用方式即短路执行。',
        '📋 表格顺序 = 优先级顺序，可拖动调整。重复的项只取第一个出现的位置。',
        '<i>🖥️【qq-auto】QQ 官方 Bot 的列表类优先 QQ 原生 Markdown；非 QQ 平台按 general-auto 行为处理。</i>',
        '<i>📱【general-auto】列表类优先 Puppeteer 卡片图，单条类使用文本，图片类直接发送图片。</i>',
        '<i>🔤【text】始终使用纯文本，适用于任何平台。</i>',
        '<i>🖼️【image】需要截图时依赖 koishi-plugin-puppeteer；已有远程图片时可直接发送。</i>',
        '<i>🤖【qq-markdown】需要启用下方「QQ官方bot Markdown」且平台为 QQ 官方 Bot，否则会硬跳过至下一项。</i>',
        '🔤 兜底始终是纯文本，任何平台都能收到。',
        '💡 每条指令也支持 <code>-m/--mode</code> 临时优先尝试指定渲染方式；不可用时继续按本表处理。',
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
    enableQQMarkdown: Schema.boolean()
      .default(false)
      .description([
        '🤖 是否启用 QQ 官方 Bot 原生 Markdown 渲染。',
        '启用后，在 QQ 官方 Bot 平台且渲染优先级命中 <code>qq-markdown</code> 时，使用 markdown + 按钮发送。',
      ].join('<br/>')),
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
        '📋 QQ Markdown 按钮 JSON 配置。只在 QQ 官方 Bot 群聊且命中 qq-markdown 渲染时使用。',
        '支持变量 <code>${command}</code>（替换为触发时命中的子命令名）。',
        'JSON 解析失败或结构无效时自动退回默认按钮。',
      ].join('<br/>')),
    qqMarkdownButtonMode: Schema.array(Schema.union([
      Schema.const(QQ_BUTTON_MODE.STANDALONE).description('🧷 单独发送 JSON 按钮消息'),
      Schema.const(QQ_BUTTON_MODE.APPEND_QQ_MARKDOWN).description('📎 挂在 QQ Markdown 后面'),
      Schema.const(QQ_BUTTON_MODE.APPEND_PUPPETEER_IMAGE).description('🖼️ 挂在 Puppeteer 卡片图后面'),
    ]))
      .role('checkbox')
      .default([QQ_BUTTON_MODE.APPEND_QQ_MARKDOWN])
      .description('🤖 QQ Markdown 按钮发送行为，可多选。只对 QQ 官方 Bot 生效。'),
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
])
