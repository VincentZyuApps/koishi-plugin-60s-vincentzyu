import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerHotCommands } from '../../src/commands/hot'

const hotItem = { title: '热搜词', link: '' }

describe('commands/hot', () => {
  it('registers main 60s热榜 command with alias and option', async () => {
    const { ctx, registrations } = mockCommandContext()
    await registerHotCommands(ctx, makeConfig(), makeClient())
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    expect(reg).toBeTruthy()
    expect(reg!.aliases).toContain('60s hot')
    expect(reg!.options.map((o) => o[0])).toContain('verbose')
  })

  it('registers subcommands for all platforms', async () => {
    const { ctx, registrations } = mockCommandContext()
    await registerHotCommands(ctx, makeConfig(), makeClient())
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const platforms = ['weibo', 'bili', 'douyin', 'zhihu', 'toutiao', 'baidu', 'quark', 'rednote', 'dongchedi', 'hn', 'it-rank']
    for (const p of platforms) {
      expect(reg!.subcommands.some((s) => s.primary === `60s.热榜.${p}`)).toBe(true)
    }
  })

  it('main command calls getWeibo by default', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({ getWeibo: vi.fn().mockResolvedValue([hotItem, { title: '第二' }]) })
    await registerHotCommands(ctx, makeConfig(), client)
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const session = makeSession()
    await reg!.action!({ session, options: {} })
    expect(client.getWeibo).toHaveBeenCalled()
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('微博热搜')
    expect(sent).toContain('热搜词')
  })

  it('weibo subcommand calls getWeibo', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({ getWeibo: vi.fn().mockResolvedValue([hotItem]) })
    await registerHotCommands(ctx, makeConfig(), client)
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const sub = reg!.subcommands.find((s) => s.primary === '60s.热榜.weibo')
    const session = makeSession()
    await sub!.action!({ session, options: {} })
    expect(client.getWeibo).toHaveBeenCalled()
  })

  it('hn subcommand calls getHackerNews with top/15', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({ getHackerNews: vi.fn().mockResolvedValue([{ id: 1, title: 'HN', link: '', score: 10, author: 'a', created: '', created_at: 0 }]) })
    await registerHotCommands(ctx, makeConfig(), client)
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const sub = reg!.subcommands.find((s) => s.primary === '60s.热榜.hn')
    const session = makeSession()
    await sub!.action!({ session, options: {} })
    expect(client.getHackerNews).toHaveBeenCalledWith('top', 15)
  })

  it('it subcommand calls getITNewsRank', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({ getITNewsRank: vi.fn().mockResolvedValue([hotItem]) })
    await registerHotCommands(ctx, makeConfig(), client)
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const sub = reg!.subcommands.find((s) => s.primary === '60s.热榜.it-rank')
    const session = makeSession()
    await sub!.action!({ session, options: {} })
    expect(client.getITNewsRank).toHaveBeenCalledWith('day')
  })

  it('douyin subcommand formats hot value', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({
      getDouyin: vi.fn().mockResolvedValue([{ title: '抖音热词', hot_value: 8888, link: '' }]),
    })
    await registerHotCommands(ctx, makeConfig(), client)
    const reg = registrations.find((r) => r.primary === '60s.热榜')
    const sub = reg!.subcommands.find((s) => s.primary === '60s.热榜.douyin')
    const session = makeSession()
    await sub!.action!({ session, options: {} })
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('抖音热榜')
    expect(sent).toContain('🔥8888')
  })
})
