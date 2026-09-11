import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerFinanceCommands } from '../../src/commands/finance'

describe('commands/finance', () => {
  async function setup(overrides: Record<string, any> = {}) {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient(overrides)
    await registerFinanceCommands(ctx, makeConfig(), client)
    return { ctx, registrations, client }
  }

  async function run(regs: any[], primary: string, args: any[] = [], options: any = {}) {
    const reg = regs.find((r) => r.primary === primary)
    const session = makeSession()
    await reg!.action!({ session, options }, ...args)
    return session
  }

  it('汇率 defaults to CNY and sends rates', async () => {
    const { registrations, client } = await setup({
      getExchangeRate: vi.fn().mockResolvedValue({
        base_code: 'CNY', updated: '', updated_at: 0, next_updated: '', next_updated_at: 0,
        rates: [{ currency: 'USD', rate: 7.2 }],
      }),
    })
    const session = await run(registrations, '60s.汇率')
    expect(client.getExchangeRate).toHaveBeenCalledWith('CNY')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('USD: 7.2')
  })

  it('汇率 passes custom currency', async () => {
    const { registrations, client } = await setup({
      getExchangeRate: vi.fn().mockResolvedValue({ base_code: 'USD', rates: [], updated: '', updated_at: 0, next_updated: '', next_updated_at: 0 }),
    })
    await run(registrations, '60s.汇率', ['USD'])
    expect(client.getExchangeRate).toHaveBeenCalledWith('USD')
  })

  it('油价 passes region', async () => {
    const { registrations, client } = await setup({
      getFuelPrice: vi.fn().mockResolvedValue({ region: '四川', prices: { '92#': '7.5元' }, updated: '', updated_at: 0 }),
    })
    const session = await run(registrations, '60s.油价', ['四川'])
    expect(client.getFuelPrice).toHaveBeenCalledWith('四川')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('四川')
  })

  it('金价 calls getGoldPrice', async () => {
    const { registrations, client } = await setup({
      getGoldPrice: vi.fn().mockResolvedValue({ store: [], bank: [], recycle: [], updated: '', updated_at: 0 }),
    })
    await run(registrations, '60s.金价')
    expect(client.getGoldPrice).toHaveBeenCalled()
  })

  it('天气 default calls getWeatherRealtime', async () => {
    const { registrations, client } = await setup({
      getWeatherRealtime: vi.fn().mockResolvedValue({
        location: { name: '成都', province: '', city: '', county: '' },
        weather: { condition: '晴', condition_code: '', temperature: 25, humidity: 60, pressure: 1000, precipitation: 0, wind_direction: '', wind_power: '', weather_icon: '', weather_colors: [], updated: '', updated_at: 0 },
        air_quality: null, sunrise: null, life_indices: [], alerts: [],
      }),
    })
    const session = await run(registrations, '60s.天气', ['成都'])
    expect(client.getWeatherRealtime).toHaveBeenCalledWith('成都')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('成都')
  })

  it('天气 with days calls getWeatherForecast', async () => {
    const { registrations, client } = await setup({
      getWeatherForecast: vi.fn().mockResolvedValue({
        location: { name: '北京', province: '', city: '', county: '' },
        hourly_forecast: [], daily_forecast: [], sunrise_sunset: [],
      }),
    })
    await run(registrations, '60s.天气', ['北京'], { days: 7 })
    expect(client.getWeatherForecast).toHaveBeenCalledWith('北京', 7)
  })

  it('天气 clamps days to max 8', async () => {
    const { registrations, client } = await setup({
      getWeatherForecast: vi.fn().mockResolvedValue({ location: { name: 'x', province: '', city: '', county: '' }, hourly_forecast: [], daily_forecast: [], sunrise_sunset: [] }),
    })
    await run(registrations, '60s.天气', ['北京'], { days: 30 })
    expect(client.getWeatherForecast).toHaveBeenCalledWith('北京', 8)
  })
})
