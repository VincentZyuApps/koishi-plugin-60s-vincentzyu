import { describe, expect, it, vi } from 'vitest'
import { makeConfig } from '../helpers/setup'
import { ScheduledTaskService, normalizeCronExpression, timezoneFromGmtOffset } from '../../src/schedule/scheduler'

const task = {
  name: '每日早报', command: '60s.早报', cron: '0 8 * * *', platform: 'onebot', selfId: '10000', channelId: '20000', enabled: true,
}

function makeContext(execute = vi.fn().mockResolvedValue([])) {
  const bot: any = {
    platform: 'onebot', selfId: '10000',
    session: vi.fn(() => ({ execute })),
    sendMessage: vi.fn().mockResolvedValue([]),
  }
  return {
    bots: [bot],
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    bot,
  }
}

describe('schedule/scheduler', () => {
  it('accepts five-part Cron only', () => {
    expect(normalizeCronExpression(' 0   8 * * * ')).toBe('0 8 * * *')
    expect(() => normalizeCronExpression('0 8 * *')).toThrow('五段式')
    expect(() => normalizeCronExpression('0 8 * * * *')).toThrow('五段式')
  })

  it('maps fixed GMT offsets to IANA timezone names', () => {
    expect(timezoneFromGmtOffset(8)).toBe('Etc/GMT-8')
    expect(timezoneFromGmtOffset(-3)).toBe('Etc/GMT+3')
    expect(timezoneFromGmtOffset(0)).toBe('Etc/GMT')
    expect(() => timezoneFromGmtOffset(15)).toThrow('GMT 偏移')
  })

  it('executes every enabled task through its target bot session', async () => {
    const ctx = makeContext()
    const service = new ScheduledTaskService(ctx as any, makeConfig({ scheduledTasks: [task] }))
    const result = await service.executeEnabled('command')
    expect(ctx.bot.session).toHaveBeenCalled()
    expect(ctx.bot.session.mock.results[0].value.execute).toHaveBeenCalledWith('60s.早报')
    expect(result).toEqual([{ index: 0, name: '每日早报', ok: true, message: '已执行：60s.早报' }])
    expect(service.getStatus().tasks[0].consecutiveFailures).toBe(0)
  })

  it('notifies only once at the third consecutive failure and resets after success', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('上游超时'))
    const ctx = makeContext(execute)
    const service = new ScheduledTaskService(ctx as any, makeConfig({ scheduledTasks: [task] }))
    await service.executeEnabled('command')
    await service.executeEnabled('command')
    await service.executeEnabled('command')
    await service.executeEnabled('command')
    expect(ctx.bot.sendMessage).toHaveBeenCalledTimes(1)
    expect(service.getStatus().tasks[0].consecutiveFailures).toBe(4)

    execute.mockResolvedValueOnce([])
    await service.executeEnabled('command')
    expect(service.getStatus().tasks[0].consecutiveFailures).toBe(0)
  })

  it('does not register enabled tasks with incomplete targets', () => {
    const ctx = makeContext()
    const service = new ScheduledTaskService(ctx as any, makeConfig({ scheduledTasks: [{ ...task, channelId: '' }] }))
    service.start()
    expect(service.getStatus().tasks[0]).toMatchObject({ registered: false, lastResult: 'skipped' })
    service.stop()
  })
})
