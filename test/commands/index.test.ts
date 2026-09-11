import { describe, expect, it } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { apply } from '../../src/index'

describe('plugin entry', () => {
  it('registers main command and all subcommand groups', async () => {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient()
    // apply 内部 new Client(ctx, config)，这里直接调 apply 需要真实 Client，
    // 但 apply 用 ctx.command，所以我们用 mock ctx + 真 config。
    // 注意：apply 会 new Client(ctx, config)，Client 构造函数不调用 http，安全。
    await apply(ctx, makeConfig())

    const primaryNames = registrations.map((r) => r.primary)
    expect(primaryNames).toContain('60s')
    // 各命令组都有注册
    for (const cmd of ['60s.早报', '60s.历史', '60s.热榜', '60s.一言', '60s.汇率', '60s.IT', '60s.二维码']) {
      expect(primaryNames).toContain(cmd)
    }
  })

  it('main 60s command shows help with baseUrl', async () => {
    const { ctx, registrations } = mockCommandContext()
    await apply(ctx, makeConfig({ baseUrl: 'http://example.test:1234' }))
    const reg = registrations.find((r) => r.primary === '60s')
    const session = makeSession()
    await reg!.action!({ session, options: {} })
    const sent = session.send.mock.calls[0][0]
    expect(sent).toContain('60s API 插件')
    expect(sent).toContain('http://example.test:1234')
    expect(sent).toContain('https://github.com/vikiboss/60s')
    expect(sent).toContain('60s.早报')
  })

  it('adds a mode option to every reply command', async () => {
    const { ctx, registrations } = mockCommandContext()
    await apply(ctx, makeConfig())

    const hasModeOption = (registration: any) => registration.options.some(([name]: [string]) => name === 'mode')
    for (const registration of registrations.filter((entry) => entry.primary !== '60s')) {
      expect(hasModeOption(registration)).toBe(true)
      for (const subcommand of registration.subcommands) {
        expect(hasModeOption(subcommand)).toBe(true)
      }
    }
  })

  it('exports plugin metadata', async () => {
    const mod = await import('../../src/index')
    expect(mod.name).toBe('60s-vincentzyu')
    expect(mod.Config).toBeTruthy()
    expect(mod.inject.required).toContain('http')
  })
})
