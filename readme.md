# 📰 koishi-plugin-60s-vincentzyu

[![npm](https://img.shields.io/npm/v/koishi-plugin-60s-vincentzyu?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-60s-vincentzyu)

对接 [60s](https://github.com/vikiboss/60s) 开放 API 的 Koishi 插件。它提供每日早报、热榜、天气、汇率、娱乐资讯和常用小工具，并支持纯文本、Puppeteer 卡片图与 QQ 官方 Bot Markdown 输出。

## 安装

在 Koishi 插件市场搜索 `60s-vincentzyu`，或在 Koishi 根目录执行：

```bash
yarn add koishi-plugin-60s-vincentzyu
npm install koishi-plugin-60s-vincentzyu
```

插件需要 Koishi 的 `http` 服务。若要生成卡片图，请同时安装并启用 `koishi-plugin-puppeteer`。

## 基础配置

### ⚙️ 基础

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `http://127.0.0.1:4399` | 60s API 地址，请填写自行部署或确认可用的服务地址 |
| `timeout` | `number` | `15000` | API 请求超时，单位毫秒 |
| `commandPrefix` | `string` | `60s` | 指令前缀，例如 `60s.天气 上海` |

### 🎨 渲染

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `renderPreset` | `general` / `qq-official` / `custom` | `general` | 全局输出预设；通用、QQ 官方 Bot 或逐命令严格自定义 |
| `customCommandOutput.<命令>` | `text` / `card` / `image` / `qq-markdown` | 按命令类型 | 仅 `custom` 生效；每条规范命令以控制台单选项配置，格式不可用时严格报错 |
| `enableQuote` | `boolean` | `true` | 是否引用触发命令的消息 |
| `enableWaitingHint` | `boolean` | `true` | 是否发送并自动撤回“获取中”提示 |

每条指令都可附加 `-m text|card|image|qq-markdown` 临时优先尝试一种输出；不可用时回到当前预设。

## 输出预设

`general` 是默认预设：列表优先 Puppeteer 卡片图，单条内容优先文本，天然图片直接发送。卡片图不可用时会回退文本；早报有官方图时优先使用该图回退。

`qq-official` 仅对 QQ 官方 Bot 生效：列表优先 QQ 原生 Markdown，无法发送时按 `general` 处理；其他平台始终按 `general` 处理。

`custom` 使用“自定义指令输出”中的逐命令单选。所选输出不可用时不会降级，而会向会话返回简洁错误并在控制台记录详细原因。

| 内容类型 | 默认输出 | 指令 |
| --- | --- | --- |
| 列表 / 数据汇总 | Puppeteer 卡片图 | `早报`、`历史`、`热榜`、`天气`、`汇率`、`油价`、`金价`、`摸鱼`、`IT`、`AI`、`黑客新闻`、`歌词`、`IP`、`密码`、`密码校验`、`健康`、`猫眼`、`酷安` |
| 单条内容 | 纯文本 | `一言`、`段子`、`笑话`、`发病`、`答案`、`运势`、`百科`、`翻译` |
| 原始图片 | 直接发送图片 | `早报 -i`（官方早报图）、`二维码`、`QQ`（有头像时） |
| 早报的无截图回退 | 直接发送官方早报图 | `早报`：有官方图且 Puppeteer 不可用时；官方图也不可用才回退文本 |

可通过 `-m text` 临时读取列表文本，或用 `-m card` 让单条内容优先尝试截图卡片。二维码和 QQ 资料在自定义模式可选直接图片、嵌图卡片或文本提示。

### 🤖 QQ 官方 Bot Markdown

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `qqMarkdownKeyboardJson` | `string` | 内置“再来一次 / 帮助”键盘 JSON | QQ Markdown 按钮配置，支持 `${command}` 变量 |
| `qqMarkdownButtonMode` | `none` / `standalone` / `append-to-markdown` | `append-to-markdown` | 不发按钮、单独发按钮或附在 QQ Markdown 中 |

### 🖼️ Puppeteer 卡片图

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `imageType` | `png` / `jpeg` / `webp` | `png` | 截图图片格式；PNG 不支持质量参数 |
| `screenshotQuality` | `number` | `88` | JPEG / WEBP 截图质量，范围 1-100 |
| `imageWidth` | `number` | `760` | 卡片宽度，范围 480-1600 px |
| `imageTheme` | `koishi` / `github` | `github` | Puppeteer 卡片图主题风格 |
| `colorMode` | `light` / `dark` / `system` | `system` | 卡片图明暗模式；`system` 跟随 Chromium 的色彩偏好 |
| `fontMode` | `npm-lxgw` / `release-lxgw` / `custom-path` / `system-default` | `npm-lxgw` | 所有 Puppeteer 卡片的字体来源 |
| `customFontPath` | `string` | `''` | 选择 `custom-path` 时使用的字体绝对路径，支持 TTF / OTF / WOFF / WOFF2 |

`npm-lxgw` 使用插件随附的霞鹜文楷且不联网。`release-lxgw` 会在首次使用时从 Gitee / GitHub Release 下载等宽版到 Koishi 根目录 `data/fonts`。所选字体不可用时截图会报错，不会静默改用其他字体。

### ⏰ 定时任务

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `scheduleTimezoneGmtOffset` | `number` | `8` | Cron 使用的 GMT 偏移，范围 `-12` 至 `14`，默认 GMT+8 |
| `scheduledTasks` | `ScheduledTaskConfig[]` | 5 条禁用示例 | 通用主动推送任务表 |
| `scheduledTasks[].name` | `string` | 示例任务名 | 任务显示名称 |
| `scheduledTasks[].command` | `string` | 示例 60s 指令 | 通过目标 Bot 的 `session.execute()` 执行的完整 Koishi 指令 |
| `scheduledTasks[].cron` | `string` | 如 `0 8 * * *` | 五段 Cron：分、时、日、月、星期 |
| `scheduledTasks[].platform/selfId/channelId` | `string` | 空 | 目标 Bot 平台、Bot ID 与频道/群号；三项均必填 |
| `scheduledTasks[].enabled` | `boolean` | `false` | 启用后才注册；字段固定在表格最右侧 |

默认预置但不启用：每日早报、上海天气、历史上的今天、B 站热搜、IT 之家热榜，时间依次为每天 08:00 至 08:20。任务失败仅写日志；同一任务连续失败 3 次时向目标发送一次简短提醒，任意成功会清零。

管理员可执行 `60s.定时任务状态` 查看运行状态，或执行 `60s.定时任务执行` 立即运行全部已启用任务。启用 Koishi Console 后，插件详情也提供“刷新状态”和“立即执行全部启用任务”按钮；后者会真实发送消息并要求确认。

### 🔍 调试

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `verboseConsoleLog` | `boolean` | `false` | 输出请求 URL、状态码、耗时和响应摘要等调试日志 |

## 常用命令

```text
60s                 查看插件入口与常用指令
60s.早报            每日早报
60s.热榜 weibo      热榜，也可使用 60s.热榜.weibo
60s.天气 上海       实时天气
60s.汇率 USD        汇率
60s.油价 上海       油价
60s.翻译 Hello      翻译
60s.百科 Koishi     百科
60s.二维码 https://github.com/vikiboss/60s
60s.密码 16 -s      生成含符号密码
60s.定时任务状态     查看定时任务状态（管理员）
60s.定时任务执行     立即执行全部启用任务（管理员）
```

更多参数可使用 `60s.xxx --help` 查看。

## 测试

测试命令、真实 API 冒烟和全指令文本/截图验收说明见 [test/README.md](./test/README.md)。真实验收会写入被 Git 忽略的 `output/runs/`，每轮都有可直接查看的文本、图片与 Markdown 报告。
