import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ColorMode, ImageTheme } from '../config'
import type { TemplateName } from './themes'

function resolveTemplatesDir(): string {
  const candidates = [
    path.resolve(__dirname, '../templates'),
    path.resolve(__dirname, '../../templates'),
    path.resolve(__dirname, 'templates'),
  ]
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'common.css'))) {
      return dir
    }
  }
  return candidates[0]
}

const TEMPLATES_DIR = resolveTemplatesDir()

const templateCache = new Map<string, string>()

/** 加载模板文件（带缓存） */
export function loadTemplate(name: TemplateName): string {
  const file = path.join(TEMPLATES_DIR, `${name}.html`)
  if (!templateCache.has(file)) {
    templateCache.set(file, readFileSync(file, 'utf-8'))
  }
  return templateCache.get(file)!
}

/** 加载 CSS 内容（带缓存） */
export function loadCommonCss(): string {
  const file = path.join(TEMPLATES_DIR, 'common.css')
  if (!templateCache.has(file)) {
    templateCache.set(file, readFileSync(file, 'utf-8'))
  }
  return templateCache.get(file)!
}

/** 占位符替换（缺失的占位符替换为空串） */
export function fillTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return data[key] ?? ''
  })
}

/** 渲染 HTML 转义 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface CardBuildOptions {
  imageTheme: ImageTheme
  colorMode: ColorMode
  width?: number
  fontCss?: string
}

/** 组合最终 HTML（内联 CSS + 填充模板） */
export function buildCardHtml(
  templateName: TemplateName,
  data: Record<string, string>,
  options: CardBuildOptions,
): string {
  const template = loadTemplate(templateName)
  const css = loadCommonCss()
  const filled = fillTemplate(template, {
    imageTheme: options.imageTheme,
    colorMode: options.colorMode,
    ...data,
  })
  // 把 <link rel="stylesheet" href="./common.css"> 替换为内联 <style>
  return filled.replace(
    '<link rel="stylesheet" href="./common.css">',
    `<style>${css}${options.fontCss ? `\n${options.fontCss}` : ''}</style>`,
  )
}

/** 列表项 → 循环 HTML（Top3 高亮） */
export function buildListItems(
  items: Array<{ text: string; hot?: string | number }>,
  start = 1,
): string {
  return items
    .map((item, i) => {
      const rank = start + i
      const topClass = rank === 1 ? ' top1' : rank === 2 ? ' top2' : rank === 3 ? ' top3' : ''
      const hot = item.hot !== undefined ? `<span class="list-hot">🔥${item.hot}</span>` : ''
      return `<div class="list-line"><span class="list-rank${topClass}">${rank}</span><span class="list-text">${escapeHtml(item.text)}</span>${hot}</div>`
    })
    .join('')
}
