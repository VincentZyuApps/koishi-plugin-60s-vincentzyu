import { Context } from 'koishi'
import type { Config } from './config'
import type {
  ApiResponse,
  AINewsData,
  AnswerData,
  BaikeData,
  Daily60s,
  DouyinHotItem,
  ExchangeRate,
  FabingItem,
  FanyiData,
  FuelPrice,
  GoldPrice,
  HackerNewsItem,
  HealthData,
  HotSearchItem,
  IPData,
  ITNewsItem,
  KuanData,
  LuckData,
  LyricData,
  MoyuData,
  PasswordCheckData,
  PasswordData,
  QQProfileData,
  QRCodeData,
  SingleContent,
  TodayInHistory,
  WeatherForecast,
  WeatherRealtime,
  ZhihuHotItem,
} from './types'

interface QueryParams {
  [key: string]: string | number | boolean | undefined
}

function buildQuery(params?: QueryParams): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue
    search.set(k, String(v))
  }
  const str = search.toString()
  return str ? `?${str}` : ''
}

export class ApiError extends Error {
  constructor(message: string, public readonly code = -1) {
    super(message)
  }
}

export class Client {
  private baseUrl: string
  private timeout: number
  private verbose: boolean

  constructor(private readonly ctx: Context, config: Config) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.timeout = config.timeout
    this.verbose = config.verboseConsoleLog
  }

  /** 运行时切换 verbose 状态（供 --verbose 命令选项临时开启），返回旧值便于恢复 */
  setVerbose(value: boolean): boolean {
    const prev = this.verbose
    this.verbose = value
    return prev
  }

  private log(level: 'debug' | 'info' | 'warn', message: string) {
    if (!this.verbose) return
    if (level === 'debug') this.ctx.logger.debug(message)
    else if (level === 'info') this.ctx.logger.info(message)
    else this.ctx.logger.warn(message)
  }

  private async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const url = `${this.baseUrl}/v2${endpoint}${buildQuery({ ...params, encoding: 'json' })}`
    this.log('debug', `[60s] 请求开始 GET ${url}`)
    const start = Date.now()

    let raw: any
    let httpStatus = -1
    try {
      const response: any = await (this.ctx.http as any)(url, {
        method: 'GET',
        timeout: this.timeout,
        // 不因非 2xx 状态码抛错，交给下面统一解析 body
        validateStatus: () => true,
        fullResponse: true,
      })
      httpStatus = response?.status ?? -1
      raw = response?.data ?? response
    } catch (error: any) {
      const detail = this.requestErrorDetail(error)
      this.ctx.logger.warn(`[60s] 请求失败 ${url}: ${detail}`)
      throw new ApiError(`60s API 请求失败: ${detail}`)
    }

    const cost = Date.now() - start
    if (this.verbose) {
      const summary = this.safeSummary(raw)
      this.log('info', `[60s] 响应完成 GET ${url} | HTTP ${httpStatus} | 耗时 ${cost}ms | 响应摘要: ${summary}`)
    } else {
      this.log('debug', `[60s] ${url} 耗时 ${cost}ms`)
    }

    if (!raw || raw === '' || typeof raw !== 'object') {
      throw new ApiError(`60s API 返回了空响应（HTTP ${httpStatus}，无内容）。该端点可能正在维护或上游数据源不可用。`)
    }
    const body = raw as ApiResponse<T>
    if (body.code !== 200) {
      const message = body?.message || '未知错误'
      if (this.verbose) this.ctx.logger.warn(`[60s] 业务错误 code=${body?.code} message=${message}`)
      if (body.code === 404) {
        throw new ApiError(`未找到相关内容：${message}`, 404)
      }
      throw new ApiError(`60s API 返回错误(code=${body?.code}): ${message}`, body?.code)
    }
    return body.data
  }

  /** 生成安全的响应体摘要（截断 + 只保留关键字段），避免刷屏 */
  private safeSummary(raw: any): string {
    try {
      if (typeof raw === 'string') return raw.length > 100 ? `${raw.slice(0, 100)}…(${raw.length}字符)` : raw
      if (Array.isArray(raw)) {
        return `数组 len=${raw.length}, 首项=${this.safeSummary(raw[0])}`
      }
      if (raw && typeof raw === 'object') {
        const { code, message, data } = raw as any
        const dataSummary = Array.isArray(data)
          ? `len=${data.length}`
          : data && typeof data === 'object'
            ? Object.keys(data).slice(0, 8).join(',')
            : typeof data === 'string' && data.length > 60
              ? `${data.slice(0, 60)}…`
              : String(data ?? 'null')
        return `code=${code}, message=${message}, data{${dataSummary}}`
      }
      return String(raw)
    } catch {
      return '无法摘要'
    }
  }

  /** 保留 fetch 底层网络原因，方便区分 DNS、超时和连接重置。 */
  private requestErrorDetail(error: any): string {
    const message = String(error?.message || error || '未知网络错误')
    const cause = error?.cause
    const causeCode = cause?.code ? ` (${cause.code})` : ''
    const causeMessage = cause?.message && cause.message !== message ? `: ${cause.message}` : ''
    return `${message}${causeCode}${causeMessage}`
  }

  // ==================== 核心 ====================

  getDaily(date?: string, forceUpdate?: boolean) {
    return this.get<Daily60s>('/60s', { date, force_update: forceUpdate })
  }

  getTodayInHistory(date?: string) {
    return this.get<TodayInHistory>('/today-in-history', { date })
  }

  // ==================== 热榜 ====================

  getWeibo() {
    return this.get<HotSearchItem[]>('/weibo')
  }

  getBili() {
    return this.get<HotSearchItem[]>('/bili')
  }

  getDouyin() {
    return this.get<DouyinHotItem[]>('/douyin')
  }

  getZhihu() {
    return this.get<ZhihuHotItem[]>('/zhihu')
  }

  getToutiao() {
    return this.get<HotSearchItem[]>('/toutiao')
  }

  getBaiduHot() {
    return this.get<HotSearchItem[]>('/baidu/hot')
  }

  getQuark() {
    return this.get<HotSearchItem[]>('/quark')
  }

  getRednote() {
    return this.get<HotSearchItem[]>('/rednote')
  }

  getDongchedi() {
    return this.get<HotSearchItem[]>('/dongchedi')
  }

  getHackerNews(type: 'top' | 'best' = 'top', limit = 10, forceUpdate?: boolean) {
    return this.get<HackerNewsItem[]>(`/hacker-news/${type}`, { limit, force_update: forceUpdate })
  }

  getMaoyan(type: 'all-movie' | 'realtime-movie' | 'realtime-tv' | 'realtime-web' = 'all-movie', date?: string) {
    if (type === 'all-movie') return this.get<HotSearchItem[]>('/maoyan/all/movie')
    const seg = type.replace('realtime-', '')
    return this.get<HotSearchItem[]>(`/maoyan/realtime/${seg}`, { date })
  }

  // ==================== 天气 ====================

  getWeatherRealtime(query: string, city?: string, province?: string) {
    return this.get<WeatherRealtime>('/weather/realtime', { query, city, province })
  }

  getWeatherForecast(query: string, days = 7, city?: string, province?: string) {
    return this.get<WeatherForecast>('/weather/forecast', { query, days, city, province })
  }

  // ==================== 金融 ====================

  getExchangeRate(currency = 'CNY') {
    return this.get<ExchangeRate>('/exchange-rate', { currency })
  }

  getFuelPrice(region?: string, forceUpdate?: boolean) {
    return this.get<FuelPrice>('/fuel-price', { region, force_update: forceUpdate })
  }

  getGoldPrice() {
    return this.get<GoldPrice>('/gold-price')
  }

  // ==================== 娱乐 ====================

  getHitokoto(id?: number) {
    return this.get<SingleContent>('/hitokoto', { id })
  }

  getDuanzi(id?: number) {
    return this.get<SingleContent>('/duanzi', { id })
  }

  getDadJoke(id?: number) {
    return this.get<SingleContent>('/dad-joke', { id })
  }

  getFabing(name?: string) {
    return this.get<FabingItem>('/fabing', { name })
  }

  getAnswer(id?: number) {
    return this.get<AnswerData>('/answer', { id })
  }

  getLuck(id?: number) {
    return this.get<LuckData>('/luck', { id })
  }

  // ==================== 日历 ====================

  getMoyu(date?: string) {
    return this.get<MoyuData>('/moyu', { date })
  }

  // ==================== 资讯 ====================

  getITNews(limit = 20) {
    return this.get<ITNewsItem[]>('/it-news', { limit })
  }

  getITNewsRank(type: 'day' | 'week' | 'month' = 'day') {
    return this.get<HotSearchItem[]>('/it-news/rank', { type })
  }

  getAINews(date?: string, all = false) {
    return this.get<AINewsData>('/ai-news', { date, all })
  }

  // ==================== 歌词 ====================

  getLyric(query: string) {
    return this.get<LyricData>('/lyric', { query })
  }

  // ==================== 工具 ====================

  getQRCode(text: string, size = 256, level = 'M') {
    return this.get<QRCodeData>('/qrcode', { text, size, level })
  }

  getIP(ip?: string) {
    return this.get<IPData>('/ip', { ip })
  }

  getPassword(length = 16, symbols = false) {
    return this.get<PasswordData>('/password', { length, symbols })
  }

  checkPassword(password: string) {
    return this.get<PasswordCheckData>('/password/check', { password })
  }

  getBaike(word: string) {
    return this.get<BaikeData>('/baike', { word })
  }

  getHealth(height: number, weight: number, gender: string, age: number) {
    return this.get<HealthData>('/health', { height, weight, gender, age })
  }

  translate(text: string, from = 'auto', to = 'zh-CHS') {
    return this.get<FanyiData>('/fanyi', { text, from, to })
  }

  // ==================== Beta ====================

  getKuan() {
    return this.get<KuanData[]>('/beta/kuan')
  }

  getQQProfile(qq: string) {
    return this.get<QQProfileData>('/beta/qq/profile', { qq })
  }
}

export type ClientInstance = Client
