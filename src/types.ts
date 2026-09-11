export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ==================== /v2/60s ====================

export interface NewsItem {
  title: string
  link: string
}

export interface Daily60s {
  date: string
  // 60s v2 当前返回字符串数组，保留对象形式以兼容旧版本实例。
  news: Array<NewsItem | string>
  cover: string
  tip: string
  image: string
  link: string
  day_of_week: string
  lunar_date: string
  updated: string
  updated_at: number
  api_updated: string
  api_updated_at: number
}

// ==================== 热榜 ====================

export interface HotSearchItem {
  title: string
  hot_value?: number
  link?: string
  cover?: string
}

export interface ZhihuHotItem {
  title: string
  detail: string
  cover: string
  hot_value_desc: string
  answer_cnt: number
  follower_cnt: number
  comment_cnt: number
  created_at: number
  created: string
  link: string
}

export interface DouyinHotItem extends HotSearchItem {
  event_time: string
  event_time_at: number
  active_time: string
  active_time_at: number
}

export interface HackerNewsItem {
  id: number
  title: string
  link: string
  score: number
  author: string
  created: string
  created_at: number
}

// ==================== 天气 ====================

export interface WeatherRealtime {
  location: {
    name: string
    province: string
    city: string
    county: string
  }
  weather: {
    condition: string
    condition_code: string
    temperature: number
    humidity: number
    pressure: number
    precipitation: number
    wind_direction: string
    wind_power: string
    weather_icon: string
    weather_colors: string[]
    updated: string
    updated_at: number
  }
  air_quality: {
    aqi: number
    level: number
    quality: string
    pm25: number
    pm10: number
    co: number
    no2: number
    o3: number
    so2: number
    rank: number
    total_cities: number
    updated: string
    updated_at: number
  } | null
  sunrise: {
    sunrise: string
    sunrise_at: number
    sunrise_desc: string
    sunset: string
    sunset_at: number
    sunset_desc: string
  } | null
  life_indices: Array<{
    key: string
    name: string
    level: string
    description: string
  }>
  alerts: Array<{
    type: string
    level: string
    level_code: string
    province: string
    city: string
    county: string
    detail: string
    updated: string
    updated_at: number
  }>
}

export interface WeatherForecast {
  location: WeatherRealtime['location']
  hourly_forecast: Array<{
    datetime: string
    temperature: number
    condition: string
    condition_code: string
    wind_direction: string
    wind_power: string
    weather_icon: string
  }>
  daily_forecast: Array<{
    date: string
    day_condition: string
    day_condition_code: string
    night_condition: string
    night_condition_code: string
    max_temperature: number
    min_temperature: number
    day_wind_direction: string
    day_wind_power: string
    night_wind_direction: string
    night_wind_power: string
    aqi: number
    aqi_level: string
    air_quality: string
    day_weather_icon: string
    night_weather_icon: string
  }>
  sunrise_sunset: Array<{
    sunrise: string
    sunrise_at: number
    sunrise_desc: string
    sunset: string
    sunset_at: number
    sunset_desc: string
  }>
}

// ==================== 金融 ====================

export interface ExchangeRate {
  base_code: string
  updated: string
  updated_at: number
  next_updated: string
  next_updated_at: number
  rates: Array<{ currency: string; rate: number }>
}

export interface FuelPrice {
  region: string
  trend: {
    next_adjustment_date: string
    direction: string
    change_ton: number
    change_ton_desc: string
    change_liter_min: number
    change_liter_max: number
    change_liter_desc: string
    description: string
  } | null
  items: Array<{ name: string; price: number; price_desc: string }>
  link: string
  updated: string
  updated_at: number
}

export interface GoldPrice {
  date: string
  metals: Array<{
    name: string
    sell_price: string
    today_price: string
    high_price: string
    low_price: string
    unit: string
    updated: string
    updated_at: number
  }>
  stores: Array<{ brand: string; product: string; price: string; unit: string; formatted: string; updated: string; updated_at: number }>
  banks: Array<{ bank: string; product: string; price: string; unit: string; formatted: string; time: string; updated: string; updated_at: number }>
  recycle: Array<Record<string, string | number>>
}

