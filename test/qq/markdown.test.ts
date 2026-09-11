import { describe, expect, it } from 'vitest'
import { sendQQMarkdown } from '../../src/qq/markdown'
import { makeConfig, makeSession } from '../helpers/setup'

describe('qq/markdown', () => {
  it('none 模式不携带按钮', async () => {
    const session = makeSession({ platform: 'qq' })
    await sendQQMarkdown(session, '# 热榜', makeConfig({ qqMarkdownButtonMode: 'none' }), '60s.热榜')
    const payload = session.bot.internal.sendMessage.mock.calls[0][1]
    expect(payload.keyboard).toBeUndefined()
    expect(session.bot.internal.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('append-to-markdown 模式把按钮附到原生 Markdown', async () => {
    const session = makeSession({ platform: 'qq' })
    await sendQQMarkdown(session, '# 热榜', makeConfig({ qqMarkdownButtonMode: 'append-to-markdown' }), '60s.热榜')
    const payload = session.bot.internal.sendMessage.mock.calls[0][1]
    expect(payload.keyboard?.content?.rows?.[0]?.buttons).toHaveLength(2)
    expect(session.bot.internal.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('standalone 模式单独发送一次按钮', async () => {
    const session = makeSession({ platform: 'qq' })
    await sendQQMarkdown(session, '# 热榜', makeConfig({ qqMarkdownButtonMode: 'standalone' }), '60s.热榜')
    expect(session.bot.internal.sendMessage).toHaveBeenCalledTimes(2)
    expect(session.bot.internal.sendMessage.mock.calls[0][1].keyboard).toBeUndefined()
    expect(session.bot.internal.sendMessage.mock.calls[1][1].keyboard?.content?.rows?.[0]?.buttons).toHaveLength(2)
  })
})
