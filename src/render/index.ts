import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Daily60s } from '../types'
import { buildCardHtml, buildListItems, escapeHtml, type CardBuildOptions } from './template'
import type { CardData, CardTemplate } from './dispatch'
import { resolveCardFontCss } from '../utils/font'
import { getDailyNewsTitle } from '../utils/format'

export type { CardData, CardTemplate }

function getCardFontText(data: CardData) {
  return [
    data.title,
    data.subtitle,
    data.body,
    data.temp,
    data.footer,
    data.mediaUrl,
    ...(data.items || []).map((item) => item.text),
    ...(data.infoLines || []),
    ...(data.sections || []).flatMap((section) => [section.title, ...section.lines]),
  ].filter(Boolean).join('\n')
}

/** 把结构化卡片数据渲染成 HTML 字符串 */
export function renderCardToHtml(data: CardData, config: Config, template: CardTemplate, fontCss?: string): string {
  const options: CardBuildOptions = {
    imageTheme: config.imageTheme,
    colorMode: config.colorMode,
    width: config.imageWidth,
    fontCss,
  }

  if (template === 'daily') {
    return buildCardHtml('daily', {
      title: data.title,
      subtitle: data.subtitle ?? '',
      items_html: data.items ? buildListItems(data.items, 1) : '',
      footer: data.footer ?? '',
    }, options)
  }

  if (template === 'hot') {
    return buildCardHtml('hot', {
      title: data.title,
      subtitle: data.subtitle ?? '',
      items_html: data.items ? buildListItems(data.items, 1) : '',
      footer: data.footer ?? '',
    }, options)
  }

  if (template === 'weather') {
    return buildCardHtml('weather', {
      title: (data.title || '').replace(/^🌤️\s*/, ''),
      subtitle: data.subtitle ?? '',
      temp: data.temp ?? '',
      info_html: data.infoLines ? data.infoLines.map((l) => `<div>${l}</div>`).join('') : '',
      sections_html: data.sections
        ? data.sections.map((s) => `<div class="weather-section"><div class="weather-section-title">${s.title}</div>${s.lines.map((l) => `<div>${l}</div>`).join('')}</div>`).join('')
        : '',
      footer: data.footer ?? '',
    }, options)
  }

  if (template === 'media') {
    return buildCardHtml('media', {
      title: escapeHtml(data.title),
      subtitle: escapeHtml(data.subtitle ?? ''),
      mediaUrl: escapeHtml(data.mediaUrl ?? ''),
      mediaShape: data.mediaShape ?? 'cover',
      footer: escapeHtml(data.footer ?? ''),
    }, options)
  }

  // simple
  return buildCardHtml('simple', {
    title: data.title,
    subtitle: data.subtitle ?? '',
    body: data.body ?? '',
    footer: data.footer ?? '',
  }, options)
}

/** 用 puppeteer 渲染卡片并返回 data URL */
export async function renderCard(
  ctx: Context,
  config: Config,
  data: CardData,
  template: CardTemplate = 'hot',
): Promise<string> {
  const puppeteer = (ctx as any).puppeteer
  if (!puppeteer) throw new Error('puppeteer 未安装')
  const page = await puppeteer.page()
  try {
    const fontCss = await resolveCardFontCss(ctx, config, getCardFontText(data))
    const html = renderCardToHtml(data, config, template, fontCss)
    // 字体以 data: URL 内嵌，无需等待网络空闲；中文分片较多时 networkidle0 容易无谓超时。
    await page.setContent(html, { waitUntil: 'load', timeout: 60_000 })
    await page.waitForSelector('.card', { timeout: 5000 })
    await page.evaluate(() => (document as any).fonts?.ready).catch(() => {})
    const wrapper = await page.$('.card') || await page.$('body')
    const shot = await wrapper.screenshot({
      type: config.imageType,
      encoding: 'base64',
      ...(config.imageType !== 'png' ? { quality: config.screenshotQuality } : {}),
    })
    return `data:image/${config.imageType};base64,${shot}`
  } finally {
    await page.close().catch(() => {})
  }
}

export async function renderDailyCard(ctx: Context, config: Config, data: Daily60s): Promise<string> {
  return renderCard(ctx, config, {
    title: `${data.date} ${data.day_of_week}`,
    subtitle: data.tip || '每日微语',
    items: data.news.map((n) => ({ text: getDailyNewsTitle(n) })),
    footer: `60s API · ${data.lunar_date}`,
  }, 'daily')
}
