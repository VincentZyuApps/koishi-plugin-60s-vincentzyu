import { describe, expect, it, vi } from 'vitest'
import { mockCommandContext } from '../mocks/command'
import { makeClient, makeConfig, makeSession } from '../helpers/setup'
import { registerToolCommands } from '../../src/commands/tool'

describe('commands/tool', () => {
  async function setup(overrides: Record<string, any> = {}) {
    const { ctx, registrations } = mockCommandContext()
    const client = makeClient(overrides)
    await registerToolCommands(ctx, makeConfig(), client)
    return { ctx, registrations, client }
  }

  async function run(regs: any[], primary: string, args: any[] = [], options: any = {}) {
    const reg = regs.find((r) => r.primary === primary)
    const session = makeSession()
    await reg!.action!({ session, options }, ...args)
    return session
  }

  it('二维码 sends image element', async () => {
    const { registrations, client } = await setup({
      getQRCode: vi.fn().mockResolvedValue({ mime_type: 'image/gif', text: 'hello', base64: 'xxx', data_uri: 'data:image/gif;base64,xxx' }),
    })
    const session = await run(registrations, '60s.二维码', ['hello'])
    expect(client.getQRCode).toHaveBeenCalledWith('hello', 256)
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('<image')
    expect(sent).toContain('data:image/gif;base64,xxx')
  })

  it('IP formats location', async () => {
    const { registrations, client } = await setup({
      getIP: vi.fn().mockResolvedValue({ ip: '1.2.3.4', country: '中国', prov: '四川', city: '成都', isp: '电信', asnumber: 'AS4134', timezone: 'Asia/Shanghai' }),
    })
    const session = await run(registrations, '60s.IP')
    expect(client.getIP).toHaveBeenCalledWith(undefined)
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('1.2.3.4')
    expect(sent).toContain('四川')
    expect(sent).toContain('成都')
    expect(sent).toContain('电信')
  })

  it('密码 passes length and symbols flag', async () => {
    const { registrations, client } = await setup({
      getPassword: vi.fn().mockResolvedValue({ password: 'abc123', length: 6, config: {}, character_sets: {}, generation_info: { entropy: 30, strength: '中', time_to_crack: '1天' } }),
    })
    const session = await run(registrations, '60s.密码', ['12'], { symbols: true })
    expect(client.getPassword).toHaveBeenCalledWith(12, true)
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('abc123')
  })

  it('密码校验 formats strength', async () => {
    const { registrations, client } = await setup({
      checkPassword: vi.fn().mockResolvedValue({ password: 'weak', length: 4, score: 2, strength: '弱', entropy: 10, time_to_crack: '即时', character_analysis: {}, recommendations: ['加长'] }),
    })
    const session = await run(registrations, '60s.密码校验', ['weak'])
    expect(client.checkPassword).toHaveBeenCalledWith('weak')
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('弱')
    expect(sent).toContain('加长')
  })

  it('百科 formats word and summary', async () => {
    const { registrations, client } = await setup({
      getBaike: vi.fn().mockResolvedValue({ title: '原神', abstract: '是一款游戏', description: '', cover: '', link: '', has_other: false }),
    })
    const session = await run(registrations, '60s.百科', ['原神'])
    expect(client.getBaike).toHaveBeenCalledWith('原神')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('是一款游戏')
  })

  it('翻译 passes text and default to zh-CHS', async () => {
    const { registrations, client } = await setup({
      translate: vi.fn().mockResolvedValue({
        source: { text: 'hello', type: 'en', type_desc: '英语', pronounce: '' },
        target: { text: '你好', type: 'zh-CHS', type_desc: '中文', pronounce: 'nǐhǎo' },
      }),
    })
    const session = await run(registrations, '60s.翻译', ['hello'])
    expect(client.translate).toHaveBeenCalledWith('hello', 'auto', 'zh-CHS')
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('英语')
    expect(sent).toContain('中文')
    expect(sent).toContain('你好')
    expect(sent).toContain('nǐhǎo')
  })

  it('健康 passes height/weight and defaults gender/age', async () => {
    const { registrations, client } = await setup({
      getHealth: vi.fn().mockResolvedValue({ height: 170, weight: 60, gender: 'male', age: 25, bmi: 20.8, bmi_level: '正常', bmr: 1600, tdee: 2000, body_fat: 15, ideal_measurements: {} }),
    })
    const session = await run(registrations, '60s.健康', ['170', '60'])
    expect(client.getHealth).toHaveBeenCalledWith(170, 60, 'male', 25)
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('BMI: 20.8')
    expect(sent).toContain('BMR: 1600')
  })

  it('歌词 calls getLyric', async () => {
    const { registrations, client } = await setup({
      getLyric: vi.fn().mockResolvedValue({ title: '晴天', artists: ['周杰伦'], album: '', offset: 0, lyrics: [{ ms: 0, time: '00:00', label: '', lyric: '故事的小黄花' }], formatted: '', raw_lyric: '' }),
    })
    const session = await run(registrations, '60s.歌词', ['晴天'])
    expect(client.getLyric).toHaveBeenCalledWith('晴天')
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('故事的小黄花')
  })

  it('猫眼 lists movies', async () => {
    const { registrations, client } = await setup({
      getMaoyan: vi.fn().mockResolvedValue([{ title: '电影A' }, { title: '电影B' }]),
    })
    const session = await run(registrations, '60s.猫眼')
    expect(client.getMaoyan).toHaveBeenCalledWith('all-movie')
    const sent = session.send.mock.calls.map((c) => c[0]).join(' ')
    expect(sent).toContain('电影A')
    expect(sent).toContain('电影B')
  })

  it('酷安 lists items', async () => {
    const { registrations, client } = await setup({ getKuan: vi.fn().mockResolvedValue([{ title: '酷安热帖' }]) })
    const session = await run(registrations, '60s.酷安')
    expect(client.getKuan).toHaveBeenCalled()
    expect(session.send.mock.calls.map((c) => c[0]).join(' ')).toContain('酷安热帖')
  })

  it('QQ with avatar sends image, without avatar sends text', async () => {
    const withAvatar = await setup({
      getQQProfile: vi.fn().mockResolvedValue({ qq: '123', nickname: '小明', avatar_url: 'http://avatar.png', avatar_size: 0 }),
    })
    const s1 = await run(withAvatar.registrations, '60s.QQ', ['123'])
    expect(withAvatar.client.getQQProfile).toHaveBeenCalledWith('123')
    expect(s1.send.mock.calls.map((c) => c[0]).join(' ')).toContain('<image')

    const noAvatar = await setup({
      getQQProfile: vi.fn().mockResolvedValue({ qq: '456', nickname: '小红', avatar_url: '', avatar_size: 0 }),
    })
    const s2 = await run(noAvatar.registrations, '60s.QQ', ['456'])
    expect(s2.send.mock.calls.map((c) => c[0]).join(' ')).toContain('小红')
  })
})
