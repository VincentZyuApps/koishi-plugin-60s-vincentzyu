import { describe, expect, it } from 'vitest'

// 线上集成冒烟测试：默认跳过，只有显式设置 TEST_LIVE_60S=1 才运行。
// 60s 为纯 GET 只读 API，连接线上是安全的，不会产生任何写操作。
const baseUrl = process.env.TEST_LIVE_60S || process.env.TEST_LIVE_60S_BASE_URL

describe.skipIf(!baseUrl)('integration smoke (TEST_LIVE_60S)', () => {
  it('health endpoint responds ok', async () => {
    const res = await fetch(`${baseUrl}/health`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
  })

  it('GET /v2/60s returns news data', async () => {
    const res = await fetch(`${baseUrl}/v2/60s?encoding=json`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(200)
    expect(body.data).toBeTruthy()
    expect(body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('GET /v2/weibo returns hot list', async () => {
    const res = await fetch(`${baseUrl}/v2/weibo?encoding=json`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('GET /v2/hitokoto returns quote', async () => {
    const res = await fetch(`${baseUrl}/v2/hitokoto?encoding=json`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(200)
    expect(body.data.hitokoto).toBeTruthy()
  })

  it('unknown endpoint returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/v2/definitely-not-exist?encoding=json`)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe(404)
  })
})
