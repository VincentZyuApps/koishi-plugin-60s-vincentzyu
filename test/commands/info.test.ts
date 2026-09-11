import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerInfoCommands } from '../../src/commands/info'

describe('commands/info', () => {
  async function setup(overrides: Record<string, any> = {}) {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient(overrides)
    await registerInfoCommands(ctx, makeConfig(), client)
    return { ctx, registrations, client }
  }

  async function run(regs: any[], primary: string, args: any[] = []) {
    const reg = regs.find((r) => r.primary === primary)
    const session = makeSession()
    await reg!.action!({ session, options: {} }, ...args)
    return session
  }

  it('IT defaults to 20 and sends news', async () => {
    const { registrations, client } = await setup({
      getITNews: vi.fn().mockResolvedValue([{ title: 'IT新闻', link: '', description: '', created: '', created_at: 0 }]),
    })
    const session = await run(registrations, '60s.IT')
    expect(client.getITNews).toHaveBeenCalledWith(20)
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('IT新闻')
  })

  it('IT clamps limit to max 50', async () => {
    const { registrations, client } = await setup({ getITNews: vi.fn().mockResolvedValue([]) })
    await run(registrations, '60s.IT', ['999'])
    expect(client.getITNews).toHaveBeenCalledWith(50)
  })

  it('AI passes date', async () => {
    const { registrations, client } = await setup({
      getAINews: vi.fn().mockResolvedValue({ date: '2026-08-06', news: [{ title: 'AI新闻', detail: '', link: '', source: '', date: '' }] }),
    })
    const session = await run(registrations, '60s.AI', ['2026-08-06'])
    expect(client.getAINews).toHaveBeenCalledWith('2026-08-06')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('AI新闻')
  })

  it('黑客新闻 defaults to top/10 with aliases', async () => {
    const { ctx, registrations, client } = await setup({
      getHackerNews: vi.fn().mockResolvedValue([{ id: 1, title: 'HN', link: '', score: 5, author: 'a', created: '', created_at: 0 }]),
    })
    const reg = registrations.find((r) => r.primary === '60s.黑客新闻')
    expect(reg).toBeTruthy()
    expect(reg!.aliases).toContain('60s.hn')
    expect(reg!.aliases).toContain('60s.hacker-news')
    expect(reg!.aliases).toContain('60s.黑客')
    const session = makeSession()
    await reg!.action!({ session, options: {} })
    expect(client.getHackerNews).toHaveBeenCalledWith('top', 10)
  })
})
