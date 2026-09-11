import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, safeAction, sendReply, withMode } from './helper'
import { formatITNews, formatAINews, formatHackerNews } from '../utils/format'

export async function registerInfoCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix

  addModeOption(ctx.command(`${base}.IT [limit]`, '📰 IT 之家资讯')
    .alias('60s it')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, limit) => {
      await safeAction(ctx, session, async () => {
        const items = await client.getITNews(limit ? Math.min(+limit, 50) : 20)
        const text = formatITNews(items)
        const payload = withMode(cardPayload({
          title: '📰 IT 资讯',
          items: items.slice(0, 15).map((i) => ({ text: i.title })),
          footer: '60s API',
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.AI [date]`, '🤖 AI 资讯')
    .alias('60s ai')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, date) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getAINews(date)
        const text = formatAINews(data)
        const payload = withMode(cardPayload({
          title: `🤖 AI 资讯（${data.date}）`,
          items: data.news.slice(0, 15).map((i) => ({ text: i.title })),
          footer: '60s API',
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.黑客新闻 [limit]`, '🐙 Hacker News')
    .alias('60s.hn', '60s.hacker-news', '60s.黑客')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, limit) => {
      await safeAction(ctx, session, async () => {
        const items = await client.getHackerNews('top', limit ? Math.min(+limit, 35) : 10)
        const text = formatHackerNews(items)
        const payload = withMode(cardPayload({
          title: '🐙 Hacker News',
          items: items.map((i) => ({ text: i.title, hot: i.score })),
          footer: '60s API',
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })
}
