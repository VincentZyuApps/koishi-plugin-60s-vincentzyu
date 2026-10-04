import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

import { apply } from '../src'
import type { ColorMode, Config, ImageTheme } from '../src/config'
import { DEFAULT_CUSTOM_COMMAND_OUTPUT, type OutputMode } from '../src/render/output'

const PROJECT_ROOT = resolve(__dirname, '..')
const KOISHI_ROOT = resolve(PROJECT_ROOT, '../..')
const DEFAULT_OUTPUT_DIR = join(PROJECT_ROOT, 'output')

export const CARD_VARIANTS: ReadonlyArray<{ imageTheme: ImageTheme, colorMode: Exclude<ColorMode, 'system'> }> = [
  { imageTheme: 'koishi', colorMode: 'light' },
  { imageTheme: 'koishi', colorMode: 'dark' },
  { imageTheme: 'github', colorMode: 'light' },
  { imageTheme: 'github', colorMode: 'dark' },
]

export const PREVIEW_TARGETS: Record<string, string> = {
  'daily--image--github--dark.png': 'daily-github-dark.png',
  'daily--image--github--light.png': 'daily-github-light.png',
  'weather--image--github--dark.png': 'weather-github-dark.png',
  'weather--image--github--light.png': 'weather-github-light.png',
  'hot-weibo--image--github--dark.png': 'hot-weibo-github-dark.png',
  'hot-weibo--image--github--light.png': 'hot-weibo-github-light.png',
  'history--image--github--dark.png': 'history-github-dark.png',
  'history--image--github--light.png': 'history-github-light.png',
  'moyu--image--github--dark.png': 'moyu-github-dark.png',
  'moyu--image--github--light.png': 'moyu-github-light.png',
}

export const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Chromium\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
]

export interface LiveOptions {
  baseUrl?: string
  browserPath?: string
  browserPathFile?: string
  inputs?: string
  outputDir: string
  keepRuns: number
  only?: string[]
  imageTheme?: ImageTheme
  colorMode?: ColorMode
  genPreviewImage?: boolean
  previewDir?: string
}

export interface RegisteredCommand {
  declaration: string
  primary: string
  aliases: string[]
  options: Array<[string, string]>
  action?: Function
  subcommands: RegisteredCommand[]
}

interface CaseInput {
  args: unknown[]
  options?: Record<string, unknown>
}

interface LiveCase extends CaseInput {
  id: string
  command: string
  expected: 'text' | 'image'
  modes: OutputMode[]
}

interface CaseResult {
  id: string
  command: string
  mode: OutputMode
  imageTheme?: ImageTheme
  colorMode?: ColorMode
  expected: string
  ok: boolean
  durationMs: number
  textFile?: string
  imageFile?: string
  error?: string
  logs: string[]
}

