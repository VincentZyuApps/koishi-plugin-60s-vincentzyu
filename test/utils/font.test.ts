import { describe, expect, it } from 'vitest'
import { FONT_MODE, type Config } from '../../src/config'
import { resolveCardFontCss } from '../../src/utils/font'

const context = { baseDir: process.cwd(), logger: {}, http: {} } as any

function createConfig(fontMode: Config['fontMode'], customFontPath = '') {
  return { fontMode, customFontPath } as Config
}

describe('utils/font', () => {
  it('loads the bundled complete LXGW npm CSS with local font URLs', async () => {
    const css = await resolveCardFontCss(context, createConfig(FONT_MODE.NPM_LXGW), '霞鹜文楷中文测试')
    expect(css).toContain("font-family: 'LXGW WenKai'")
    expect(css).toContain('data:font/woff2;base64,')
    expect(css).not.toContain('local("LXGW WenKai")')
  })

  it('keeps the system font stack when system mode is selected', async () => {
    const css = await resolveCardFontCss(context, createConfig(FONT_MODE.SYSTEM_DEFAULT))
    expect(css).toContain("'PingFang SC'")
    expect(css).not.toContain('@font-face')
  })

  it('rejects an empty custom font path', async () => {
    await expect(resolveCardFontCss(context, createConfig(FONT_MODE.CUSTOM_PATH)))
      .rejects.toThrow('未填写字体文件路径')
  })
})
