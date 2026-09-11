import type { Context } from 'koishi'
import type { Config } from '../config'
import type { Client } from '../client'
import { addModeOption, cardPayload, makePayload, safeAction, sendReply, withMode } from './helper'
import { formatLyric } from '../utils/format'

export async function registerToolCommands(ctx: Context, config: Config, client: Client) {
  const base = config.commandPrefix

  addModeOption(ctx.command(`${base}.二维码 <text:text>`, '🔳 生成二维码')
    .alias('60s qrcode')
    .option('size', '-s, --size <size:number> 尺寸(默认256)')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, text) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getQRCode(text, options.size || 256)
        const payload = withMode(cardPayload({
          title: '🔳 二维码',
          subtitle: '扫描或保存原图使用',
          mediaUrl: data.data_uri,
          mediaShape: 'square',
          footer: '60s API',
        }, 'media', 'image'), options, 'qrcode')
        await sendReply(ctx, session, client, config, {
          ...payload,
          text: '本指令输出格式请在配置项改成图片。',
          imageUrl: data.data_uri,
        })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.IP [ip]`, '🌐 IP 查询').alias('60s ip')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, ip) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getIP(ip)
        const linesArr = [
          `🌐 IP: ${data.ip}`,
          `📍 位置: ${data.country}${data.prov ? ` ${data.prov}` : ''}${data.city ? ` ${data.city}` : ''}`,
          data.isp ? `🏢 ISP: ${data.isp}` : '',
          data.asnumber ? `🔢 ASN: ${data.asnumber}` : '',
          data.timezone ? `🕐 时区: ${data.timezone}` : '',
        ].filter(Boolean)
        const lines = linesArr.join('\n')
        const payload = withMode(cardPayload({
          title: '🌐 IP 查询',
          items: linesArr.map((l) => ({ text: l })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'ip')
        await sendReply(ctx, session, client, config, { ...payload, text: lines })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.密码 [length]`, '🔐 随机密码')
    .alias('60s password')
    .option('symbols', '-s, --symbols 包含符号')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, length) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getPassword(length ? +length : 16, options.symbols)
        const linesArr = [
          `🔐 密码: ${data.password}`,
          `强度: ${data.generation_info?.strength} | 熵: ${data.generation_info?.entropy}`,
          data.generation_info?.time_to_crack ? `破解耗时: ${data.generation_info.time_to_crack}` : '',
        ].filter(Boolean)
        const lines = linesArr.join('\n')
        const payload = withMode(cardPayload({
          title: '🔐 随机密码',
          items: linesArr.map((l) => ({ text: l })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'password')
        await sendReply(ctx, session, client, config, { ...payload, text: lines })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.密码校验 <password>`, '🔒 密码强度检测')
    .alias('60s pwdcheck')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, password) => {
      await safeAction(ctx, session, async () => {
        const data = await client.checkPassword(password)
        const lines = [
          `🔒 密码强度: ${data.strength} (${data.score}/10)`,
          `熵: ${data.entropy} | 破解耗时: ${data.time_to_crack}`,
          ...(data.recommendations?.length ? ['', '💡 建议:', ...data.recommendations.map((r) => `· ${r}`)] : []),
        ].join('\n')
        const payload = withMode(cardPayload({
          title: '🔒 密码强度检测',
          items: lines.split('\n').filter((l) => l.trim()).map((l) => ({ text: l })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'password-check')
        await sendReply(ctx, session, client, config, { ...payload, text: lines })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.百科 <word>`, '📖 百度百科')
    .alias('60s baike')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, word) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getBaike(word)
        const text = [`📖 ${data.title}`, '', data.abstract].filter(Boolean).join('\n')
        const payload = withMode(cardPayload({
          title: `📖 ${data.title}`,
          body: data.abstract || data.description || '',
          footer: '60s API',
        }, 'simple', 'single'), options, 'baike')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.翻译 <text:text>`, '🈶 翻译（有道）')
    .alias('60s translate')
    .option('to', '-t, --to <to:string> 目标语言(默认zh-CHS)')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, text) => {
      await safeAction(ctx, session, async () => {
        const data = await client.translate(text, 'auto', options.to || 'zh-CHS')
        const lines = [
          `🈶 ${data.source.type_desc || data.source.type}: ${data.source.text}`,
          `✅ ${data.target.type_desc || data.target.type}: ${data.target.text}`,
          data.target.pronounce ? `🔊 发音: ${data.target.pronounce}` : '',
        ].filter(Boolean).join('\n')
        const payload = withMode(cardPayload({
          title: '🈶 翻译',
          subtitle: `${data.source.type_desc || data.source.type} → ${data.target.type_desc || data.target.type}`,
          body: data.target.text || '',
          footer: data.target.pronounce ? `🔊 ${data.target.pronounce} · 60s API` : '60s API',
        }, 'simple', 'single'), options, 'translate')
        await sendReply(ctx, session, client, config, { ...payload, text: lines })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.歌词 <song>`, '🎵 歌词查询')
    .alias('60s lyric')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, song) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getLyric(song)
        const text = formatLyric(data)
        const lines = (data.lyrics || []).filter((l) => l.lyric).map((l) => l.lyric).slice(0, 20)
        const payload = withMode(cardPayload({
          title: `🎵 ${data.title}`,
          subtitle: (data.artists || []).join(', '),
          items: lines.map((l) => ({ text: l })),
          footer: data.album ? `💿 ${data.album} · 60s API` : '60s API',
        }, 'hot', 'list'), options, 'lyric')
        await sendReply(ctx, session, client, config, { ...payload, text })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.健康 <height> <weight>`, '❤️ 健康计算(BMI等)')
    .alias('60s health')
    .option('gender', '-g, --gender <gender:string> 性别 male/female')
    .option('age', '-a, --age <age:number> 年龄')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, height, weight) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getHealth(+height, +weight, options.gender || 'male', options.age || 25)
        const linesArr = [
          `❤️ BMI: ${data.bmi} (${data.bmi_level})`,
          `🔥 基础代谢 BMR: ${data.bmr}`,
          `⚡ 每日消耗 TDEE: ${data.tdee}`,
          `🧊 体脂率: ${data.body_fat}%`,
        ]
        const lines = linesArr.join('\n')
        const payload = withMode(cardPayload({
          title: '❤️ 健康数据',
          items: linesArr.map((l) => ({ text: l })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'health')
        await sendReply(ctx, session, client, config, { ...payload, text: lines })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.猫眼`, '🎬 猫眼票房')
    .alias('60s maoyan')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const items = await client.getMaoyan('all-movie')
        const text = items.map((i, idx) => `${idx + 1}. ${i.title}`).slice(0, 20).join('\n')
        const payload = withMode(cardPayload({
          title: '🎬 猫眼全球票房',
          items: items.slice(0, 15).map((i) => ({ text: i.title })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'maoyan')
        await sendReply(ctx, session, client, config, { ...payload, text: `🎬 猫眼全球票房\n\n${text}` })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.酷安`, '📱 酷安热榜').alias('60s kuan')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }) => {
      await safeAction(ctx, session, async () => {
        const items = await client.getKuan()
        const text = items.map((i, idx) => `${idx + 1}. ${i.title}`).slice(0, 20).join('\n')
        const payload = withMode(cardPayload({
          title: '📱 酷安热榜',
          items: items.slice(0, 15).map((i) => ({ text: i.title })),
          footer: '60s API',
        }, 'hot', 'list'), options, 'kuan')
        await sendReply(ctx, session, client, config, { ...payload, text: `📱 酷安热榜\n\n${text}` })
      }, { client, config, commandVerbose: options.verbose })
    })

  addModeOption(ctx.command(`${base}.QQ <qq>`, '👤 QQ头像/资料')
    .alias('60s qq')
    .option('verbose', '-v, --verbose 输出详细调试日志'))
    .action(async ({ session, options }, qq) => {
      await safeAction(ctx, session, async () => {
        const data = await client.getQQProfile(qq)
        const text = `👤 QQ ${data.qq}: ${data.nickname}`
        const payload = withMode(cardPayload({
          title: `👤 ${data.nickname || `QQ ${data.qq}`}`,
          subtitle: `QQ: ${data.qq}`,
          mediaUrl: data.avatar_url,
          mediaShape: 'circle',
          footer: '60s API',
        }, 'media', 'image'), options, 'qq-profile')
        await sendReply(ctx, session, client, config, { ...payload, text, imageUrl: data.avatar_url })
      }, { client, config, commandVerbose: options.verbose })
    })
}
