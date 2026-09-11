import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, Client } from '../../src/client'

const config = {
  baseUrl: 'http://127.0.0.1:4399',
  timeout: 1000,
  verboseConsoleLog: false,
} as any

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function makeCtx(httpImpl: any = vi.fn()) {
  return {
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    http: httpImpl,
  } as any
}

function successBody(data: any, code = 200, message = 'success') {
  return { code, message, data }
}

describe('Client', () => {
  describe('get()', () => {
    it('builds correct URL with /v2 prefix and encoding=json', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody({ date: '2026-08-07' }) })
      const client = new Client(makeCtx(http), config)
      await client.getDaily()

      const [url, opts] = http.mock.calls[0]
      expect(url).toContain('/v2/60s')
      expect(url).toContain('encoding=json')
      expect(opts.method).toBe('GET')
      expect(opts.validateStatus()).toBe(true)
    })

    it('parses {code,data} and returns data', async () => {
      const data = { date: '2026-08-07', news: [] }
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody(data) })
      const client = new Client(makeCtx(http), config)
      const result = await client.getDaily()
      expect(result).toEqual(data)
    })

    it('handles fullResponse.data wrapper', async () => {
      const data = { word: '原神' }
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody(data) })
      const client = new Client(makeCtx(http), config)
      const result = await client.getBaike('原神')
      expect(result).toEqual(data)
      const [url] = http.mock.calls[0]
      expect(url).toContain('word=%E5%8E%9F%E7%A5%9E')
    })

    it('throws friendly message for 404 business code', async () => {
      const http = vi.fn().mockResolvedValue({ status: 404, data: successBody(null, 404, '未找到相关词条') })
      const client = new Client(makeCtx(http), config)
      await expect(client.getBaike('不存在')).rejects.toMatchObject({
        code: 404,
        message: expect.stringContaining('未找到相关内容'),
      })
    })

    it('throws ApiError for non-200 code', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody(null, 500, '服务器错误') })
      const client = new Client(makeCtx(http), config)
      await expect(client.getDaily()).rejects.toMatchObject({
        code: 500,
        message: expect.stringContaining('服务器错误'),
      })
    })

    it('throws empty-response error when body is empty string', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: '' })
      const client = new Client(makeCtx(http), config)
      await expect(client.getDaily()).rejects.toMatchObject({
        message: expect.stringContaining('空响应'),
      })
    })

    it('throws connection error when http throws', async () => {
      const http = vi.fn().mockRejectedValue(new Error('fetch failed'))
      const client = new Client(makeCtx(http), config)
      await expect(client.getDaily()).rejects.toMatchObject({
        message: expect.stringContaining('fetch failed'),
      })
    })

    it('filters out undefined/false params but keeps numbers', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody([]) })
      const client = new Client(makeCtx(http), config)
      await client.getHackerNews('top', 15, undefined)
      const [url] = http.mock.calls[0]
      expect(url).toContain('limit=15')
      expect(url).not.toContain('force_update')
    })
  })

  describe('setVerbose', () => {
    it('switches verbose and returns previous value', () => {
      const client = new Client(makeCtx(), { ...config, verboseConsoleLog: false })
      expect(client.setVerbose(true)).toBe(false)
      expect(client.setVerbose(false)).toBe(true)
    })
  })

  describe('specific endpoints', () => {
    it('getQRCode passes text param', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody({ data_uri: 'data:image/gif;base64,xxx' }) })
      const client = new Client(makeCtx(http), config)
      const result = await client.getQRCode('hello')
      expect(result.data_uri).toContain('base64')
      const [url] = http.mock.calls[0]
      expect(url).toContain('text=hello')
    })

    it('getExchangeRate passes currency', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody({ base_code: 'USD' }) })
      const client = new Client(makeCtx(http), config)
      await client.getExchangeRate('USD')
      const [url] = http.mock.calls[0]
      expect(url).toContain('currency=USD')
    })

    it('getHealth passes height/weight/gender/age', async () => {
      const http = vi.fn().mockResolvedValue({ status: 200, data: successBody({ bmi: 22 }) })
      const client = new Client(makeCtx(http), config)
      await client.getHealth(170, 60, 'male', 25)
      const [url] = http.mock.calls[0]
      expect(url).toContain('height=170')
      expect(url).toContain('weight=60')
      expect(url).toContain('gender=male')
      expect(url).toContain('age=25')
    })
  })

  describe('ApiError', () => {
    it('is an Error with code', () => {
      const e = new ApiError('msg', 404)
      expect(e).toBeInstanceOf(Error)
      expect(e.code).toBe(404)
      expect(e.message).toBe('msg')
    })
  })
})
