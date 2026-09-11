import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, makePayload, safeAction, sendReply, withMode } from './helper'
import { formatExchangeRate, formatFuelPrice, formatGoldPrice, formatWeatherForecast, formatWeatherRealtime } from '../utils/format'

export async function registerFinanceCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix

  addModeOption(ctx.command(`${base}.汇率 [currency]`, '💱 实时汇率')
    .alias('60s rate')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, currency) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getExchangeRate(currency || 'CNY')
        const text = formatExchangeRate(data)
        const payload = withMode(cardPayload({
          title: `💱 汇率（基准 ${data.base_code}）`,
          items: data.rates.slice(0, 15).map((r) => ({ text: `${r.currency}: ${r.rate}` })),
          footer: `更新: ${data.updated || '—'} · 60s API`,
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.油价 [region]`, '⛽ 今日油价')
    .alias('60s fuel')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, region) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getFuelPrice(region)
        const text = formatFuelPrice(data)
        const items = (data.items || []).map((item) => ({ text: `${item.name}: ${item.price_desc}` }))
        if (data.trend) items.push({ text: `📉 ${data.trend.description}` })
        const payload = withMode(cardPayload({
          title: `⛽ 今日油价（${data.region}）`,
          items,
          footer: `更新: ${data.updated || '—'} · 60s API`,
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.金价`, '🥇 黄金价格')
    .alias('60s gold')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getGoldPrice()
        const text = formatGoldPrice(data)
        const items: Array<{ text: string }> = []
        if (data.metals?.length) {
          data.metals.forEach((m) => {
            items.push({ text: `${m.name}: ${m.today_price} ${m.unit}（卖${m.sell_price} 高${m.high_price} 低${m.low_price}）` })
          })
        }
        if (data.stores?.length) {
          items.push({ text: '—— 金店 ——' })
          data.stores.slice(0, 5).forEach((s) => items.push({ text: `${s.brand} ${s.product}: ${s.formatted}` }))
        }
        if (data.banks?.length) {
          items.push({ text: '—— 银行 ——' })
          data.banks.slice(0, 5).forEach((b) => items.push({ text: `${b.bank} ${b.product}: ${b.formatted}` }))
        }
        const payload = withMode(cardPayload({
          title: `🥇 黄金价格（${data.date}）`,
          items,
          footer: '60s API',
        }, 'hot', 'list'), options)
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.天气 <city>`, '🌤️ 实时天气')
    .alias('60s weather')
    .option('days', '-d, --days <days:number> 预报天数(最多8天)')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, city) => {
      await safeAction(ctx, session, async () => {
        const days = options.days
        if (days && days > 1) {
          const data = await client.getWeatherForecast(city, Math.min(days, 8))
          const text = formatWeatherForecast(data)
          const payload = withMode(cardPayload({
            title: `🌤️ ${data.location.name} 天气预报`,
            items: data.daily_forecast.map((d) => ({ text: `${d.date} ${d.day_condition} ${d.min_temperature}~${d.max_temperature}°C` })),
            footer: '60s API',
          }, 'hot', 'list'), options)
          await sendReply(ctx, session, client, config, { ...payload, text })
        } else {
          const data = await client.getWeatherRealtime(city)
          const text = formatWeatherRealtime(data)
          const infoLines: string[] = [
            `☁️ ${data.weather.condition}`,
            `💧 湿度 ${data.weather.humidity}%`,
            `💨 ${data.weather.wind_direction} ${data.weather.wind_power}`,
          ]
          if (data.air_quality) infoLines.push(`😷 ${data.air_quality.quality} (AQI ${data.air_quality.aqi})`)
          const sections: Array<{ title: string; lines: string[] }> = []
          if (data.sunrise) sections.push({ title: '🌅 日出日落', lines: [`日出 ${data.sunrise.sunrise} · 日落 ${data.sunrise.sunset}`] })
          if (data.life_indices?.length) {
            sections.push({ title: '🏷️ 生活指数', lines: data.life_indices.slice(0, 6).map((idx) => `${idx.name}: ${idx.level}`) })
          }
          if (data.alerts?.length) {
            sections.push({ title: '⚠️ 预警', lines: data.alerts.map((a) => `${a.type}(${a.level}): ${a.detail}`) })
          }
          const payload = withMode(cardPayload({
            title: `🌤️ ${data.location.name}`,
            subtitle: data.weather.condition,
            temp: `${data.weather.temperature}°C`,
            infoLines,
            sections,
            footer: `更新: ${data.weather.updated || '—'} · 60s API`,
          }, 'weather', 'list'), options)
          await sendReply(ctx, session, client, config, { ...payload, text })
        }
      }, { client, config, commandVerbose: options.verbose })
    })
}
