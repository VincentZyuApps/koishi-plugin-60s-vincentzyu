import { h, type Bot, type Context } from 'koishi'
import cron, { type ScheduledTask } from 'node-cron'
import type { Config, ScheduledTaskConfig } from '../config'
import { markScheduledSession, takeScheduledFailure } from './runtime'

export type ScheduledTaskTrigger = 'cron' | 'command' | 'console'

export interface ScheduledTaskStatus {
  index: number
  name: string
  command: string
  cron: string
  platform: string
  selfId: string
  channelId: string
  enabled: boolean
  registered: boolean
  consecutiveFailures: number
  lastRunAt?: number
  lastResult?: 'success' | 'failure' | 'skipped'
  lastMessage?: string
}

export interface ScheduledRunResult {
  index: number
  name: string
  ok: boolean
  message: string
}

export function normalizeCronExpression(value: string): string {
  const expression = String(value || '').trim().replace(/\s+/g, ' ')
  if (expression.split(' ').length !== 5 || !cron.validate(expression)) {
    throw new Error(`Cron 表达式无效，必须是五段式（分 时 日 月 星期）：${value || '(空)'}`)
  }
  return expression
}

export function timezoneFromGmtOffset(offset: number): string {
  if (!Number.isInteger(offset) || offset < -12 || offset > 14) {
    throw new Error(`GMT 偏移必须是 -12 到 +14 的整数：${offset}`)
  }
  return offset === 0 ? 'Etc/GMT' : `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`
}

export class ScheduledTaskService {
  private jobs: ScheduledTask[] = []
  private statuses: ScheduledTaskStatus[] = []

  constructor(private readonly ctx: Context, private readonly config: Config) {
    this.statuses = config.scheduledTasks.map((task, index) => this.createStatus(task, index))
  }

  start(): void {
    this.stop()
    const timezone = timezoneFromGmtOffset(this.config.scheduleTimezoneGmtOffset)
    this.statuses = this.config.scheduledTasks.map((task, index) => this.createStatus(task, index))
    if (!this.config.enableSchedule) {
      this.ctx.logger.debug?.('[60s] 定时任务总开关未开启 (enableSchedule=false)')
      return
    }

    this.config.scheduledTasks.forEach((task, index) => {
      const status = this.statuses[index]
      if (!task.enabled) return
      if (!task.platform || !task.selfId || !task.channelId || !task.command) {
        status.lastResult = 'skipped'
        status.lastMessage = '已启用任务缺少 command、platform、selfId 或 channelId。'
        this.ctx.logger.warn(`[60s] 定时任务未注册 | ${this.label(task, index)} | ${status.lastMessage}`)
        return
      }
      try {
        const expression = normalizeCronExpression(task.cron)
        const job = cron.schedule(expression, () => { void this.executeOne(index, 'cron') }, { timezone })
        this.jobs.push(job)
        status.registered = true
        this.ctx.logger.info(`[60s] 定时任务已注册 | ${this.label(task, index)} | cron=${expression} | timezone=GMT${this.config.scheduleTimezoneGmtOffset >= 0 ? '+' : ''}${this.config.scheduleTimezoneGmtOffset}`)
      } catch (error) {
        status.lastResult = 'skipped'
        status.lastMessage = this.errorMessage(error)
        this.ctx.logger.error(`[60s] 定时任务未注册 | ${this.label(task, index)} | ${status.lastMessage}`)
      }
    })
  }

  stop(): void {
    for (const job of this.jobs.splice(0)) job.stop()
    for (const status of this.statuses) status.registered = false
  }

  getStatus(): { enableSchedule: boolean, timezoneGmtOffset: number, tasks: ScheduledTaskStatus[] } {
    return {
      enableSchedule: !!this.config.enableSchedule,
      timezoneGmtOffset: this.config.scheduleTimezoneGmtOffset,
      tasks: this.statuses.map((status) => ({ ...status })),
    }
  }

