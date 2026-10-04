import { describe, expect, it } from 'vitest'
import { BROWSER_CANDIDATES, CARD_VARIANTS, applyInputOverrides, buildCases, formatRunName, parseCli, readKoishiSettings } from '../../scripts/live-output'

describe('live-output helpers', () => {
  it('parses supported CLI overrides', () => {
    expect(parseCli(['--base-url', 'http://example.test', '--keep-runs', '3', '--only', 'daily,weather']).baseUrl).toBe('http://example.test')
    expect(parseCli(['--base-url', 'http://example.test', '--keep-runs', '3', '--only', 'daily,weather']).only).toEqual(['daily', 'weather'])
    expect(parseCli(['--image-theme', 'github', '--color-mode', 'dark'])).toMatchObject({ imageTheme: 'github', colorMode: 'dark' })
    expect(parseCli(['--gen-preview-image', '--preview-dir', 'D:\\preview']).genPreviewImage).toBe(true)
    expect(parseCli(['--preview']).genPreviewImage).toBe(true)
    expect(() => parseCli(['--keep-runs', '0'])).toThrow('正整数')
    expect(() => parseCli(['--color-mode', 'sepia'])).toThrow('仅支持')
  })

  it('reads only the required plain settings from Koishi YAML', () => {
    const yaml = [
      '  ~puppeteer:abc:',
      '    executablePath: E:\\Chrome\\chrome.exe',
      '  60s-vincentzyu:def:',
      '    baseUrl: http://api.example.test:64399',
      '  other:test:',
      '    token: should-not-be-read',
    ].join('\n')
    expect(readKoishiSettings(yaml)).toEqual({ baseUrl: 'http://api.example.test:64399', executablePath: 'E:\\Chrome\\chrome.exe' })
  })

  it('keeps default inputs unless a stable case id overrides them', () => {
    const daily = buildCases().find((item) => item.id === 'daily')!
    const changed = applyInputOverrides([daily], { daily: { args: ['2026-08-01'], options: { image: true } } })[0]
    expect(changed.args).toEqual(['2026-08-01'])
    expect(changed.options).toEqual({ image: true })
  })

  it('contains five Windows and five Linux browser candidates', () => {
    expect(BROWSER_CANDIDATES).toHaveLength(10)
    expect(BROWSER_CANDIDATES.filter((item) => /^[A-Z]:\\/i.test(item))).toHaveLength(5)
    expect(BROWSER_CANDIDATES.filter((item) => item.startsWith('/'))).toHaveLength(5)
  })

  it('defines the four explicit card color variants', () => {
    expect(CARD_VARIANTS).toEqual([
      { imageTheme: 'koishi', colorMode: 'light' },
      { imageTheme: 'koishi', colorMode: 'dark' },
      { imageTheme: 'github', colorMode: 'light' },
      { imageTheme: 'github', colorMode: 'dark' },
    ])
  })

  it('formats output run names in the local timezone components', () => {
    const local = new Date(2026, 7, 26, 8, 15, 4, 32)
    expect(formatRunName(local)).toBe('2026-08-26_08-15-04-032')
  })
})
