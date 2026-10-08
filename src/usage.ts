const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC'

export const usage = `
<style>
  .s60s-usage {
    --bg: #ffffff;
    --text: #24292f;
    --muted: #57606a;
    --border: #d0d7de;
    --accent: #0969da;
    --accent-bg: #ddf4ff;
    --accent-text: #0969da;
    --code-bg: #f6f8fa;
    --code-text: #1f2328;
    --header-bg: #f6f8fa;
    --hover-bg: #f3f4f6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: var(--text);
    line-height: 1.6;
    background: var(--bg);
    border-radius: 12px;
    padding: 16px 20px;
  }
  @media (prefers-color-scheme: dark) {
    .s60s-usage {
      --bg: #0d1117;
      --text: #c9d1d9;
      --muted: #8b949e;
      --border: #30363d;
      --accent: #58a6ff;
      --accent-bg: rgba(56, 139, 253, 0.15);
      --accent-text: #58a6ff;
      --code-bg: #161b22;
      --code-text: #e6edf3;
      --header-bg: #161b22;
      --hover-bg: #161b22;
    }
  }
  .s60s-usage h1 {
    color: var(--accent);
    font-size: 22px;
    margin: 4px 0 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .s60s-usage h2 {
    color: var(--text);
    font-size: 17px;
    margin: 20px 0 10px;
  }
  .s60s-usage p { margin: 6px 0; color: var(--text); }
  .s60s-usage a { color: var(--accent); text-decoration: none; }
  .s60s-usage a:hover { text-decoration: underline; }
  .s60s-usage code {
    background: var(--code-bg);
    color: var(--code-text);
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }
  .s60s-usage details {
    border: 1px solid var(--border);
    border-radius: 8px;
    margin: 10px 0;
    background: var(--bg);
    overflow: hidden;
  }
  .s60s-usage details summary {
    cursor: pointer;
    padding: 10px 14px;
    font-weight: 600;
    font-size: 15px;
    color: var(--text);
    background: var(--header-bg);
    user-select: none;
    border-bottom: 1px solid var(--border);
  }
  .s60s-usage details[open] summary { border-bottom: 1px solid var(--border); }
  .s60s-usage details summary:hover { background: var(--hover-bg); }
  .s60s-usage details .group-body { padding: 8px 14px; }
  .s60s-usage table { border-collapse: collapse; width: 100%; font-size: 14px; }
  .s60s-usage th, .s60s-usage td {
    text-align: left;
    padding: 7px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    color: var(--text);
  }
  .s60s-usage th { color: var(--muted); font-weight: 600; font-size: 13px; }
  .s60s-usage tr:last-child td { border-bottom: none; }
  .s60s-usage tr:hover td { background: var(--hover-bg); }
  .s60s-usage .cmd {
    white-space: nowrap;
    color: var(--accent-text);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 13px;
  }
  .s60s-usage ul { margin: 6px 0; padding-left: 22px; color: var(--text); }
  .s60s-usage li { margin: 4px 0; }
  .s60s-usage li b { color: var(--accent); font-weight: 600; }
</style>

<div class="s60s-usage">
<h1>📰 60s API 插件</h1>
<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-60s-vincentzyu" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-60s-vincentzyu?style=flat-square&logo=npm" alt="npm version">
  </a>
  <a href="https://npm-stat.com/charts.html?package=koishi-plugin-60s-vincentzyu" target="_blank">
    <img src="https://img.shields.io/npm/dm/koishi-plugin-60s-vincentzyu?style=flat-square&logo=npm" alt="npm downloads">
  </a>
  <br>
  <a href="https://github.com/VincentZyuApps/koishi-plugin-60s-vincentzyu" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-60s-vincentzyu" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <br>
  <a href="https://forum.koishi.xyz/t/topic/13724" target="_blank">
    <img src="https://img.shields.io/badge/Koishi%20Forum-13724-5546A3?style=for-the-badge&logo=${KOISHI_LOGO_BASE64}&logoColor=white" alt="Koishi Forum">
  </a>
  <a href="https://qm.qq.com/q/ZHj33L5cuC" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
  </a>
  <br>
</p>

<h2>💬 交流反馈</h2>
<p>🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加群：</p>
<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b>   🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

<p>对接 <a href="https://github.com/vikiboss/60s">60s 开放 API</a>，提供早报、热榜、天气、翻译、娱乐等常用功能。根命令为 <code>60s</code>，所有子命令以 <code>60s.xxx</code> 形式触发。</p>

<h2>⚙️ 配置</h2>
<ul>
  <li><b>baseUrl</b>：60s API 地址，默认 <code>http://127.0.0.1:4399</code>；使用远端服务时请自行填写可用实例</li>
  <li><b>上游仓库</b>：<a href="https://github.com/vikiboss/60s">https://github.com/vikiboss/60s</a></li>
  <li><b>renderPreset</b>：选择通用预设、QQ 官方 Bot 预设或逐命令严格自定义</li>
  <li><b>enableOutputFallback</b>：选择的形式不可用时是否自动降级回退（如卡片/Markdown 失败降级文本），默认开启；关闭时严格报错</li>
  <li><b>QQ 官方 Bot Markdown</b>：QQ 官方 Bot 预设中的列表原生 Markdown，按钮发送方式可单选</li>
  <li><b>Puppeteer 卡片图</b>：安装 koishi-plugin-puppeteer 后可渲染精美卡片图</li>
  <li><b>enableSchedule</b>：定时任务总开关，默认关闭，开启后才会注册并运行后台调度</li>
  <li><b>定时任务</b>：按固定 GMT 偏移执行完整 Koishi 指令，并独立指定 platform / selfId / channelId</li>
  <li><b>--mode / -m</b>：每条命令可临时优先尝试输出方式（text / card / image / qq-markdown）</li>
</ul>

<details>
  <summary>🖥️ 三种输出预设</summary>
  <div class="group-body">
  <p><code>general</code>（默认）按内容类型选择输出；列表卡片依赖 <code>koishi-plugin-puppeteer</code>，不可用时会回退文本。<code>qq-official</code> 在 QQ 官方 Bot 的列表优先原生 Markdown，其他平台按通用预设。<code>custom</code> 严格使用配置项中每条规范命令的选择，不可用时会报错而不降级。</p>
  <table>
    <tr><th>内容类型</th><th>默认输出</th><th>指令</th></tr>
    <tr><td>列表 / 数据汇总</td><td>Puppeteer 卡片图</td><td>早报、历史、热榜、天气、汇率、油价、金价、摸鱼、IT、AI、黑客新闻、歌词、IP、密码、密码校验、健康、猫眼、酷安</td></tr>
    <tr><td>单条内容</td><td>纯文本</td><td>一言、段子、笑话、发病、答案、运势、百科、翻译</td></tr>
    <tr><td>原始图片</td><td>直接发送图片</td><td>早报 <code>-i</code>、二维码、QQ（有头像时）</td></tr>
    <tr><td>早报无截图回退</td><td>官方早报图</td><td>早报有官方图且 Puppeteer 不可用时；官方图也不可用才发送文本</td></tr>
  </table>
  <p>可附加 <code>-m text</code> 临时读取列表文本，或用 <code>-m card</code> 让单条内容优先尝试截图。二维码与 QQ 资料在自定义模式可选择直接图片、嵌图卡片或文本提示。</p>
  </div>
</details>

<details>
  <summary>📊 预设对比：通用预设 vs QQ 官方 Bot 预设</summary>
  <div class="group-body">
  <p>下表展示 <code>general</code>（通用预设）与 <code>qq-official</code>（QQ 官方 Bot 预设）在不同环境下的实际输出形式：</p>
  <table>
    <tr><th>指令 / 内容类型</th><th>📱 通用预设 (general)</th><th>🤖 QQ 预设 (qq-official) [QQ 官方 Bot]</th><th>🤖 QQ 预设 (qq-official) [其他平台]</th></tr>
    <tr><td>📰 早报、历史、IT、AI、黑客新闻</td><td>Puppeteer 卡片图 <i>(无 Puppeteer 回退纯文本)</i></td><td>QQ 原生 Markdown <i>(带按钮，发送失败降级卡片图/文本)</i></td><td>Puppeteer 卡片图 <i>(自动按通用预设处理)</i></td></tr>
    <tr><td>🔥 热搜榜 (微博/B站/知乎/抖音/百度等)</td><td>Puppeteer 卡片图 <i>(无 Puppeteer 回退纯文本)</i></td><td>QQ 原生 Markdown <i>(带按钮，发送失败降级卡片图/文本)</i></td><td>Puppeteer 卡片图 <i>(自动按通用预设处理)</i></td></tr>
    <tr><td>🌤️ 天气、汇率、油价、金价</td><td>Puppeteer 卡片图 <i>(无 Puppeteer 回退纯文本)</i></td><td>QQ 原生 Markdown <i>(带按钮，发送失败降级卡片图/文本)</i></td><td>Puppeteer 卡片图 <i>(自动按通用预设处理)</i></td></tr>
    <tr><td>🐟 摸鱼人日历、健康、猫眼、酷安</td><td>Puppeteer 卡片图 <i>(无 Puppeteer 回退纯文本)</i></td><td>QQ 原生 Markdown <i>(带按钮，发送失败降级卡片图/文本)</i></td><td>Puppeteer 卡片图 <i>(自动按通用预设处理)</i></td></tr>
    <tr><td>🎵 歌词、IP 查询、密码、密码校验</td><td>Puppeteer 卡片图 <i>(无 Puppeteer 回退纯文本)</i></td><td>QQ 原生 Markdown <i>(带按钮，发送失败降级卡片图/文本)</i></td><td>Puppeteer 卡片图 <i>(自动按通用预设处理)</i></td></tr>
    <tr><td>💬 一言、段子、笑话、发病、运势、答案</td><td>纯文本 <i>(可用 <code>-m card</code> 优先尝试卡片)</i></td><td>纯文本 <i>(可用 <code>-m card</code> 优先尝试卡片)</i></td><td>纯文本 <i>(可用 <code>-m card</code> 优先尝试卡片)</i></td></tr>
    <tr><td>📚 百科、🈶 翻译</td><td>纯文本</td><td>纯文本</td><td>纯文本</td></tr>
    <tr><td>🖼️ 早报 <code>-i</code> (官方原图)</td><td>直接发送图片</td><td>直接发送图片</td><td>直接发送图片</td></tr>
    <tr><td>🔳 二维码、👤 QQ 资料</td><td>直接发送图片</td><td>直接发送图片</td><td>直接发送图片</td></tr>
  </table>
  <p>💡 <b>提示</b>：QQ 官方 Bot 原生 Markdown 发送失败时会自动按通用预设尝试回退；而 <code>custom</code>（自定义模式）则严格按单选项输出，格式不可用时会返回具体报错而不降级。</p>
  </div>
</details>

<details>
  <summary>⏰ 定时任务与主动推送</summary>
  <div class="group-body">
  <p>需开启 <code>enableSchedule</code> 总开关且在配置表中启用对应行，插件才会按五段式 Cron 在 <code>scheduleTimezoneGmtOffset</code> 指定的 GMT 偏移执行。每行必须填写完整指令与 <code>platform</code>、<code>selfId</code>、<code>channelId</code>，任务会使用目标 Bot 的主动 Session 调用 <code>session.execute()</code>。</p>
  <p>默认提供每日早报、上海天气、历史上的今天、B 站热搜和 IT 之家热榜五条禁用示例。连续失败 3 次仅提醒目标一次；任意成功即重置计数。管理员可执行 <code>60s.定时任务状态</code> 或 <code>60s.定时任务执行</code>，Console 插件详情也提供状态和立即执行按钮。</p>
  </div>
</details>

<h2>📌 命令分类</h2>

<details open>
  <summary>📰 早报 / 资讯</summary>
  <div class="group-body">
  <table>
    <tr><th>命令</th><th>说明</th></tr>
    <tr><td class="cmd">60s.早报 [-i]</td><td>每日早报，<code>-i</code> 直接发官方图片</td></tr>
    <tr><td class="cmd">60s.历史</td><td>历史上的今天</td></tr>
    <tr><td class="cmd">60s.IT</td><td>IT 之家资讯</td></tr>
    <tr><td class="cmd">60s.AI</td><td>AI 资讯</td></tr>
    <tr><td class="cmd">60s.黑客新闻</td><td>Hacker News（alias: <code>60s.hn</code>）</td></tr>
  </table>
  </div>
</details>

<details>
  <summary>🔥 热搜榜</summary>
  <div class="group-body">
  <table>
    <tr><th>命令</th><th>说明</th></tr>
    <tr><td class="cmd">60s.热榜 [平台]</td><td>热搜榜，平台：微博/bili/知乎/抖音/头条/百度/夸克/小红书/懂车帝/HN/IT</td></tr>
  </table>
  </div>
</details>

<details>
  <summary>🌤️ 天气 / 行情</summary>
  <div class="group-body">
  <table>
    <tr><th>命令</th><th>说明</th></tr>
    <tr><td class="cmd">60s.天气 &lt;城市&gt; [-d N]</td><td>实时天气，<code>-d 7</code> 看 7 天预报</td></tr>
    <tr><td class="cmd">60s.汇率 [币种]</td><td>实时汇率</td></tr>
    <tr><td class="cmd">60s.油价 [地区]</td><td>今日油价</td></tr>
    <tr><td class="cmd">60s.金价</td><td>黄金价格</td></tr>
  </table>
  </div>
</details>

<details>
  <summary>💬 娱乐 / 单条</summary>
  <div class="group-body">
  <table>
    <tr><th>命令</th><th>说明</th></tr>
    <tr><td class="cmd">60s.一言</td><td>随机一言</td></tr>
    <tr><td class="cmd">60s.段子</td><td>随机段子</td></tr>
    <tr><td class="cmd">60s.笑话</td><td>冷笑话</td></tr>
    <tr><td class="cmd">60s.发病 [名字]</td><td>发病文学</td></tr>
    <tr><td class="cmd">60s.运势</td><td>今日运势</td></tr>
    <tr><td class="cmd">60s.答案</td><td>答案之书</td></tr>
    <tr><td class="cmd">60s.摸鱼</td><td>摸鱼日历/进度</td></tr>
  </table>
  </div>
</details>

<details>
  <summary>🛠️ 工具</summary>
  <div class="group-body">
  <table>
    <tr><th>命令</th><th>说明</th></tr>
    <tr><td class="cmd">60s.翻译 &lt;文本&gt;</td><td>中英互译</td></tr>
    <tr><td class="cmd">60s.歌词 &lt;歌名&gt;</td><td>歌词查询</td></tr>
    <tr><td class="cmd">60s.百科 &lt;词条&gt;</td><td>百度百科</td></tr>
    <tr><td class="cmd">60s.二维码 &lt;文本&gt;</td><td>生成二维码</td></tr>
    <tr><td class="cmd">60s.密码 [长度]</td><td>随机密码</td></tr>
    <tr><td class="cmd">60s.密码校验 &lt;密码&gt;</td><td>密码强度检测</td></tr>
    <tr><td class="cmd">60s.IP [ip]</td><td>IP 信息查询</td></tr>
    <tr><td class="cmd">60s.健康 &lt;身高&gt; &lt;体重&gt;</td><td>BMI / BMR / TDEE 计算</td></tr>
    <tr><td class="cmd">60s.猫眼</td><td>猫眼票房</td></tr>
    <tr><td class="cmd">60s.酷安</td><td>酷安热榜</td></tr>
    <tr><td class="cmd">60s.QQ &lt;qq&gt;</td><td>QQ 头像/资料</td></tr>
  </table>
  </div>
</details>

<p>所有命令均有英文 alias（如 <code>60s news</code>、<code>60s weather 成都</code>），发送 <code>60s --help</code> 可查看完整帮助。</p>
</div>
`
