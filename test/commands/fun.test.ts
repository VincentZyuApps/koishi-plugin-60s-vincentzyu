import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerFunCommands } from '../../src/commands/fun'

describe('commands/fun', () => {
  async function setup(overrides: Record<string, any> = {}) {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient(overrides)
    await registerFunCommands(ctx, makeConfig(), client)
    return { ctx, registrations, client }
  }

  async function run(regs: any[], primary: string, args: any[] = []) {
    const reg = regs.find((r) => r.primary === primary)
    const session = makeSession()
    await reg!.action!({ session, options: {} }, ...args)
    return session
  }

  it('registers all fun commands', async () => {
    const { registrations } = await setup()
    const names = registrations.map((r) => r.primary)
    expect(names).toContain('60s.一言')
    expect(names).toContain('60s.段子')
    expect(names).toContain('60s.笑话')
    expect(names).toContain('60s.发病')
    expect(names).toContain('60s.答案')
    expect(names).toContain('60s.运势')
    expect(names).toContain('60s.摸鱼')
  })

  it('一言 calls getHitokoto and sends quote', async () => {
    const { registrations, client } = await setup({ getHitokoto: vi.fn().mockResolvedValue({ hitokoto: '今夕何夕' }) })
    const session = await run(registrations, '60s.一言')
    expect(client.getHitokoto).toHaveBeenCalled()
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('今夕何夕')
  })

  it('段子 calls getDuanzi', async () => {
    const { registrations, client } = await setup({ getDuanzi: vi.fn().mockResolvedValue({ duanzi: '段子内容' }) })
    const session = await run(registrations, '60s.段子')
    expect(client.getDuanzi).toHaveBeenCalled()
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('段子内容')
  })

  it('笑话 calls getDadJoke', async () => {
    const { registrations, client } = await setup({ getDadJoke: vi.fn().mockResolvedValue({ content: '冷笑话' }) })
    const session = await run(registrations, '60s.笑话')
    expect(client.getDadJoke).toHaveBeenCalled()
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('冷笑话')
  })

  it('发病 passes name argument', async () => {
    const { registrations, client } = await setup({ getFabing: vi.fn().mockResolvedValue({ text: '阿伟死了' }) })
    const session = await run(registrations, '60s.发病', ['阿伟'])
    expect(client.getFabing).toHaveBeenCalledWith('阿伟')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('阿伟死了')
  })

  it('答案 calls getAnswer', async () => {
    const { registrations, client } = await setup({ getAnswer: vi.fn().mockResolvedValue({ answer: '去问你的心' }) })
    const session = await run(registrations, '60s.答案')
    expect(client.getAnswer).toHaveBeenCalled()
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('去问你的心')
  })

  it('运势 calls getLuck and formats desc/tip', async () => {
    const { registrations, client } = await setup({ getLuck: vi.fn().mockResolvedValue({ luck_rank: 8, luck_desc: '小吉', luck_tip: '诸事顺利' }) })
    const session = await run(registrations, '60s.运势')
    expect(client.getLuck).toHaveBeenCalled()
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('小吉')
    expect(sent).toContain('诸事顺利')
  })

  it('摸鱼 calls getMoyu and formats', async () => {
    const moyu = {
      date: { gregorian: '2026-08-07', weekday: '星期五', dayOfWeek: 5, lunar: {} },
      today: { isWeekend: false, isHoliday: false, isWorkday: true, holidayName: null, solarTerm: null, lunarFestivals: [] },
      progress: { week: { passed: 5, total: 7, remaining: 2, percentage: 71 }, month: { passed: 7, total: 31, remaining: 24, percentage: 23 }, year: { passed: 219, total: 365, remaining: 146, percentage: 60 } },
      currentHoliday: null,
      nextHoliday: null,
      nextWeekend: null,
      countdown: { toWeekEnd: 2, toFriday: 0, toMonthEnd: 24, toYearEnd: 146 },
      moyuQuote: '摸鱼快乐',
    }
    const { registrations, client } = await setup({ getMoyu: vi.fn().mockResolvedValue(moyu) })
    const session = await run(registrations, '60s.摸鱼')
    expect(client.getMoyu).toHaveBeenCalled()
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('71%')
  })

  it('摸鱼 keeps emoji and hides card ranks', async () => {
    const moyu = {
      date: { gregorian: '2026-08-07', weekday: '星期五', dayOfWeek: 5, lunar: {} },
      today: { isWeekend: false, isHoliday: false, isWorkday: true, holidayName: null, solarTerm: null, lunarFestivals: [] },
      progress: { week: { passed: 5, total: 7, remaining: 2, percentage: 71 }, month: { passed: 7, total: 31, remaining: 24, percentage: 23 }, year: { passed: 219, total: 365, remaining: 146, percentage: 60 } },
      currentHoliday: null,
      nextHoliday: null,
      nextWeekend: null,
      countdown: { toWeekEnd: 2, toFriday: 0, toMonthEnd: 24, toYearEnd: 146 },
      moyuQuote: '摸鱼快乐',
    }
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient({ getMoyu: vi.fn().mockResolvedValue(moyu) })
    let html = ''
    ctx.puppeteer = {
      page: () => ({
        setContent: vi.fn(async (content: string) => { html = content }),
        waitForSelector: vi.fn(async () => null),
        evaluate: vi.fn(async () => null),
        $: vi.fn(async () => ({ screenshot: vi.fn(async () => 'mock-base64') })),
        close: vi.fn(async () => null),
      }),
    }
    await registerFunCommands(ctx, makeConfig({ fontMode: 'system-default' }), client)
    const reg = registrations.find((r) => r.primary === '60s.摸鱼')
    const session = makeSession()
    await reg!.action!({ session, options: {} }, ...[])

    expect(html).toContain('list-line no-rank')
    expect(html).toContain('🏖️ 周末')
    expect(html).toContain('📊 本周进度')
    expect(html).toContain('💬 摸鱼快乐')
    expect(html).not.toContain('<span class="list-rank')
  })
})