  async executeEnabled(trigger: ScheduledTaskTrigger): Promise<ScheduledRunResult[]> {
    const results: ScheduledRunResult[] = []
    for (let index = 0; index < this.config.scheduledTasks.length; index += 1) {
      if (!this.config.scheduledTasks[index].enabled) continue
      results.push(await this.executeOne(index, trigger))
    }
    return results
  }

  async executeOne(index: number, trigger: ScheduledTaskTrigger): Promise<ScheduledRunResult> {
    const task = this.config.scheduledTasks[index]
    const status = this.statuses[index]
    if (!task || !status) return { index, name: `任务 ${index + 1}`, ok: false, message: '任务不存在。' }
    status.lastRunAt = Date.now()

    const invalid = this.validateTask(task)
    if (invalid) return this.fail(task, status, index, invalid)

    const bot = this.findBot(task)
    if (!bot) return this.fail(task, status, index, `未找到在线 Bot：${task.platform}/${task.selfId}`)

    try {
      const session = bot.session({
        type: 'message',
        // Satori Channel.Type.TEXT 是 const enum，运行时使用其稳定数值 0。
        channel: { id: task.channelId, type: 0 },
        user: { id: bot.selfId, name: '60s 定时任务' },
        message: { id: '', elements: [] },
      }) as any
      markScheduledSession(session)
      await session.execute(task.command)
      const failure = takeScheduledFailure(session)
      if (failure) return this.fail(task, status, index, failure)

      status.consecutiveFailures = 0
      status.lastResult = 'success'
      status.lastMessage = `已执行：${task.command}`
      this.ctx.logger.info(`[60s] 定时任务成功 | trigger=${trigger} | ${this.label(task, index)} | command=${task.command}`)
      return { index, name: task.name, ok: true, message: status.lastMessage }
    } catch (error) {
      return this.fail(task, status, index, this.errorMessage(error))
    }
  }

  private createStatus(task: ScheduledTaskConfig, index: number): ScheduledTaskStatus {
    return {
      index,
      name: task.name,
      command: task.command,
      cron: task.cron,
      platform: task.platform,
      selfId: task.selfId,
      channelId: task.channelId,
      enabled: task.enabled,
      registered: false,
      consecutiveFailures: 0,
    }
  }

  private validateTask(task: ScheduledTaskConfig): string | undefined {
    if (!task.command || !task.platform || !task.selfId || !task.channelId) {
      return '已启用任务缺少 command、platform、selfId 或 channelId。'
    }
    try {
      normalizeCronExpression(task.cron)
      return undefined
    } catch (error) {
      return this.errorMessage(error)
    }
  }

  private findBot(task: ScheduledTaskConfig): Bot | undefined {
    return this.ctx.bots.find((bot) => bot.platform === task.platform && bot.selfId === task.selfId)
  }

  private async fail(task: ScheduledTaskConfig, status: ScheduledTaskStatus, index: number, message: string): Promise<ScheduledRunResult> {
    status.consecutiveFailures += 1
    status.lastResult = 'failure'
    status.lastMessage = message
    this.ctx.logger.error(`[60s] 定时任务失败 | ${this.label(task, index)} | consecutiveFailures=${status.consecutiveFailures} | ${message}`)
    if (status.consecutiveFailures === 3) await this.notifyFailure(task, message)
    return { index, name: task.name, ok: false, message }
  }

  private async notifyFailure(task: ScheduledTaskConfig, message: string): Promise<void> {
    const bot = this.findBot(task)
    if (!bot) return
    try {
      await bot.sendMessage(task.channelId, h.text(`⚠️ 60s 定时任务「${task.name || task.command}」已连续失败 3 次。\n本次原因：${message}`))
    } catch (error) {
      this.ctx.logger.error(`[60s] 定时任务失败提醒发送失败 | ${this.label(task, -1)} | ${this.errorMessage(error)}`)
    }
  }

  private label(task: ScheduledTaskConfig, index: number): string {
    return task.name || `任务 ${index + 1}`
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }
}