// ==================== 娱乐 ====================

export interface SingleContent {
  index?: number
  hitokoto?: string
  duanzi?: string
  content?: string
}

export interface FabingItem {
  index: number
  saying: string
  text?: string
}

export interface AnswerData {
  answer: string
}

export interface LuckData {
  luck_desc: string
  luck_rank: number
  luck_tip: string
  luck_tip_index: number
}

// ==================== 日历 ====================

export interface TodayInHistory {
  date: string
  month: number
  day: number
  items: Array<{
    title: string
    year: string
    description: string
    event_type: 'birth' | 'death' | 'event'
    link: string
  }>
}

export interface MoyuData {
  date: {
    gregorian: string
    weekday: string
    dayOfWeek: number
    lunar: Record<string, string>
  }
  today: {
    isWeekend: boolean
    isHoliday: boolean
    isWorkday: boolean
    holidayName: string | null
    solarTerm: string | null
    lunarFestivals: string[]
  }
  progress: {
    week: { passed: number; total: number; remaining: number; percentage: number }
    month: { passed: number; total: number; remaining: number; percentage: number }
    year: { passed: number; total: number; remaining: number; percentage: number }
  }
  currentHoliday: { name: string; dayOfHoliday: number; daysRemaining: number; totalDays: number } | null
  nextHoliday: { name: string; date: string; until: number; duration: number; workdays: string[] } | null
  nextWeekend: { date: string; weekday: string; daysUntil: number } | null
  countdown: { toWeekEnd: number; toFriday: number; toMonthEnd: number; toYearEnd: number }
  moyuQuote: string
}

// ==================== 资讯 ====================

export interface ITNewsItem {
  title: string
  link: string
  description: string
  created: string
  created_at: number
}

export interface AINewsItem {
  title: string
  detail: string
  link: string
  source: string
  date: string
}

export interface AINewsData {
  date: string
  news: AINewsItem[]
}

// ==================== 歌词 ====================

export interface LyricData {
  title: string
  artists: string[]
  album: string
  offset: number
  lyrics: Array<{ ms: number; time: string; label: string; lyric: string }>
  formatted: string
  raw_lyric: string
}

// ==================== 工具 ====================

export interface QRCodeData {
  mime_type: string
  text: string
  base64: string
  data_uri: string
}

export interface IPData {
  ip: string
  continent: string
  country: string
  zipcode: string
  timezone: string
  accuracy: string
  owner: string
  isp: string
  source: string
  prov: string
  city: string
  district: string
  lat: string
  lng: string
  asnumber: string
}

export interface PasswordData {
  password: string
  length: number
  config: Record<string, boolean>
  character_sets: Record<string, string | string[]>
  generation_info: {
    entropy: number
    strength: string
    time_to_crack: string
  }
}

export interface PasswordCheckData {
  password: string
  length: number
  score: number
  strength: string
  entropy: number
  time_to_crack: string
  character_analysis: Record<string, boolean | number>
  recommendations: string[]
  security_tips: string[]
}

// ==================== 百科/健康 ====================

export interface BaikeData {
  title: string
  abstract: string
  description: string
  cover: string
  link: string
  has_other: boolean
}

export interface HealthData {
  height: number
  weight: number
  gender: string
  age: number
  bmi: number
  bmi_level: string
  bmr: number
  tdee: number
  body_fat: number
  ideal_measurements: Record<string, number>
}

// ==================== QQ/酷安 ====================

export interface QQProfileData {
  qq: string
  nickname: string
  avatar_url: string
  avatar_size: number
}

export interface KuanData {
  title: string
  summary?: string
  link?: string
}

// ==================== 翻译 ====================

export interface FanyiData {
  source: {
    text: string
    type: string
    type_desc: string
    pronounce: string
  }
  target: {
    text: string
    type: string
    type_desc: string
    pronounce: string
  }
}

// ==================== IP 定位别名（兼容 ip.sb 简化返回） ====================

export type IPLocationData = IPData
