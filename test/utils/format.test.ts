import { describe, expect, it } from 'vitest'
import {
  escapeMarkdown,
  formatAINews,
  formatDaily,
  formatExchangeRate,
  formatGenericHot,
  formatHackerNews,
  formatITNews,
  formatLyric,
  formatMoyu,
  formatTodayInHistory,
  formatWeatherForecast,
  formatWeatherRealtime,
  formatWeibo,
  truncate,
} from '../../src/utils/format'

describe('utils/format', () => {
  describe('truncate', () => {
    it('returns short text unchanged', () => {
      expect(truncate('abc')).toBe('abc')
    })
    it('truncates long text with ellipsis', () => {
      expect(truncate('a'.repeat(100), 10)).toBe(`${'a'.repeat(10)}…`)
    })
  })

  describe('escapeMarkdown', () => {
    it('escapes markdown special chars', () => {
      expect(escapeMarkdown('a*b_`#')).toMatch(/\\\*/)
      expect(escapeMarkdown('a*b_`#')).toContain('\\*')
    })
  })

  describe('formatDaily', () => {
    it('formats daily news with date and tip', () => {
      const result = formatDaily({
        date: '2026-08-07',
        day_of_week: '星期五',
        lunar_date: '六月廿五',
        news: [{ title: '新闻一', link: 'http://x' }, { title: '新闻二', link: 'http://y' }],
        tip: '每日微语',
        image: 'http://img',
        link: 'http://link',
        cover: 'http://cover',
        updated: '10:00',
        updated_at: 0,
        api_updated: '10:00',
        api_updated_at: 0,
      } as any)
      expect(result).toContain('2026-08-07')
      expect(result).toContain('星期五')
      expect(result).toContain('农历六月廿五')
      expect(result).toContain('1. 新闻一')
      expect(result).toContain('2. 新闻二')
      expect(result).toContain('每日微语')
    })

    it('supports the string news entries returned by current 60s v2', () => {
      const result = formatDaily({
        date: '2026-08-26', day_of_week: '星期三', lunar_date: '七月十四',
        news: ['最新新闻标题'], tip: '每日微语', image: '', link: '', cover: '',
        updated: '', updated_at: 0, api_updated: '', api_updated_at: 0,
      })
      expect(result).toContain('1. 最新新闻标题')
      expect(result).not.toContain('undefined')
    })

    it('strips leading order numbers from raw news titles to avoid duplicate numbering', () => {
      const result = formatDaily({
        date: '2026-10-06', day_of_week: '星期二', lunar_date: '八月廿七',
        news: [
          '1. 国庆假期第 5 日：全社会跨区域人员流动量预计 3.06 亿人次',
          '2. “黄金睡眠时长” 出炉',
          '10. 2026 年诺贝尔生理学或医学奖揭晓',
          '15、 韩国公布地雷调查',
        ],
        tip: '每日微语', image: '', link: '', cover: '',
        updated: '', updated_at: 0, api_updated: '', api_updated_at: 0,
      })
      expect(result).toContain('1. 国庆假期第 5 日：全社会跨区域人员流动量预计 3.06 亿人次')
      expect(result).toContain('2. “黄金睡眠时长” 出炉')
      expect(result).toContain('3. 2026 年诺贝尔生理学或医学奖揭晓')
      expect(result).toContain('4. 韩国公布地雷调查')
      expect(result).not.toContain('1. 1.')
      expect(result).not.toContain('2. 2.')
      expect(result).not.toContain('3. 10.')
    })
  })

  describe('formatWeibo', () => {
    it('formats hot search with medals and hot value', () => {
      const result = formatWeibo([
        { title: '热词1', hot_value: 1000 },
        { title: '热词2', hot_value: 500 },
        { title: '热词3', hot_value: 300 },
        { title: '热词4' },
      ])
      expect(result).toContain('微博热搜')
      expect(result).toContain('🥇')
      expect(result).toContain('🥈')
      expect(result).toContain('🥉')
      expect(result).toContain('4.')
      expect(result).toContain('🔥1000')
    })
  })

  describe('formatGenericHot', () => {
    it('uses provided title', () => {
      const result = formatGenericHot([{ title: '词' }], '头条热榜')
      expect(result).toContain('头条热榜')
    })
  })

  describe('formatHackerNews', () => {
    it('formats HN items with author and score', () => {
      const result = formatHackerNews([
        { id: 1, title: 'HN Post', link: 'http://x', score: 100, author: 'alice', created: '2026-08-07 10:00:00', created_at: 0 },
      ])
      expect(result).toContain('HN Post')
      expect(result).toContain('alice')
      expect(result).toContain('🔥100')
    })
  })

  describe('formatWeatherRealtime', () => {
    it('formats weather with air quality and sunrise', () => {
      const result = formatWeatherRealtime({
        location: { name: '成都', province: '四川', city: '成都', county: '' },
        weather: {
          condition: '晴', condition_code: '0', temperature: 25, humidity: 60, pressure: 1000,
          precipitation: 0, wind_direction: '南风', wind_power: '2级', weather_icon: '', weather_colors: [],
          updated: '10:00', updated_at: 0,
        },
        air_quality: { aqi: 50, level: 1, quality: '优', pm25: 20, pm10: 30, co: 0.5, no2: 10, o3: 60, so2: 5, rank: 1, total_cities: 100, updated: '10:00', updated_at: 0 },
        sunrise: { sunrise: '06:00', sunrise_at: 0, sunrise_desc: '', sunset: '19:00', sunset_at: 0, sunset_desc: '' },
        life_indices: [{ key: 'uv', name: '紫外线', level: '弱', description: '' }],
        alerts: [],
      } as any)
      expect(result).toContain('成都')
      expect(result).toContain('25°C')
      expect(result).toContain('优')
      expect(result).toContain('日出 06:00')
    })
  })

  describe('formatWeatherForecast', () => {
    it('formats daily forecast', () => {
      const result = formatWeatherForecast({
        location: { name: '北京', province: '', city: '', county: '' },
        daily_forecast: [{ date: '2026-08-07', day_condition: '晴', day_condition_code: '0', night_condition: '多云', night_condition_code: '1', max_temperature: 30, min_temperature: 20, day_wind_direction: '', day_wind_power: '', night_wind_direction: '', night_wind_power: '', aqi: 0, aqi_level: '', air_quality: '', day_weather_icon: '', night_weather_icon: '' }],
        hourly_forecast: [],
        sunrise_sunset: [],
      } as any)
      expect(result).toContain('北京')
      expect(result).toContain('2026-08-07')
      expect(result).toContain('20~30°C')
    })
  })

  describe('formatExchangeRate', () => {
    it('formats rates list', () => {
      const result = formatExchangeRate({
        base_code: 'CNY', updated: '10:00', updated_at: 0, next_updated: '', next_updated_at: 0,
        rates: [{ currency: 'USD', rate: 7.2 }, { currency: 'JPY', rate: 0.05 }],
      } as any)
      expect(result).toContain('CNY')
      expect(result).toContain('USD: 7.2')
      expect(result).toContain('JPY: 0.05')
    })
  })

  describe('formatTodayInHistory', () => {
    it('formats history items', () => {
      const result = formatTodayInHistory({
        date: '8-7', month: 8, day: 7,
        items: [{ title: '大事件', year: '1945', description: '', event_type: 'event', link: '' }],
      } as any)
      expect(result).toContain('8-7')
      expect(result).toContain('1945 大事件')
    })
  })

  describe('formatMoyu', () => {
    it('formats progress and holidays', () => {
      const result = formatMoyu({
        date: { gregorian: '2026-08-07', weekday: '星期五', dayOfWeek: 5, lunar: {} },
        today: { isWeekend: false, isHoliday: false, isWorkday: true, holidayName: null, solarTerm: null, lunarFestivals: [] },
        progress: { week: { passed: 5, total: 7, remaining: 2, percentage: 71 }, month: { passed: 7, total: 31, remaining: 24, percentage: 23 }, year: { passed: 219, total: 365, remaining: 146, percentage: 60 } },
        currentHoliday: null,
        nextHoliday: { name: '中秋节', date: '2026-09-25', until: 49, duration: 3, workdays: [] },
        nextWeekend: null,
        countdown: { toWeekEnd: 2, toFriday: 0, toMonthEnd: 24, toYearEnd: 146 },
        moyuQuote: '摸鱼快乐',
      } as any)
      expect(result).toContain('2026-08-07')
      expect(result).toContain('71%')
      expect(result).toContain('中秋节')
      expect(result).toContain('摸鱼快乐')
    })
  })

  describe('formatITNews', () => {
    it('formats IT news list', () => {
      const result = formatITNews([
        { title: 'IT 新闻一', link: '', description: '', created: '2026-08-07 10:00:00', created_at: 0 },
      ])
      expect(result).toContain('IT 资讯')
      expect(result).toContain('IT 新闻一')
    })
  })

  describe('formatAINews', () => {
    it('formats AI news with source', () => {
      const result = formatAINews({
        date: '2026-08-06',
        news: [{ title: 'AI 新闻', detail: '', link: '', source: '公众号', date: '2026-08-06' }],
      })
      expect(result).toContain('AI 资讯')
      expect(result).toContain('公众号')
    })
  })

  describe('formatLyric', () => {
    it('formats lyric with title and lyrics', () => {
      const result = formatLyric({
        title: '晴天', artists: ['周杰伦'], album: '叶惠美', offset: 0,
        lyrics: [
          { ms: 0, time: '00:00', label: '[00:00.00]', lyric: '故事的小黄花' },
          { ms: 5000, time: '00:05', label: '[00:05.00]', lyric: '从出生那年就飘着' },
          { ms: 10000, time: '00:10', label: '[00:10.00]', lyric: '' },
        ],
        formatted: '', raw_lyric: '',
      } as any)
      expect(result).toContain('晴天')
      expect(result).toContain('周杰伦')
      expect(result).toContain('故事的小黄花')
      expect(result).toContain('从出生那年就飘着')
    })
  })
})
