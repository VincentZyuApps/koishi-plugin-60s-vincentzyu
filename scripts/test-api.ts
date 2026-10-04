#!/usr/bin/env node
/**
 * 60s API 服务端点可用性与健康检查脚本
 * 
 * 优先级覆盖顺序：
 * 1. CLI 命令行参数 (--base-url / -u，或者 --ip / --host + --port / -p)
 * 2. 环境变量 (TEST_LIVE_60S, TEST_LIVE_60S_BASE_URL, SIXTY_S_API_URL, BASE_URL)
 * 3. 默认值 (http://127.0.0.1:4399)
 */

/**
 * @typedef {Object} TestCase
 * @property {string} name
 * @property {string} path
 * @property {string} desc
 * @property {boolean} [expectJson]
 * @property {(data: any, status?: number) => boolean | string} [validator]
 */

/** @type {TestCase[]} */
const TEST_CASES = [
  {
    name: 'health',
    path: '/health',
    desc: '服务健康检查',
    expectJson: false,
    validator: (text) => text.trim() === 'ok' || '响应内容不是 ok',
  },
  {
    name: 'root',
    path: '/',
    desc: 'API根信息与路由列表',
    validator: (json) => !!json.api_name || '缺少 api_name',
  },
  {
    name: '60s',
    path: '/v2/60s',
    desc: '60s 每日早报',
    validator: (json) => (Array.isArray(json.data?.news) && json.data.news.length > 0) || '新闻列表为空',
  },
  {
    name: 'today-in-history',
    path: '/v2/today-in-history',
    desc: '历史上的今天',
    validator: (json) => (Array.isArray(json.data?.items) && json.data.items.length > 0) || (Array.isArray(json.data) && json.data.length > 0) || '历史条目为空',
  },
  // 热榜类
  {
    name: 'weibo',
    path: '/v2/weibo',
    desc: '微博热搜榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || '微博热搜为空',
  },
  {
    name: 'bili',
    path: '/v2/bili',
    desc: 'B站热搜榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || 'B站热搜为空',
  },
  {
    name: 'zhihu',
    path: '/v2/zhihu',
    desc: '知乎热搜榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || '知乎热搜为空',
  },
  {
    name: 'douyin',
    path: '/v2/douyin',
    desc: '抖音热搜榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || '抖音热搜为空',
  },
  {
    name: 'baidu-hot',
    path: '/v2/baidu/hot',
    desc: '百度热搜榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || '百度热搜为空',
  },
  {
    name: 'it-news',
    path: '/v2/it-news',
    desc: 'IT资讯榜',
    validator: (json) => (Array.isArray(json.data) && json.data.length > 0) || 'IT资讯为空',
  },
  // 趣味娱乐类
  {
    name: 'hitokoto',
    path: '/v2/hitokoto',
    desc: '随机一言',
    validator: (json) => !!json.data?.hitokoto || '缺少 hitokoto',
  },
  {
    name: 'duanzi',
    path: '/v2/duanzi',
    desc: '随机段子',
    validator: (json) => !!json.data?.duanzi || '缺少 duanzi',
  },
  {
    name: 'dad-joke',
    path: '/v2/dad-joke',
    desc: '冷笑话',
    validator: (json) => !!json.data?.content || '缺少 content',
  },
  {
    name: 'fabing',
    path: '/v2/fabing?name=测试用户',
    desc: '发病文学',
    validator: (json) => !!json.data?.saying || !!json.data?.content || '缺少 saying 或 content',
  },
  {
    name: 'answer',
    path: '/v2/answer',
    desc: '答案之书',
    validator: (json) => !!json.data?.answer || '缺少 answer',
  },
  {
    name: 'moyu',
    path: '/v2/moyu',
    desc: '摸鱼日历',
    validator: (json) => !!json.data?.date || '缺少 date',
  },
  // 生活与工具类
  {
    name: 'weather',
    path: '/v2/weather/realtime?city=上海',
    desc: '实时天气 (上海)',
    validator: (json) => !!json.data?.location?.city || !!json.data?.city || '缺少城市天气信息',
  },
  {
    name: 'exchange-rate',
    path: '/v2/exchange-rate?currency=USD',
    desc: '美元汇率',
    validator: (json) => !!json.data?.rate || !!json.data?.cny || !!json.data || '缺少汇率数据',
  },
  {
    name: 'fuel-price',
    path: '/v2/fuel-price?province=上海',
    desc: '实时油价 (上海)',
    validator: (json) => !!json.data?.province || !!json.data || '缺少油价数据',
  },
  {
    name: 'gold-price',
    path: '/v2/gold-price',
    desc: '实时金价',
    validator: (json) => !!json.data || '缺少 data',
  },
  {
    name: 'ip',
    path: '/v2/ip?ip=8.8.8.8',
    desc: 'IP查询 (8.8.8.8)',
    validator: (json) => !!json.data?.ip || '缺少 ip',
  },
  {
    name: 'baike',
    path: '/v2/baike?word=中国',
    desc: '百度百科 (中国)',
    validator: (json) => !!json.data?.title || '缺少 title',
  },
  {
    name: 'fanyi',
    path: '/v2/fanyi?text=hello&to=zh-CHS',
    desc: '中英互译',
    validator: (json) => !!json.data?.target?.text || '缺少 target.text',
  },
  {
    name: 'password',
    path: '/v2/password?length=16',
    desc: '随机密码生成',
    validator: (json) => (typeof json.data?.password === 'string' && json.data.password.length === 16) || '密码长度不符',
  },
  {
    name: 'hash',
    path: '/v2/hash?content=test',
    desc: '哈希生成',
    validator: (json) => !!json.data?.md5 || '缺少 md5',
  },
  {
    name: 'lyric',
    path: '/v2/lyric?query=晴天',
    desc: '歌词查询 (晴天)',
    validator: (json) => !!json.data?.title || '缺少 title',
  },
  {
    name: 'qrcode',
    path: '/v2/qrcode?text=hello',
    desc: '二维码生成',
    expectJson: false,
    validator: (buffer) => buffer.length > 0 || '图片数据为空',
  },
  {
    name: '404-fallback',
    path: '/v2/definitely-not-exist-page-test',
    desc: '异常路由 404 校验',
    validator: (json, status) => status === 404 || `期望状态码 404，实际收到 ${status}`,
  },
]

