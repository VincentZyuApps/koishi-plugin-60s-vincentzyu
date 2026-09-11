import { Context, h } from 'koishi'

import type { Config } from './config'
import { Config as ConfigSchema } from './config'
import { Client } from './client'
import { registerNewsCommands } from './commands/news'
import { registerHotCommands } from './commands/hot'
import { registerFunCommands } from './commands/fun'
import { registerFinanceCommands } from './commands/finance'
import { registerToolCommands } from './commands/tool'
import { registerInfoCommands } from './commands/info'

export const name = '60s-vincentzyu'

export const inject = {
  required: ['http'],
  optional: ['puppeteer'],
}

export { ConfigSchema as Config }
export { usage } from './usage'

export function apply(ctx: Context, config: Config) {
  const client = new Client(ctx, config)
  const base = config.commandPrefix

  ctx.command(base, '📰 60s 开放 API 集合').alias('60s')
    .action(async ({ session }) => {
      const message = [
        '📰 60s API 插件',
        `🔗 服务: ${config.baseUrl}`,
        '📦 上游仓库: https://github.com/vikiboss/60s',
        '',
        '📌 子命令（60s.xxx）：',
        `  ${base}.早报 - 每日早报`,
        `  ${base}.热榜 <平台> - 热搜(微博/bili/知乎/抖音等)`,
        `  ${base}.天气 <城市> - 实时天气`,
        `  ${base}.翻译 <文本> - 翻译`,
        `  ${base}.汇率 / ${base}.油价 / ${base}.金价`,
        `  ${base}.一言 / ${base}.段子 / ${base}.笑话 / ${base}.发病`,
        `  ${base}.历史 / ${base}.摸鱼 / ${base}.运势`,
        `  ${base}.歌词 <歌名> / ${base}.百科 <词条>`,
        `  ${base}.二维码 <文本> / ${base}.密码 / ${base}.IP`,
        '',
        '💡 发送「60s --help」查看完整帮助',
      ].join('\n')
      await session.send(`${config.enableQuote ? h.quote(session.messageId) : ''}${h.text(message)}`)
    })

  registerNewsCommands(ctx, config, client)
  registerHotCommands(ctx, config, client)
  registerFunCommands(ctx, config, client)
  registerFinanceCommands(ctx, config, client)
  registerToolCommands(ctx, config, client)
  registerInfoCommands(ctx, config, client)
}
