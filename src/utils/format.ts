import type {
  AINewsData,
  Daily60s,
  DouyinHotItem,
  ExchangeRate,
  FuelPrice,
  GoldPrice,
  HackerNewsItem,
  HotSearchItem,
  ITNewsItem,
  LyricData,
  MoyuData,
  TodayInHistory,
  WeatherForecast,
  WeatherRealtime,
  ZhihuHotItem,
} from '../types'

// ==================== 基础工具 ====================

export function escapeMarkdown(text: string): string {
  return text
    .replace(/([\\`*{}\[\]()#+\-.!_|>])/g, '\\$1')
}

export function truncate(text: string, max = 60): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

function formatHotList(items: Array<{ title: string; hot?: number | string; link?: string }>, title: string): string {
  const lines = [`📊 ${title}`, '']
  items.slice(0, 30).forEach((item, idx) => {
    const rank = idx + 1
    const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`
    const hot = item.hot ? `  🔥${item.hot}` : ''
    lines.push(`${medal} ${truncate(item.title, 40)}${hot}`)
  })
  return lines.join('\n')
}

// ==================== 核心 ====================

const LEADING_INDEX_RE = /^(?:(?:\d+\.(?!\d)|\d+、|\(\d+\)|（\d+）|[①-⑳]))\s*/

/** 兼容 60s v2 的字符串新闻项与旧实例的 { title, link } 新闻项，并清理文本自带的前置序号。 */
export function getDailyNewsTitle(item: Daily60s['news'][number]): string {
  const raw = typeof item === 'string' ? item : item.title
  return raw.replace(LEADING_INDEX_RE, '')
}

export function formatDaily(data: Daily60s): string {
  const lines = [
    `📅 ${data.date} ${data.day_of_week} · 农历${data.lunar_date}`,
    '',
    ...data.news.map((n, i) => `${i + 1}. ${getDailyNewsTitle(n)}`),
    '',
    `💬 ${data.tip || '每日微语'}`,
  ]
  return lines.join('\n')
}

// ==================== 热榜 ====================

export function formatWeibo(items: HotSearchItem[]): string {
  return formatHotList(items.map((i) => ({ title: i.title, hot: i.hot_value, link: i.link })), '微博热搜')
}

export function formatBili(items: HotSearchItem[]): string {
  return formatHotList(items.map((i) => ({ title: i.title, link: i.link })), 'B站热搜')
}

export function formatDouyin(items: DouyinHotItem[]): string {
  return formatHotList(items.map((i) => ({ title: i.title, hot: i.hot_value, link: i.link })), '抖音热榜')
}

export function formatZhihu(items: ZhihuHotItem[]): string {
  const lines = ['📊 知乎热榜', '']
  items.slice(0, 20).forEach((item, idx) => {
    const medal = idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}.`
    lines.push(`${medal} ${truncate(item.title, 40)}`)
    if (item.hot_value_desc) lines.push(`   🔥${item.hot_value_desc}`)
  })
  return lines.join('\n')
}

export function formatGenericHot(items: HotSearchItem[], title: string): string {
  return formatHotList(items.map((i) => ({ title: i.title, hot: i.hot_value, link: i.link })), title)
}

export function formatHackerNews(items: HackerNewsItem[]): string {
  const lines = ['📰 Hacker News', '']
  items.forEach((item, idx) => {
    const score = item.score ? ` 🔥${item.score}` : ''
    lines.push(`${idx + 1}. ${truncate(item.title, 50)}${score}`)
    lines.push(`   👤${item.author}  ${item.created}`)
  })
  return lines.join('\n')
}

// ==================== 天气 ====================

export function formatWeatherRealtime(data: WeatherRealtime): string {
  const w = data.weather
  const lines = [
    `🌤️ ${data.location.name} 实时天气`,
    '',
    `☁️ 天气：${w.condition}`,
    `🌡️ 温度：${w.temperature}°C`,
    `💧 湿度：${w.humidity}%`,
    `💨 风：${w.wind_direction} ${w.wind_power}`,
  ]
  if (data.air_quality) {
    const aq = data.air_quality
    lines.push(`😷 空气：${aq.quality} (AQI ${aq.aqi})`)
  }
  if (data.sunrise) {
    lines.push(`🌅 日出 ${data.sunrise.sunrise} · 日落 ${data.sunrise.sunset}`)
  }
  if (data.life_indices?.length) {
    lines.push('')
    data.life_indices.forEach((idx) => {
      lines.push(`🏷️ ${idx.name}：${idx.level}`)
    })
  }
  if (data.alerts?.length) {
    lines.push('')
    data.alerts.forEach((a) => {
      lines.push(`⚠️ ${a.type}(${a.level})：${truncate(a.detail, 50)}`)
    })
  }
  return lines.join('\n')
}

export function formatWeatherForecast(data: WeatherForecast): string {
  const lines = [`🌤️ ${data.location.name} 天气预报`, '']
  data.daily_forecast.forEach((d) => {
    lines.push(`📅 ${d.date} ${d.day_condition} ${d.min_temperature}~${d.max_temperature}°C`)
  })
  return lines.join('\n')
}

// ==================== 金融 ====================

export function formatExchangeRate(data: ExchangeRate): string {
  const lines = [`💰 汇率（基准 ${data.base_code}）`, '']
  data.rates.slice(0, 20).forEach((r) => {
    lines.push(`· ${r.currency}: ${r.rate}`)
  })
  return lines.join('\n')
}

export function formatFuelPrice(data: FuelPrice): string {
  const lines = [`⛽ 今日油价（${data.region}）`, '']
  data.items?.forEach((item) => {
    lines.push(`· ${item.name}: ${item.price_desc}`)
  })
  if (data.trend) {
    lines.push('')
    lines.push(`📉 调价预告: ${data.trend.description}`)
  }
  if (data.updated) lines.push(`🕐 更新: ${data.updated}`)
  return lines.join('\n')
}

export function formatGoldPrice(data: GoldPrice): string {
  const lines = [`🥇 黄金价格（${data.date}）`, '']
  if (data.metals?.length) {
    lines.push('💎 今日金价')
    data.metals.forEach((m) => {
      lines.push(`· ${m.name}: ${m.today_price} ${m.unit}（卖${m.sell_price} 高${m.high_price} 低${m.low_price}）`)
    })
  }
  if (data.stores?.length) {
    lines.push('')
    lines.push('🏬 金店')
    data.stores.slice(0, 5).forEach((s) => {
      lines.push(`· ${s.brand} ${s.product}: ${s.formatted}`)
    })
  }
  if (data.banks?.length) {
    lines.push('')
    lines.push('🏦 银行')
    data.banks.slice(0, 5).forEach((b) => {
      lines.push(`· ${b.bank} ${b.product}: ${b.formatted}`)
    })
  }
  return lines.join('\n')
}

// ==================== 日历 ====================

export function formatTodayInHistory(data: TodayInHistory): string {
  const lines = [`📜 ${data.date} 历史上的今天`, '']
  data.items.slice(0, 10).forEach((item) => {
    lines.push(`· ${item.year} ${item.title}`)
  })
  return lines.join('\n')
}

export function formatMoyu(data: MoyuData): string {
  const d = data.date
  const lines = [
    `🐟 ${d.gregorian} ${d.weekday}`,
    '',
    `🏖️ 周末：${data.today.isWeekend ? '是' : '否'} | 节假日：${data.today.isHoliday ? '是' : '否'} | 工作日：${data.today.isWorkday ? '是' : '否'}`,
  ]
  if (data.today.holidayName) lines.push(`🎉 节假日：${data.today.holidayName}`)
  lines.push('')
  lines.push(`📊 本周进度：${data.progress.week.percentage}%`)
  lines.push(`📊 本月进度：${data.progress.month.percentage}%`)
  lines.push(`📊 今年进度：${data.progress.year.percentage}%`)
  if (data.nextHoliday) {
    lines.push(`🎯 下一个假期：${data.nextHoliday.name} ${data.nextHoliday.date}（还有${data.nextHoliday.until}天）`)
  }
  if (data.moyuQuote) lines.push(`💬 ${data.moyuQuote}`)
  return lines.join('\n')
}

// ==================== 资讯 ====================

export function formatITNews(items: ITNewsItem[]): string {
  const lines = ['📰 IT 资讯', '']
  items.slice(0, 15).forEach((item, idx) => {
    lines.push(`${idx + 1}. ${truncate(item.title, 45)}`)
    lines.push(`   🕐 ${item.created}`)
  })
  return lines.join('\n')
}

export function formatAINews(data: AINewsData): string {
  const lines = [`🤖 AI 资讯（${data.date}）`, '']
  data.news.slice(0, 15).forEach((item, idx) => {
    lines.push(`${idx + 1}. ${truncate(item.title, 45)}`)
    if (item.source) lines.push(`   来源：${item.source}`)
  })
  return lines.join('\n')
}

// ==================== 歌词 ====================

export function formatLyric(data: LyricData): string {
  const lines = [`🎵 ${data.title} - ${(data.artists || []).join(',')}`]
  if (data.album) lines.push(`💿 ${data.album}`)
  lines.push('')
  const lyrics = data.lyrics?.filter((l) => l.lyric).map((l) => l.lyric) || []
  lines.push(lyrics.slice(0, 40).join('\n'))
  return lines.join('\n')
}
