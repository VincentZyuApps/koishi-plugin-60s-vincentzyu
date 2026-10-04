import type { Context } from '@koishijs/client'
import ScheduledTasks from './scheduled-tasks.vue'

export default (ctx: Context) => {
  ctx.slot({ type: 'plugin-details', component: ScheduledTasks, order: 0 })
}
