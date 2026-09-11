import type { Context, Session } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, safeAction, sendReply, withMode } from './helper'
import { formatWeibo, formatBili, formatDouyin, formatZhihu, formatGenericHot, formatHackerNews } from '../utils/format'

type HotSource = 'weibo' | 'bili' | 'douyin' | 'zhihu' | 'toutiao' | 'baidu' | 'quark' | 'rednote' | 'dongchedi' | 'hn' | 'it-rank'

const SOURCE_ALIAS: Record<string, HotSource> = {
  weibo: 'weibo', 微博: 'weibo', wb: 'weibo',
  bili: 'bili', b站: 'bili', bilibili: 'bili', bz: 'bili',
  douyin: 'douyin', 抖音: 'douyin', dy: 'douyin',
  zhihu: 'zhihu', 知乎: 'zhihu', zh: 'zhihu',
  toutiao: 'toutiao', 头条: 'toutiao', tt: 'toutiao',
  baidu: 'baidu', 百度: 'baidu', bd: 'baidu',
  quark: 'quark', 夸克: 'quark', qk: 'quark',
  rednote: 'rednote', 小红书: 'rednote', xhs: 'rednote',
  dongchedi: 'dongchedi', 懂车帝: 'dongchedi', dcd: 'dongchedi',
  hn: 'hn', 黑客: 'hn', hacker: 'hn',
  it: 'it-rank', it榜: 'it-rank', ithome: 'it-rank',
}

const SOURCE_TITLES: Record<HotSource, string> = {
  weibo: '微博热搜',
  bili: 'B站热搜',
  douyin: '抖音热榜',
  zhihu: '知乎热榜',
  toutiao: '头条热榜',
  baidu: '百度热搜',
  quark: '夸克热榜',
  rednote: '小红书热榜',
  dongchedi: '懂车帝热榜',
  hn: 'Hacker News',
  'it-rank': 'IT之家热榜',
}

export async function registerHotCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix
  const hot = addModeOption(ctx.command(`${base}.热榜 [source]`, '🔥 获取各平台热搜榜')
    .alias('60s hot')
    .option('verbose', '-v, --verbose 输出详细调试日志'))

  hot.action(async ({ session, options }) => {
    await safeAction(ctx, session, async () => {
      await sendHot(ctx, session, client, config, 'weibo', options)
      }, { client, config, commandVerbose: options.verbose })
  })

  // 平台选择子命令（用 canonical 去重，确保 it-rank 等映射目标也能注册）
  const registeredSources = new Set<string>()
  for (const source of Object.values(SOURCE_ALIAS)) {
    if (registeredSources.has(source)) continue
    registeredSources.add(source)
    addModeOption(hot
      .subcommand(`${base}.热榜.${source}`, `🔥 ${source} 热搜榜`)
      .alias(`60s hot ${source}`)
      .option('verbose', '-v, --verbose 输出详细调试日志'))
      .action(async ({ session, options }) => {
        await safeAction(ctx, session, async () => {
          await sendHot(ctx, session, client, config, source as HotSource, options)
      }, { client, config, commandVerbose: options.verbose })
      })
  }
}

async function sendHot(ctx: Context, session: Session, client: Client, config: Config, source: HotSource, options: any = {}) {
  const title = SOURCE_TITLES[source] || source
  let items: Array<{ text: string; hot?: string | number }> = []
  let text = ''

  switch (source) {
    case 'weibo': {
      const data = await client.getWeibo()
      text = formatWeibo(data)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'bili': {
      const data = await client.getBili()
      text = formatBili(data)
      items = data.slice(0, 15).map((i) => ({ text: i.title }))
      break
    }
    case 'douyin': {
      const data = await client.getDouyin()
      text = formatDouyin(data)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'zhihu': {
      const data = await client.getZhihu()
      text = formatZhihu(data)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value_desc }))
      break
    }
    case 'toutiao': {
      const data = await client.getToutiao()
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'baidu': {
      const data = await client.getBaiduHot()
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'quark': {
      const data = await client.getQuark()
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'rednote': {
      const data = await client.getRednote()
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'dongchedi': {
      const data = await client.getDongchedi()
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
    case 'hn': {
      const data = await client.getHackerNews('top', 15)
      text = formatHackerNews(data)
      items = data.map((i) => ({ text: i.title, hot: i.score }))
      break
    }
    case 'it-rank': {
      const data = await client.getITNewsRank('day')
      text = formatGenericHot(data, title)
      items = data.slice(0, 15).map((i) => ({ text: i.title, hot: i.hot_value }))
      break
    }
  }

  const payload = withMode(cardPayload({
    title,
    subtitle: '实时热搜',
    items,
    footer: '60s API',
  }, 'hot', 'list'), options)
  await sendReply(ctx, session, client, config, { ...payload, text })
}
