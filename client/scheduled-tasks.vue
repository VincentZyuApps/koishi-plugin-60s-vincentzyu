<template>
  <section v-if="isCurrentPlugin" class="schedule-panel">
    <header>
      <div>
        <h3>⏰ 定时任务测试</h3>
        <p>按当前已应用的配置查看状态或立即执行全部启用任务。</p>
      </div>
      <k-button @click="refresh" :disabled="loading">🔄 刷新状态</k-button>
    </header>

    <div v-if="status" class="summary">
      <span>时区 <strong>GMT{{ status.timezoneGmtOffset >= 0 ? '+' : '' }}{{ status.timezoneGmtOffset }}</strong></span>
      <span>启用 <strong>{{ enabledCount }}</strong></span>
      <span>已注册 <strong>{{ registeredCount }}</strong></span>
    </div>

    <table v-if="status?.tasks.length">
      <thead><tr><th>任务</th><th>Cron</th><th>目标</th><th>状态</th><th>最近结果</th></tr></thead>
      <tbody>
        <tr v-for="task in status.tasks" :key="task.index">
          <td>{{ task.enabled ? '✅' : '⏸️' }} {{ task.name || `任务 ${task.index + 1}` }}</td>
          <td><code>{{ task.cron }}</code></td>
          <td>{{ task.platform }}/{{ task.selfId }} → {{ task.channelId }}</td>
          <td>{{ task.registered ? '已注册' : '未注册' }}<br><small>连续失败 {{ task.consecutiveFailures }}</small></td>
          <td>{{ task.lastMessage || '尚未执行' }}</td>
        </tr>
      </tbody>
    </table>

    <k-comment v-else type="warning">当前没有配置定时任务。</k-comment>

    <div class="actions">
      <k-button type="primary" @click="executeAll" :disabled="executing || !enabledCount">
        {{ executing ? '🚀 执行中...' : '🚀 立即执行全部启用任务' }}
      </k-button>
      <span>需要管理员权限；此操作会真实向各任务目标发送消息。</span>
    </div>

    <k-comment v-if="result" :type="result.every((item) => item.ok) ? 'success' : 'error'">
      <strong>执行结果</strong>
      <ul><li v-for="item in result" :key="item.index">{{ item.ok ? '✅' : '❌' }} {{ item.name }}：{{ item.message }}</li></ul>
    </k-comment>
  </section>
</template>

<script lang="ts" setup>
import { send } from '@koishijs/client'
import { computed, inject, onMounted, ref } from 'vue'

interface TaskStatus {
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
  lastMessage?: string
}

interface Status { timezoneGmtOffset: number, tasks: TaskStatus[] }
interface RunResult { index: number, name: string, ok: boolean, message: string }

const local: any = inject('manager.settings.local')
const status = ref<Status>()
const result = ref<RunResult[]>()
const loading = ref(false)
const executing = ref(false)
const isCurrentPlugin = computed(() => String(local?.value?.name || '').includes('60s-vincentzyu'))
const enabledCount = computed(() => status.value?.tasks.filter((task) => task.enabled).length || 0)
const registeredCount = computed(() => status.value?.tasks.filter((task) => task.registered).length || 0)

async function refresh() {
  loading.value = true
  try { status.value = await send('60s-vincentzyu/scheduled-status' as any) } finally { loading.value = false }
}

async function executeAll() {
  if (!window.confirm('⚠️ 将立即执行全部启用的 60s 定时任务，并真实发送到各目标频道。确认继续吗？')) return
  executing.value = true
  result.value = undefined
  try { result.value = await send('60s-vincentzyu/scheduled-execute' as any) } finally {
    executing.value = false
    await refresh()
  }
}

onMounted(() => { void refresh() })
</script>

<style lang="scss" scoped>
.schedule-panel { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
header, .actions, .summary { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: space-between; }
h3, p { margin: 0; }
p, small, .actions span { color: var(--k-color-muted); }
.summary { justify-content: flex-start; border: 1px solid var(--k-color-border); padding: 10px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--k-color-border); }
th { color: var(--k-color-muted); }
code { white-space: nowrap; }
ul { margin: 8px 0 0; padding-left: 20px; }
</style>