export function parseCli(argv: string[]): LiveOptions {
  const out: LiveOptions = { outputDir: DEFAULT_OUTPUT_DIR, keepRuns: 5 }
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (!key.startsWith('--')) throw new Error(`未知参数：${key}`)
    if (key === '--gen-preview-image' || key === '--preview') {
      out.genPreviewImage = true
      continue
    }
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${key} 需要一个值`)
    index += 1
    switch (key) {
      case '--base-url': out.baseUrl = value; break
      case '--browser-path': out.browserPath = value; break
      case '--browser-path-file': out.browserPathFile = value; break
      case '--inputs': out.inputs = value; break
      case '--output-dir': out.outputDir = resolve(value); break
      case '--preview-dir': out.previewDir = resolve(value); break
      case '--keep-runs': {
        const parsed = Number(value)
        if (!Number.isInteger(parsed) || parsed < 1) throw new Error('--keep-runs 必须是正整数')
        out.keepRuns = parsed
        break
      }
      case '--image-theme': {
        if (value !== 'koishi' && value !== 'github') throw new Error('--image-theme 仅支持 koishi 或 github')
        out.imageTheme = value
        break
      }
      case '--color-mode': {
        if (value !== 'light' && value !== 'dark' && value !== 'system') throw new Error('--color-mode 仅支持 light、dark 或 system')
        out.colorMode = value
        break
      }
      // Yarn 的 workspace 脚本会把参数值中的逗号转换为空格，因此同时接受逗号与空白分隔。
      case '--only': out.only = value.split(/[\s,]+/).filter(Boolean); break
      default: throw new Error(`未知参数：${key}`)
    }
  }
  return out
}

/** 只从 Koishi YAML 中读取本脚本需要的两个普通字符串，避免把敏感配置加载或写入报告。 */
export function readKoishiSettings(yaml: string): { baseUrl?: string; executablePath?: string } {
  const plugin = yaml.match(/^  60s-vincentzyu:[^\n]*\n([\s\S]*?)(?=^  \S|^prefix:|$)/m)?.[1] || ''
  const puppeteer = yaml.match(/^  ~puppeteer:[^\n]*\n([\s\S]*?)(?=^  \S|^prefix:|$)/m)?.[1] || ''
  const value = (block: string, key: string) => block.match(new RegExp(`^    ${key}:\\s*(.+?)\\s*$`, 'm'))?.[1]?.replace(/^['"]|['"]$/g, '')
  return { baseUrl: value(plugin, 'baseUrl'), executablePath: value(puppeteer, 'executablePath') }
}

export async function resolveBrowserPath(options: LiveOptions, configPath?: string): Promise<{ path: string; source: string }> {
  if (options.browserPath) return { path: resolve(options.browserPath), source: '--browser-path' }
  if (options.browserPathFile) {
    const content = await readFile(resolve(options.browserPathFile), 'utf8')
    const first = content.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
    if (!first) throw new Error(`浏览器路径文件为空：${options.browserPathFile}`)
    return { path: first, source: '--browser-path-file' }
  }
  if (configPath) return { path: configPath, source: 'koishi.yml puppeteer.executablePath' }
  const found = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!found) throw new Error(`未找到 Chromium/Chrome。请传 --browser-path 或 --browser-path-file。已检查：${BROWSER_CANDIDATES.join('；')}`)
  return { path: found, source: '内置候选路径' }
}

export function buildCases(): LiveCase[] {
  const list = (id: string, command: string, args: unknown[] = [], options: Record<string, unknown> = {}): LiveCase => ({ id, command, args, options, expected: 'text', modes: ['text', 'image'] })
  const image = (id: string, command: string, args: unknown[] = [], options: Record<string, unknown> = {}): LiveCase => ({ id, command, args, options, expected: 'image', modes: ['image'] })
  return [
    { id: 'root', command: '60s', args: [], expected: 'text', modes: ['text'] },
    list('daily', '60s.早报'), list('history', '60s.历史'),
    list('hot', '60s.热榜'),
    ...['weibo', 'bili', 'douyin', 'zhihu', 'toutiao', 'baidu', 'quark', 'rednote', 'dongchedi', 'hn', 'it-rank'].map((source) => list(`hot-${source}`, `60s.热榜.${source}`)),
    list('hitokoto', '60s.一言'), list('duanzi', '60s.段子'), list('joke', '60s.笑话'), list('fabing', '60s.发病', ['小明']), list('answer', '60s.答案'), list('luck', '60s.运势'), list('moyu', '60s.摸鱼'),
    list('exchange-rate', '60s.汇率', ['USD']), list('fuel-price', '60s.油价', ['上海']), list('gold-price', '60s.金价'), list('weather', '60s.天气', ['上海']),
    image('qrcode', '60s.二维码', ['https://github.com/vikiboss/60s']), list('ip', '60s.IP', ['8.8.8.8']), list('password', '60s.密码', [16], { symbols: true }), list('password-check', '60s.密码校验', ['Koishi-60s-Test!2026']), list('baike', '60s.百科', ['Koishi']), list('translate', '60s.翻译', ['Hello, world!']), list('lyric', '60s.歌词', ['晴天']), list('health', '60s.健康', [170, 60], { gender: 'male', age: 25 }), list('maoyan', '60s.猫眼'), list('kuan', '60s.酷安'), image('qq-profile', '60s.QQ', ['10000']),
    list('it-news', '60s.IT'), list('ai-news', '60s.AI'), list('hacker-news', '60s.黑客新闻'),
  ]
}

export function applyInputOverrides(cases: LiveCase[], overrides: Record<string, Partial<CaseInput>>): LiveCase[] {
  return cases.map((item) => {
    const override = overrides[item.id]
    return override ? { ...item, args: override.args ?? item.args, options: { ...item.options, ...override.options } } : item
  })
}

/** 使用运行机器的本地时区，方便按目录名直接定位验收轮次。 */
export function formatRunName(date = new Date()): string {
  const part = (value: number, width = 2) => String(value).padStart(width, '0')
  return [
    `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`,
    `${part(date.getHours())}-${part(date.getMinutes())}-${part(date.getSeconds())}-${part(date.getMilliseconds(), 3)}`,
  ].join('_')
}

function createContext(browser: any) {
  const registrations: RegisteredCommand[] = []
  const logs: string[] = []
  const logger = Object.fromEntries(['debug', 'info', 'warn', 'error'].map((level) => [level, (message: unknown) => logs.push(`[${level}] ${String(message)}`)]))
  const createChain = (registration: RegisteredCommand): any => {
    const chain: any = {
      alias: (...names: string[]) => { registration.aliases.push(...names); return chain },
      option: (name: string, syntax: string) => { registration.options.push([name, syntax]); return chain },
      action: (handler: Function) => { registration.action = handler; return chain },
      subcommand: (declaration: string, _description?: string) => {
        const child: RegisteredCommand = { declaration, primary: declaration.split(' ')[0], aliases: [], options: [], subcommands: [] }
        registration.subcommands.push(child)
        return createChain(child)
      },
    }
    return chain
  }
  const http = async (url: string, options: { timeout?: number } = {}) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout || 15_000)
    try {
      const response = await fetch(url, { signal: controller.signal })
      const text = await response.text()
      let data: unknown = text
      try { data = JSON.parse(text) } catch { /* Client will report an invalid body. */ }
      return { status: response.status, data }
    } finally { clearTimeout(timer) }
  }
  const ctx: any = {
    baseDir: KOISHI_ROOT,
    logger,
    http,
    puppeteer: { page: () => browser.newPage() },
    on: () => {},
    inject: () => {},
    command: (declaration: string, _description?: string) => {
      const registration: RegisteredCommand = { declaration, primary: declaration.split(' ')[0], aliases: [], options: [], subcommands: [] }
      registrations.push(registration)
      return createChain(registration)
    },
  }
  return { ctx, registrations, logs }
}

function findCommand(registrations: RegisteredCommand[], primary: string): RegisteredCommand | undefined {
  for (const registration of registrations) {
    if (registration.primary === primary) return registration
    const found = findCommand(registration.subcommands, primary)
    if (found) return found
  }
}

function safeFileName(value: string) { return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') }

async function saveImage(content: string, destination: string): Promise<boolean> {
  const data = content.match(/data:image\/([a-z0-9+.-]+);base64,([a-z0-9+/=]+)/i)
  if (data) { await writeFile(destination, Buffer.from(data[2], 'base64')); return true }
  const remote = content.match(/<img\s+[^>]*src=["']([^"']+)["']/i)?.[1]
  if (!remote || !/^https?:\/\//i.test(remote)) return false
  const response = await fetch(remote)
  if (!response.ok) throw new Error(`下载图片失败：HTTP ${response.status}`)
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
  return true
}

async function pruneRuns(runsDir: string, keep: number) {
  const entries = await readdir(runsDir, { withFileTypes: true })
  const directories = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => ({
    path: join(runsDir, entry.name),
    time: (await stat(join(runsDir, entry.name))).mtimeMs,
  })))
  directories.sort((a, b) => b.time - a.time)
  await Promise.all(directories.slice(keep).map((entry) => rm(entry.path, { recursive: true, force: true })))
}

function reportMarkdown(results: CaseResult[], baseUrl: string, browser: { path: string; source: string }) {
  const passed = results.filter((item) => item.ok).length
  const lines = [
    '# 60s 真实 API 验收报告', '',
    `- 时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    `- API：${baseUrl}`,
    `- 浏览器：${browser.path}（${browser.source}）`,
    `- 结果：${passed}/${results.length} 通过`, '',
    '| 案例 | 模式 | 卡片主题 | 明暗模式 | 预期 | 结果 | 耗时 | 产物 / 错误 |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- |',
    ...results.map((item) => `| ${item.id} | ${item.mode} | ${item.imageTheme || '-'} | ${item.colorMode || '-'} | ${item.expected} | ${item.ok ? 'PASS' : 'FAIL'} | ${item.durationMs} ms | ${item.imageFile || item.textFile || item.error || ''} |`),
  ]
  return `${lines.join('\n')}\n`
}

