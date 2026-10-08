import { describe, expect, it } from 'vitest'
import { buildCardHtml, buildListItems, fillTemplate, loadCommonCss, loadTemplate } from '../../src/render/template'

describe('render/template', () => {
  it('loads all template files', () => {
    for (const name of ['daily', 'hot', 'weather', 'simple', 'media']) {
      const html = loadTemplate(name)
      expect(html).toContain('<html')
      expect(html).toContain('{{title}}')
    }
  })

  it('loads common css', () => {
    const css = loadCommonCss()
    expect(css).toContain("data-image-theme='koishi'")
    expect(css).toContain("data-image-theme='github'")
    expect(css).toContain("data-color-mode='dark'")
    expect(css).toContain("data-color-mode='system'")
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('.card')
  })

  it('fills placeholders', () => {
    const result = fillTemplate('{{title}}|{{missing}}|{{footer}}', { title: '微博热搜', footer: '60s API' })
    expect(result).toBe('微博热搜||60s API')
  })

  it('builds daily card html with image theme, color mode and inline css', () => {
    const html = buildCardHtml('daily', {
      title: '2026-08-07 星期五',
      subtitle: '每日微语',
      items_html: buildListItems([{ text: '新闻一' }, { text: '新闻二', hot: 999 }]),
      footer: '60s API · 六月廿五',
    }, { imageTheme: 'koishi', colorMode: 'light' })

    expect(html).toContain('data-image-theme="koishi"')
    expect(html).toContain('data-color-mode="light"')
    expect(html).toContain('<style>')
    expect(html).toContain('新闻一')
    expect(html).toContain('🔥999')
    expect(html).toContain('top1')
    expect(html).toContain('top2')
  })

  it('builds list items without ranks when hidden', () => {
    const html = buildListItems([{ text: '🏖️ 周末' }, { text: '📊 本周进度' }], 1, { showRank: false })
    expect(html).toContain('list-line no-rank')
    expect(html).toContain('🏖️ 周末')
    expect(html).toContain('📊 本周进度')
    expect(html).not.toContain('list-rank')
  })

  it('appends configured card font css', () => {
    const html = buildCardHtml('simple', {
      title: '字体测试',
      body: '霞鹜文楷',
      footer: '60s API',
    }, { imageTheme: 'koishi', colorMode: 'system', fontCss: "body { font-family: 'Test Font'; }" })

    expect(html).toContain("font-family: 'Test Font'")
  })

  it('builds hot card with github dark mode', () => {
    const html = buildCardHtml('hot', {
      title: '微博热搜',
      items_html: buildListItems([{ text: '词条一' }]),
      footer: '60s API',
    }, { imageTheme: 'github', colorMode: 'dark' })
    expect(html).toContain('data-image-theme="github"')
    expect(html).toContain('data-color-mode="dark"')
  })

  it('builds weather card', () => {
    const html = buildCardHtml('weather', {
      title: '成都',
      temp: '31°C',
      info_html: '<div>多云</div>',
      sections_html: '<div>生活指数</div>',
      footer: '60s API',
    }, { imageTheme: 'koishi', colorMode: 'system' })
    expect(html).toContain('31°C')
    expect(html).toContain('weather-main')
  })

  it('builds simple card', () => {
    const html = buildCardHtml('simple', {
      title: '一言',
      body: '今夕何夕',
      footer: '60s API',
    }, { imageTheme: 'koishi', colorMode: 'system' })
    expect(html).toContain('single-body')
    expect(html).toContain('今夕何夕')
  })

  it('builds media card', () => {
    const html = buildCardHtml('media', {
      title: '二维码', subtitle: '扫描使用', mediaUrl: 'https://example.test/code.png', mediaShape: 'square', footer: '60s API',
    }, { imageTheme: 'github', colorMode: 'light' })
    expect(html).toContain('media-image square')
    expect(html).toContain('https://example.test/code.png')
  })
})
