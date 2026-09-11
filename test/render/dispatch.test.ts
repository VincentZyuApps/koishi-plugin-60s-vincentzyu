import { describe, expect, it } from 'vitest'
import { parseModeOption } from '../../src/commands/helper'
import { OutputUnavailableError, renderReply, sendReply } from '../../src/render/dispatch'
import { DEFAULT_CUSTOM_COMMAND_OUTPUT } from '../../src/render/output'
import { makeConfig, makeSession } from '../helpers/setup'

describe('render/dispatch', () => {
  const cardData = { title: '测试卡片', body: '卡片正文' }

  it('通用预设在卡片不可用时回退为文本', async () => {
    const result = await renderReply({ logger: { warn() {} } } as any, makeSession(), {} as any, makeConfig(), { text: '文本兜底', cardData, kind: 'list' })
    expect(result.mode).toBe('text')
    expect(result.elements).toContain('文本兜底')
  })

  it('QQ 官方预设优先发送原生 Markdown', async () => {
    const session = makeSession({ platform: 'qq' })
    const result = await renderReply({ logger: { warn() {} } } as any, session, {} as any, makeConfig({ renderPreset: 'qq-official' }), { text: '热榜文本', markdown: '# 热榜', kind: 'list' }, '60s.热榜')
    expect(result.mode).toBe('qq-markdown')
    expect(session.bot.internal.sendMessage).toHaveBeenCalled()
  })

  it('自定义预设严格拒绝不可用的输出', async () => {
    const customCommandOutput = { ...DEFAULT_CUSTOM_COMMAND_OUTPUT, daily: 'image' as const }
    await expect(renderReply({ logger: { error() {}, warn() {} } } as any, makeSession(), {} as any, makeConfig({ renderPreset: 'custom', customCommandOutput }), { text: '早报', kind: 'list', commandId: 'daily' })).rejects.toBeInstanceOf(OutputUnavailableError)
  })

  it('临时模式不可用后继续使用预设规则', async () => {
    const result = await renderReply({ logger: { warn() {} } } as any, makeSession(), {} as any, makeConfig(), { text: '文本兜底', cardData, kind: 'single', modeOverride: 'image' })
    expect(result.mode).toBe('text')
  })

  it('只接受四种最终输出模式', () => {
    expect(parseModeOption('card')).toBe('card')
    expect(parseModeOption('qq-markdown')).toBe('qq-markdown')
    expect(parseModeOption('qq-auto')).toBeUndefined()
    expect(parseModeOption('general-auto')).toBeUndefined()
  })

  it('等待提示与最终回复都应用引用设置', async () => {
    const session = makeSession()
    await sendReply({ logger: { warn() {} } } as any, session, {} as any, makeConfig({ enableQuote: true, enableWaitingHint: true }), { text: '早报内容' })
    expect(session.send).toHaveBeenCalledTimes(2)
    expect(session.send.mock.calls[0][0]).toContain('<quote id="msg-1">')
    expect(session.send.mock.calls[1][0]).toContain('早报内容')
    expect(session.bot.deleteMessage).toHaveBeenCalledWith('456', 'mock-msg-id')
  })
})