async function syncPreviewImages(imageDir: string, options: LiveOptions) {
  const outputPreviewDir = join(options.outputDir, 'preview')
  const docsPreviewDir = options.previewDir || join(PROJECT_ROOT, 'docs', 'images', 'preview')

  await mkdir(outputPreviewDir, { recursive: true })
  if (options.genPreviewImage) {
    await mkdir(docsPreviewDir, { recursive: true })
  }

  const generated = await readdir(imageDir)
  const copiedToDocs: string[] = []
  const copiedToOutput: string[] = []

  for (const file of generated) {
    const src = join(imageDir, file)
    await copyFile(src, join(outputPreviewDir, file))
    copiedToOutput.push(file)

    if (options.genPreviewImage) {
      const targetName = PREVIEW_TARGETS[file]
      if (targetName) {
        await copyFile(src, join(docsPreviewDir, targetName))
        copiedToDocs.push(`${file} -> ${targetName}`)
      }
    }
  }

  if (copiedToOutput.length) {
    console.log(`[Preview] 已更新本地预览目录: ${outputPreviewDir} (${copiedToOutput.length} 张图片)`)
  }
  if (options.genPreviewImage && copiedToDocs.length) {
    console.log(`[Preview] 已同步到文档预览目录: ${docsPreviewDir}:\n  - ${copiedToDocs.join('\n  - ')}`)
  }
}

