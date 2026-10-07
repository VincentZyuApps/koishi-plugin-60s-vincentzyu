import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, safeAction, sendReply, withMode } from './helper'
import { formatDaily, formatTodayInHistory, getDailyNewsTitle } from '../utils/format'

export async function registerNewsCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix

  addModeOption(ctx.command(`${base}.早报 [date]`, '📰 60s 每日早报（60秒读懂世界）')
    .alias('60s news')
    .option('image', '-i, --image 直接发送官方早报图片')
    .option('date', '-d, --date <date:string> 指定日期 YYYY-MM-DD')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, date) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getDaily(date || options.date)
        const text = formatDaily(data)
        // -i 直接发官方图片，不用 puppeteer
        if (options.image && data.image) {
          const payload = withMode({ text, imageUrl: data.image, kind: 'image', modeOverride: 'image' }, options, 'daily')
          await sendReply(ctx, session, client, config, payload)
          return
        }
        let payload = cardPayload({
          title: `${data.date} ${data.day_of_week}`,
          subtitle: data.tip || '每日微语',
          items: data.news.map((n) => ({ text: getDailyNewsTitle(n) })),
          footer: `60s API · ${data.lunar_date}`,
        }, 'daily', 'list')
        payload = { ...payload, text, markdown: text }
        if (data.image) payload.imageUrl = data.image
        await sendReply(ctx, session, client, config, withMode(payload, options, 'daily'))
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(
    ctx.command(`${base}.历史 [date]`, '📜 历史上的今天')
      .alias('60s history')
      .option('date', '-d, --date <date:string> 日期')
      .option('verbose', '-v, --verbose 输出详细调试日志')
  ).action(async ({ session, options }, date) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getTodayInHistory(date || options.date)
        const text = formatTodayInHistory(data)
        const payload = withMode(cardPayload({
          title: `${data.date} 历史上的今天`,
          items: data.items.slice(0, 15).map((item) => ({ text: `${item.year} ${item.title}` })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'history')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })
}
