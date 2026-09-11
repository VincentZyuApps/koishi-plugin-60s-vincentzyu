import { describe, expect, it } from 'vitest'
import { parseModeOption } from '../../src/commands/helper'
import { renderReply, sendReply } from '../../src/render/dispatch'
import { makeConfig, makeSession } from '../helpers/setup'

describe('render/dispatch', () => {
  const cardData = { title: '测试卡片', body: '卡片正文' }

  it('uses general-auto behavior for qq-auto outside QQ official bots', async () => {
    const result = await renderReply(
      {} as any,
      makeSession({ platform: 'onebot' }),
      {} as any,
      makeConfig({ renderModePriority: [{ mode: 'qq-auto', enabled: true }] }),
      { text: '文本兜底', cardData, kind: 'list' },
    )

    // general-auto maps lists to image; the unavailable card renderer then hard-skips to text.
    expect(result.mode).toBe('text')
    expect(result.elements).toContain('文本兜底')
  })

  it('uses QQ Markdown for qq-auto lists on QQ official bots', async () => {
    const session = makeSession({ platform: 'qq' })
    const result = await renderReply(
      {} as any,
      session,
      {} as any,
      makeConfig({ enableQQMarkdown: true, renderModePriority: [{ mode: 'qq-auto', enabled: true }] }),
      { text: '热榜文本', markdown: '# 热榜', kind: 'list' },
      '60s.热榜',
    )

    expect(result.mode).toBe('qq-markdown')
    expect(session.bot.internal.sendMessage).toHaveBeenCalled()
  })

  it('uses image output for general-auto lists when an image URL is available', async () => {
    const result = await renderReply(
      {} as any,
      makeSession(),
      {} as any,
      makeConfig({ renderModePriority: [{ mode: 'general-auto', enabled: true }] }),
      { text: '热榜文本', imageUrl: 'https://example.test/card.png', kind: 'list' },
    )

    expect(result.mode).toBe('image')
    expect(result.elements).toContain('https://example.test/card.png')
  })

  it('hard-skips unavailable card images and reaches the text fallback', async () => {
    const result = await renderReply(
      {} as any,
      makeSession(),
      {} as any,
      makeConfig({ renderModePriority: [{ mode: 'image', enabled: true }] }),
      { text: '文本兜底', cardData, kind: 'list' },
    )

    expect(result.mode).toBe('text')
    expect(result.elements).toContain('文本兜底')
  })

  it('tries an unavailable mode override before the configured fallback', async () => {
    const result = await renderReply(
      {} as any,
      makeSession(),
      {} as any,
      makeConfig({ renderModePriority: [{ mode: 'text', enabled: true }] }),
      { text: '文本兜底', cardData, kind: 'list', modeOverride: 'image' },
    )

    expect(result.mode).toBe('text')
  })

  it('accepts the new mode options and rejects the removed auto option', () => {
    expect(parseModeOption('qq-auto')).toBe('qq-auto')
    expect(parseModeOption('general-auto')).toBe('general-auto')
    expect(parseModeOption('auto')).toBeUndefined()
  })

  it('applies enableQuote to the waiting hint and the final reply', async () => {
    const session = makeSession()
    await sendReply(
      {} as any,
      session,
      {} as any,
      makeConfig({ enableQuote: true, enableWaitingHint: true, renderModePriority: [{ mode: 'text', enabled: true }] }),
      { text: '早报内容' },
    )

    expect(session.send).toHaveBeenCalledTimes(2)
    expect(session.send.mock.calls[0][0]).toContain('<quote id="msg-1">')
    expect(session.send.mock.calls[0][0]).toContain('⏳ 获取中，请稍候…')
    expect(session.send.mock.calls[1][0]).toContain('<quote id="msg-1">')
    expect(session.send.mock.calls[1][0]).toContain('早报内容')
    expect(session.bot.deleteMessage).toHaveBeenCalledWith('456', 'mock-msg-id')
  })
})