function printHelp() {
  console.log(`
60s API 可用性与健康度测试工具

使用方法:
  node scripts/test-api.ts [选项]
  yarn workspace koishi-plugin-60s-vincentzyu test:api [选项]

选项:
  -u, --base-url <url>      指定 60s API 服务基础地址 (例: http://192.168.1.10:4399)
  --ip, --host <host>       指定主机名或 IP (默认: 127.0.0.1)
  -p, --port <port>         指定端口 (默认: 4399)
  --protocol <http|https>   指定协议 (默认: http)
  -t, --timeout <ms>        单项请求超时时间，单位毫秒 (默认: 8000)
  --only <names>            仅测试指定用例，多个以逗号分隔 (例: --only 60s,weibo,weather)
  -v, --verbose             打印详细响应数据
  -h, --help                显示帮助说明

优先级覆盖顺序:
  1. CLI 命令行参数 (--base-url 或 --ip + --port)
  2. 环境变量 (TEST_LIVE_60S, TEST_LIVE_60S_BASE_URL, SIXTY_S_API_URL, BASE_URL)
  3. 默认值 (http://127.0.0.1:4399)

示例:
  # 1. 显式指定远程 API 地址:
  yarn workspace koishi-plugin-60s-vincentzyu test:api -u http://laoke.vincentzyu233.cn:64399

  # 2. 指定 IP 与端口测试:
  yarn workspace koishi-plugin-60s-vincentzyu test:api --host laoke.vincentzyu233.cn --port 64399

  # 3. 环境变量覆盖:
  $env:TEST_LIVE_60S = "http://laoke.vincentzyu233.cn:64399"
  yarn workspace koishi-plugin-60s-vincentzyu test:api

  # 4. 仅测试部分接口:
  yarn workspace koishi-plugin-60s-vincentzyu test:api -u http://laoke.vincentzyu233.cn:64399 --only 60s,weibo,weather
`)
}

function resolveOptions() {
  const argv = process.argv.slice(2)
  let cliUrl
  let cliHost
  let cliPort
  let cliProtocol = 'http'
  let timeout = 8000
  let only
  let verbose = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      printHelp()
      process.exit(0)
    }
    if ((arg === '-u' || arg === '--base-url') && argv[i + 1]) {
      cliUrl = argv[++i]
    } else if ((arg === '--ip' || arg === '--host') && argv[i + 1]) {
      cliHost = argv[++i]
    } else if ((arg === '-p' || arg === '--port') && argv[i + 1]) {
      cliPort = argv[++i]
    } else if (arg === '--protocol' && argv[i + 1]) {
      cliProtocol = argv[++i]
    } else if ((arg === '-t' || arg === '--timeout') && argv[i + 1]) {
      timeout = parseInt(argv[++i], 10) || 8000
    } else if (arg === '--only' && argv[i + 1]) {
      only = argv[++i].split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
    } else if (arg === '-v' || arg === '--verbose') {
      verbose = true
    }
  }

  // 1. 命令行 --base-url
  if (cliUrl) {
    return { baseUrl: normalizeUrl(cliUrl), timeout, only, verbose }
  }

  // 2. 命令行 --ip / --port
  if (cliHost || cliPort) {
    const host = cliHost || '127.0.0.1'
    const port = cliPort || '4399'
    return { baseUrl: `${cliProtocol}://${host}:${port}`, timeout, only, verbose }
  }

  // 3. 环境变量
  const envUrl = process.env.TEST_LIVE_60S ||
    process.env.TEST_LIVE_60S_BASE_URL ||
    process.env.SIXTY_S_API_URL ||
    process.env.BASE_URL

  if (envUrl) {
    return { baseUrl: normalizeUrl(envUrl), timeout, only, verbose }
  }

  // 4. 默认值
  return { baseUrl: 'http://127.0.0.1:4399', timeout, only, verbose }
}

