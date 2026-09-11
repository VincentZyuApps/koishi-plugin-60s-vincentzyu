import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Context } from 'koishi'
import { FONT_MODE, type Config } from '../config'

// 本插件由当前工作区编译为 CommonJS，不能依赖 import.meta.url。
const require = createRequire(__filename)

export const LXGW_RELEASE_FILE_NAME = 'LXGWWenKaiMono-Regular.ttf'
const FONT_FAMILY = '60s LXGW WenKai Mono'
const GITEE_RELEASE_BASE = 'https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts'
const GITHUB_RELEASE_BASE = 'https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts'
const RELEASE_SOURCES = [
  { name: 'Gitee', url: `${GITEE_RELEASE_BASE}/${LXGW_RELEASE_FILE_NAME}` },
  { name: 'GitHub', url: `${GITHUB_RELEASE_BASE}/${LXGW_RELEASE_FILE_NAME}` },
]
const RELEASE_SHA256 = 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61'
const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2'])
const SYSTEM_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif"

const npmCssCache = new Map<string, string>()
const releaseDownloadCache = new Map<string, Promise<string>>()

function getFontFormat(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  if (!FONT_EXTENSIONS.has(extension)) {
    throw new Error(`不支持的字体格式：${extension || '无扩展名'}，仅支持 .ttf、.otf、.woff、.woff2`)
  }
  return extension.slice(1)
}

function toFileUrl(filePath: string) {
  return pathToFileURL(filePath).href
}

function createSingleFontCss(filePath: string, family = FONT_FAMILY) {
  const format = getFontFormat(filePath)
  return [
    '@font-face {',
    `  font-family: '${family}';`,
    `  src: url('${toFileUrl(filePath)}') format('${format}');`,
    '  font-style: normal;',
    '  font-weight: 400;',
    '  font-display: block;',
    '}',
    `body { font-family: '${family}', ${SYSTEM_FONT_STACK}; }`,
  ].join('\n')
}

function createSystemFontCss() {
  return `body { font-family: ${SYSTEM_FONT_STACK}; }`
}

function getReleaseFontPath(ctx: Context) {
  return path.join(ctx.baseDir, 'data', 'fonts', LXGW_RELEASE_FILE_NAME)
}

function verifyReleaseFont(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex') === RELEASE_SHA256
}

async function ensureReleaseFont(ctx: Context) {
  const target = getReleaseFontPath(ctx)
  const cached = releaseDownloadCache.get(target)
  if (cached) return cached

  const task = (async () => {
    let replaceInvalidFile = false
    if (existsSync(target)) {
      const existing = await readFile(target)
      if (verifyReleaseFont(existing)) return target
      replaceInvalidFile = true
      ctx.logger.warn(`[60s] Release 字体文件校验失败，将重新下载：${target}`)
    }

    await mkdir(path.dirname(target), { recursive: true })
    let lastError: unknown
    for (const source of RELEASE_SOURCES) {
      const temporary = `${target}.${process.pid}.part`
      try {
        ctx.logger.info(`[60s] 下载字体 ${LXGW_RELEASE_FILE_NAME}（${source.name}）`)
        const response = await ctx.http.get(source.url, { responseType: 'arraybuffer', timeout: 60000 })
        const buffer = Buffer.from(response)
        if (!verifyReleaseFont(buffer)) throw new Error('SHA-256 校验失败')
        await writeFile(temporary, buffer)
        if (replaceInvalidFile) await unlink(target)
        await rename(temporary, target)
        ctx.logger.info(`[60s] 字体下载完成并通过 SHA-256 校验（${source.name}）`)
        return target
      } catch (error) {
        lastError = error
        await unlink(temporary).catch(() => {})
        ctx.logger.warn(`[60s] ${source.name} 字体下载失败：${error instanceof Error ? error.message : error}`)
      }
    }
    throw new Error(`Release 字体下载失败，Gitee 与 GitHub 均不可用：${lastError instanceof Error ? lastError.message : lastError}`)
  })()

  releaseDownloadCache.set(target, task)
  try {
    return await task
  } catch (error) {
    releaseDownloadCache.delete(target)
    throw error
  }
}

function rangeIncludesCharacter(range: string, codePoint: number) {
  return range.split(',').some((item) => {
    const [start, end = start] = item.trim().replace(/^U\+/i, '').split('-')
    const from = Number.parseInt(start, 16)
    const to = Number.parseInt(end, 16)
    return codePoint >= from && codePoint <= to
  })
}

function loadNpmLxgwCss(content = '') {
  const cssPath = require.resolve('@chinese-fonts/lxgwwenkai/dist/LXGWWenKai-Regular/result.css')
  const cssDirectory = path.dirname(cssPath)
  const allFaces = require('node:fs').readFileSync(cssPath, 'utf-8').match(/@font-face\{[^}]+\}/g) || []
  const codePoints = new Set(Array.from(content).map((character) => character.codePointAt(0)!))
  const faces = codePoints.size
    ? allFaces.filter((face: string) => {
      const unicodeRange = face.match(/unicode-range:([^;]+);/)?.[1]
      return unicodeRange && Array.from(codePoints).some((point) => rangeIncludesCharacter(unicodeRange, point))
    })
    : allFaces
  const cacheKey = `${cssPath}|${faces.join('')}`
  const cached = npmCssCache.get(cacheKey)
  if (cached) return cached

  const css = faces.map((face: string) => face
    // 仅嵌入当前卡片所需的 npm 字体分片，避免 file:// 跨源限制与完整字体的体积开销。
    .replace(/local\("LXGW WenKai"\),/g, '')
    .replace(/font-display:swap/g, 'font-display:block')
    .replace(/url\((['"]?)(\.\/[^)'\"]+)\1\)/g, (_match: string, _quote: string, relativePath: string) => {
      const file = path.resolve(cssDirectory, relativePath)
      const base64 = require('node:fs').readFileSync(file).toString('base64')
      return `url('data:font/woff2;base64,${base64}')`
    }),
  ).join('\n')
  const result = `${css}\nbody { font-family: 'LXGW WenKai', ${SYSTEM_FONT_STACK}; }`
  npmCssCache.set(cacheKey, result)
  return result
}

/** 按当前配置准备 Puppeteer 卡片使用的字体 CSS。 */
export async function resolveCardFontCss(ctx: Context, config: Config, content?: string) {
  switch (config.fontMode) {
    case FONT_MODE.NPM_LXGW:
      return loadNpmLxgwCss(content)
    case FONT_MODE.RELEASE_LXGW:
      return createSingleFontCss(await ensureReleaseFont(ctx))
    case FONT_MODE.CUSTOM_PATH: {
      if (!config.customFontPath.trim()) throw new Error('已选择“指定字体绝对路径”，但未填写字体文件路径')
      if (!path.isAbsolute(config.customFontPath)) throw new Error(`自定义字体路径必须为绝对路径：${config.customFontPath}`)
      if (!existsSync(config.customFontPath)) throw new Error(`自定义字体文件不存在：${config.customFontPath}`)
      return createSingleFontCss(config.customFontPath.trim(), '60s Custom Font')
    }
    case FONT_MODE.SYSTEM_DEFAULT:
      return createSystemFontCss()
    default:
      throw new Error(`未知字体模式：${config.fontMode}`)
  }
}
