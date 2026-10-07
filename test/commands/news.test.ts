import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerNewsCommands } from '../../src/commands/news'

describe('commands/news', () => {
  describe('60s.早报', () => {
    it('registers with aliases and options', async () => {
      const { ctx, registrations } = mockCommandContext()
      await registerNewsCommands(ctx, makeConfig(), makeClient())
      const reg = registrations.find((r) => r.primary === '60s.早报')
      expect(reg).toBeTruthy()
      expect(reg!.aliases).toContain('60s news')
      expect(reg!.options.map((o) => o[0])).toContain('image')
      expect(reg!.options.map((o) => o[0])).toContain('date')
      expect(reg!.options.map((o) => o[0])).toContain('mode')
    })

    it('calls getDaily and sends formatted text', async () => {
      const { ctx, registrations } = mockCommandContext()
      const client = makeClient({
        getDaily: vi.fn().mockResolvedValue({
          date: '2026-08-07', day_of_week: '星期五', lunar_date: '六月廿五',
          news: [{ title: '新闻一', link: '' }], tip: '每日微语', image: '',
          link: '', cover: '', updated: '', updated_at: 0, api_updated: '', api_updated_at: 0,
        }),
      })
      await registerNewsCommands(ctx, makeConfig(), client)

      const reg = registrations.find((r) => r.primary === '60s.早报')
      const session = makeSession()
      await reg!.action!({ session, options: {} }, undefined)

      expect(client.getDaily).toHaveBeenCalled()
      expect(session.send).toHaveBeenCalled()
      const sent = session.send.mock.calls[0][0]
      expect(sent).toContain('2026-08-07')
      expect(sent).toContain('新闻一')
    })

    it('passes date argument to getDaily', async () => {
      const { ctx, registrations } = mockCommandContext()
      const client = makeClient({ getDaily: vi.fn().mockResolvedValue({ date: '2026-08-01', news: [], image: '', link: '', cover: '', tip: '', day_of_week: '', lunar_date: '', updated: '', updated_at: 0, api_updated: '', api_updated_at: 0 }) })
      await registerNewsCommands(ctx, makeConfig(), client)
      const reg = registrations.find((r) => r.primary === '60s.早报')
      const session = makeSession()
      await reg!.action!({ session, options: {} }, '2026-08-01')
      expect(client.getDaily).toHaveBeenCalledWith('2026-08-01')
    })

    it('uses imageUrl for -i option without puppeteer', async () => {
      const { ctx, registrations } = mockCommandContext()
      const client = makeClient({
        getDaily: vi.fn().mockResolvedValue({
          date: '2026-08-07', news: [], image: 'http://img/60s.png', link: '', cover: '',
          tip: '', day_of_week: '', lunar_date: '', updated: '', updated_at: 0, api_updated: '', api_updated_at: 0,
        }),
      })
      await registerNewsCommands(ctx, makeConfig(), client)
      const reg = registrations.find((r) => r.primary === '60s.早报')
      const session = makeSession()
      await reg!.action!({ session, options: { image: true } }, undefined)
      // -i 直接发送远程图片，不依赖 Puppeteer。
      const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
      expect(sent).toContain('<image')
      expect(sent).toContain('http://img/60s.png')
    })

    it('passes cleaned item texts to card payload without duplicate numbering', async () => {
      const { ctx, registrations } = mockCommandContext()
      const client = makeClient({
        getDaily: vi.fn().mockResolvedValue({
          date: '2026-10-06', day_of_week: '星期二', lunar_date: '八月廿七',
          news: ['1. 新闻一', '2. 新闻二'], tip: '每日微语', image: '',
          link: '', cover: '', updated: '', updated_at: 0, api_updated: '', api_updated_at: 0,
        }),
      })
      await registerNewsCommands(ctx, makeConfig(), client)
      const reg = registrations.find((r) => r.primary === '60s.早报')
      const session = makeSession()
      await reg!.action!({ session, options: {} }, undefined)

      expect(session.send).toHaveBeenCalled()
      const sent = session.send.mock.calls[0][0]
      // 默认在没有 puppeteer 时回退到 text，text 包含有序编号且序号不重复
      expect(sent).toContain('1. 新闻一')
      expect(sent).toContain('2. 新闻二')
      expect(sent).not.toContain('1. 1. 新闻一')
    })
  })

  describe('60s.历史', () => {
    it('calls getTodayInHistory and sends result', async () => {
      const { ctx, registrations } = mockCommandContext()
      const client = makeClient({
        getTodayInHistory: vi.fn().mockResolvedValue({
          date: '8-7', month: 8, day: 7,
          items: [{ title: '大事件', year: '1945', description: '', event_type: 'event', link: '' }],
        }),
      })
      await registerNewsCommands(ctx, makeConfig(), client)
      const reg = registrations.find((r) => r.primary === '60s.历史')
      const session = makeSession()
      await reg!.action!({ session, options: {} }, undefined)
      expect(client.getTodayInHistory).toHaveBeenCalled()
      const sent = session.send.mock.calls[0][0]
      expect(sent).toContain('1945 大事件')
    })
  })
})