export async function main() {
  const options = parseCli(process.argv.slice(2))
  const configText = await readFile(join(KOISHI_ROOT, 'koishi.yml'), 'utf8')
  const settings = readKoishiSettings(configText)
  const baseUrl = options.baseUrl || settings.baseUrl
  if (!baseUrl) throw new Error('未从 koishi.yml 找到 60s-vincentzyu 的 baseUrl，请传 --base-url。')
  const browserPath = await resolveBrowserPath(options, settings.executablePath)
  if (!existsSync(browserPath.path)) throw new Error(`浏览器路径不存在：${browserPath.path}`)

  const overridePath = options.inputs ? resolve(options.inputs) : undefined
  const overrides = overridePath ? JSON.parse(await readFile(overridePath, 'utf8')) as Record<string, Partial<CaseInput>> : {}
  const selected = applyInputOverrides(buildCases(), overrides).filter((item) => !options.only || options.only.includes(item.id))
  if (!selected.length) throw new Error(`--only 未匹配到任何案例：${options.only?.join(', ') || '(空)'}。可用案例：${buildCases().map((item) => item.id).join(', ')}`)

  const runsDir = join(options.outputDir, 'runs')
  const runName = formatRunName()
  const runDir = join(runsDir, runName)
  const textDir = join(runDir, 'text')
  const imageDir = join(runDir, 'images')
  await Promise.all([mkdir(textDir, { recursive: true }), mkdir(imageDir, { recursive: true })])

  // 使用本轮私有 profile，避免复用系统 Chromium 的用户目录和锁文件。
  const browser = await puppeteer.launch({
    executablePath: browserPath.path,
    headless: true,
    userDataDir: join(runDir, 'browser-profile'),
    args: ['--disable-crash-reporter'],
  })
  const results: CaseResult[] = []
  try {
    const { ctx, registrations, logs } = createContext(browser)
    const config: Config = {
      baseUrl, timeout: 30_000, commandPrefix: '60s', renderPreset: 'general', customCommandOutput: { ...DEFAULT_CUSTOM_COMMAND_OUTPUT }, enableQuote: false, enableWaitingHint: false,
      qqMarkdownKeyboardJson: '{}', qqMarkdownButtonMode: 'append-to-markdown', imageType: 'png', screenshotQuality: 88, imageWidth: 760,
      imageTheme: options.imageTheme || 'koishi', colorMode: options.colorMode || 'light', fontMode: 'npm-lxgw', customFontPath: '', scheduleTimezoneGmtOffset: 8, scheduledTasks: [], verboseConsoleLog: false,
    }
    await apply(ctx, config)
    const theme = options.imageTheme
    const colorMode = options.colorMode
    const imageVariants = CARD_VARIANTS.filter((v) => {
      if (theme && v.imageTheme !== theme) return false
      if (colorMode && v.colorMode !== colorMode) return false
      return true
    })
    for (const item of selected) for (const mode of item.modes) for (const variant of mode === 'image' ? imageVariants : [undefined]) {
      const started = Date.now()
      const startLog = logs.length
      const sent: string[] = []
      let error: string | undefined
      let textFile: string | undefined
      let imageFile: string | undefined
      try {
        if (variant) {
          config.imageTheme = variant.imageTheme
          config.colorMode = variant.colorMode
        }
        const command = findCommand(registrations, item.command)
        if (!command?.action) throw new Error(`未找到已注册命令：${item.command}`)
        const session: any = { platform: 'onebot', userId: 'live-output', channelId: 'live-output', messageId: 'live-output', timestamp: Date.now(), bot: { config: {}, deleteMessage: async () => {} }, send: async (content: string) => { sent.push(String(content)); return ['live-output'] } }
        const actionOptions = { ...item.options, mode: mode === 'image' && item.expected !== 'image' ? 'card' : mode }
        await command.action({ session, options: actionOptions }, ...item.args)
        const content = sent.join('\n\n')
        if (!content) throw new Error('命令没有发送任何内容')
        if (/^❌|\n❌/.test(content)) throw new Error(content)
        const stem = variant
          ? `${safeFileName(item.id)}--${mode}--${variant.imageTheme}--${variant.colorMode}`
          : `${safeFileName(item.id)}--${mode}`
        if (item.expected === 'image') {
          const file = `${stem}.png`
          if (!await saveImage(content, join(imageDir, file))) throw new Error('预期图片输出，但未捕获 data URL 或远程图片 URL')
          imageFile = `images/${file}`
        } else if (mode === 'image') {
          const file = `${stem}.png`
          if (!await saveImage(content, join(imageDir, file))) throw new Error('图片模式未捕获到截图产物')
          imageFile = `images/${file}`
        } else {
          const file = `${stem}.txt`
          await writeFile(join(textDir, file), content, 'utf8')
          textFile = `text/${file}`
        }
      } catch (cause) { error = cause instanceof Error ? cause.message : String(cause) }
      results.push({ id: item.id, command: item.command, mode, imageTheme: variant?.imageTheme, colorMode: variant?.colorMode, expected: item.expected, ok: !error, durationMs: Date.now() - started, textFile, imageFile, error, logs: logs.slice(startLog) })
      console.log(`${error ? 'FAIL' : 'PASS'} ${item.id} [${mode}${variant ? ` / ${variant.imageTheme} / ${variant.colorMode}` : ''}] ${Date.now() - started}ms${error ? `: ${error}` : ''}`)
    }
  } finally { await browser.close() }

  const manifest = { generatedAt: new Date().toISOString(), baseUrl, browser: browserPath, results }
  await writeFile(join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  await writeFile(join(runDir, 'report.json'), JSON.stringify(results, null, 2), 'utf8')
  await writeFile(join(runDir, 'report.md'), reportMarkdown(results, baseUrl, browserPath), 'utf8')
  await pruneRuns(runsDir, options.keepRuns)
  await syncPreviewImages(imageDir, options)
  const failed = results.filter((item) => !item.ok)
  console.log(`验收完成：${results.length - failed.length}/${results.length} 通过，报告：${join(runDir, 'report.md')}`)
  if (failed.length) process.exitCode = 1
}

if (require.main === module) {
  main().catch((error) => { console.error(error); process.exitCode = 1 })
}