function normalizeUrl(url) {
  let u = url.trim()
  if (!/^https?:\/\//i.test(u)) {
    u = `http://${u}`
  }
  return u.replace(/\/+$/, '')
}

async function runSingleTest(baseUrl, tc, timeout, verbose) {
  const url = `${baseUrl}${tc.path}`
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const cost = Date.now() - start

    if (tc.expectJson === false) {
      if (!res.ok && res.status !== 404) {
        return { ok: false, cost, message: `HTTP ${res.status}` }
      }
      const textOrBuf = await res.arrayBuffer()
      const text = Buffer.from(textOrBuf).toString('utf-8')
      if (tc.validator) {
        const valRes = tc.validator(text)
        if (valRes !== true) return { ok: false, cost, message: String(valRes) }
      }
      return { ok: true, cost, message: `HTTP ${res.status} (${textOrBuf.byteLength} 字节)` }
    }

    const json = await res.json().catch(() => null)
    if (!json) {
      return { ok: false, cost, message: '返回不是有效 JSON' }
    }

    if (verbose) {
      console.log(`\n  [DEBUG ${tc.name}]`, JSON.stringify(json).slice(0, 160) + '...')
    }

    if (tc.validator) {
      const valRes = tc.validator(json, res.status)
      if (valRes !== true) {
        return { ok: false, cost, message: String(valRes) }
      }
    } else {
      if (json.code !== 200) {
        return { ok: false, cost, message: `code ${json.code}: ${json.message || '未知业务错误'}` }
      }
    }

    return { ok: true, cost, message: `code ${json.code || res.status}` }
  } catch (err) {
    const cost = Date.now() - start
    const errMsg = err.name === 'AbortError' ? `超时 (${timeout}ms)` : err.message
    return { ok: false, cost, message: errMsg }
  }
}

async function main() {
  const options = resolveOptions()
  console.log(`\n======================================================`)
  console.log(`🚀 60s API 健康与功能巡检`)
  console.log(`🎯 目标地址: ${options.baseUrl}`)
  console.log(`⏱️ 超时阈值: ${options.timeout}ms`)
  if (options.only) console.log(`🔍 过滤用例: ${options.only.join(', ')}`)
  console.log(`======================================================\n`)

  const cases = options.only
    ? TEST_CASES.filter((tc) => options.only.includes(tc.name.toLowerCase()))
    : TEST_CASES

  if (cases.length === 0) {
    console.error(`❌ 未找到匹配的测试用例。可选用例: ${TEST_CASES.map((t) => t.name).join(', ')}`)
    process.exit(1)
  }

  let passed = 0
  let failed = 0
  let totalCost = 0

  for (const tc of cases) {
    process.stdout.write(`  • [${tc.name}] ${tc.desc} (${tc.path}) ... `)
    const result = await runSingleTest(options.baseUrl, tc, options.timeout, options.verbose)
    totalCost += result.cost

    if (result.ok) {
      passed++
      console.log(`\x1b[32mPASS\x1b[0m (${result.cost}ms) [${result.message}]`)
    } else {
      failed++
      console.log(`\x1b[31mFAIL\x1b[0m (${result.cost}ms) -> \x1b[33m${result.message}\x1b[0m`)
    }
  }

  const total = cases.length
  const avgCost = Math.round(totalCost / total)
  const passRate = ((passed / total) * 100).toFixed(1)

  console.log(`\n------------------------------------------------------`)
  console.log(`📊 统计报告:`)
  console.log(`  - 目标: ${options.baseUrl}`)
  console.log(`  - 总测试数: ${total}`)
  console.log(`  - 通过: \x1b[32m${passed}\x1b[0m`)
  console.log(`  - 失败: ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '0'}`)
  console.log(`  - 成功率: ${passed === total ? '\x1b[32m' : '\x1b[33m'}${passRate}%\x1b[0m`)
  console.log(`  - 平均耗时: ${avgCost}ms`)
  console.log(`------------------------------------------------------\n`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('运行异常:', err)
  process.exit(1)
})
