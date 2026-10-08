import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, makePayload, safeAction, sendReply, withMode } from './helper'
import { formatMoyu } from '../utils/format'

export async function registerFunCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix

  addModeOption(ctx.command(`${base}.一言`, '💬 随机一言').alias('60s hitokoto')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getHitokoto()
        const text = `💬 ${data.hitokoto || ''}`
        const payload = withMode(cardPayload({
          title: '💬 一言',
          subtitle: '随机一句话',
          body: data.hitokoto || '',
          footer: '60s API',
        }, 'simple', 'single'), options, 'hitokoto')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.段子`, '😂 随机段子').alias('60s duanzi')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getDuanzi()
        const text = `😂 ${data.duanzi || ''}`
        const payload = withMode(cardPayload({
          title: '😂 段子',
          subtitle: '今日份快乐',
          body: data.duanzi || '',
          footer: '60s API',
        }, 'simple', 'single'), options, 'duanzi')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.笑话`, '🤣 冷笑话').alias('60s joke')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getDadJoke()
        const text = `🤣 ${data.content || ''}`
        const payload = withMode(cardPayload({
          title: '🤣 冷笑话',
          body: data.content || '',
          footer: '60s API',
        }, 'simple', 'single'), options, 'joke')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.发病 [name]`, '💘 发病文学').alias('60s fabing')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, name) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getFabing(name)
        const text = (data as any).saying || data.text || ''
        const payload = withMode(cardPayload({
          title: '💘 发病文学',
          subtitle: name ? `献给: ${name}` : '',
          body: text,
          footer: '60s API',
        }, 'simple', 'single'), options, 'fabing')
        await sendReply(ctx, session, client, config, { ...payload, text: `💘 ${text}` })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.答案`, '🔮 答案之书').alias('60s answer')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getAnswer()
        const text = `🔮 ${data.answer || ''}`
        const payload = withMode(cardPayload({
          title: '🔮 答案之书',
          body: data.answer || '',
          footer: '60s API',
        }, 'simple', 'single'), options, 'answer')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.运势`, '✨ 今日运势').alias('60s luck')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getLuck()
        const rank = (data as any).luck_rank || ''
        const desc = (data as any).luck_desc || ''
        const tip = (data as any).luck_tip || ''
        const text = [`✨ 今日运势${rank ? `（${rank}级）` : ''}`, `💬 ${desc}：${tip}`].filter(Boolean).join('\n')
        const payload = withMode(cardPayload({
          title: `✨ 今日运势${rank ? `（${rank}级）` : ''}`,
          body: `${desc}：${tip}`,
          footer: '60s API',
        }, 'simple', 'single'), options, 'luck')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.摸鱼`, '🐟 摸鱼日历/进度').alias('60s moyu')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getMoyu()
        const text = formatMoyu(data)
        const lines = text.split('\n').filter((l) => l.trim())
        const payload = withMode(cardPayload({
          title: `🐟 ${data.date.gregorian} ${data.date.weekday}`,
          subtitle: '摸鱼进度',
          items: lines.slice(1).map((l) => ({ text: l })),
          hideRank: true,
          footer: '60s API',
        }, 'hot', 'list'), options, 'moyu')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })
}
