import type { Client } from '@koishijs/plugin-console'
import { resolve } from 'node:path'
import type { Context } from 'koishi'
import type { ScheduledRunResult, ScheduledTaskService } from './scheduler'

declare module '@koishijs/plugin-console' {
  interface Events {
    '60s-vincentzyu/scheduled-status'(): ReturnType<ScheduledTaskService['getStatus']>
    '60s-vincentzyu/scheduled-execute'(): Promise<ScheduledRunResult[]>
  }
}

export function applyScheduledTaskConsole(ctx: Context, service: ScheduledTaskService): void {
  ctx.inject(['console'], (consoleCtx) => {
    consoleCtx.console.addListener('60s-vincentzyu/scheduled-status', () => service.getStatus(), { authority: 3 })
    consoleCtx.console.addListener('60s-vincentzyu/scheduled-execute', async function (this: Client) {
      return service.executeEnabled('console')
    }, { authority: 3 })
    consoleCtx.console.addEntry({
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })
  })
}
