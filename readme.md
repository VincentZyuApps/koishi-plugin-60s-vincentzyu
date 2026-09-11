# 📰 koishi-plugin-60s-vincentzyu

[![npm](https://img.shields.io/npm/v/koishi-plugin-60s-vincentzyu?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-60s-vincentzyu)

对接 [60s](https://github.com/vikiboss/60s) 开放 API 的 Koishi 插件喵。它提供每日早报、热榜、天气、汇率、娱乐资讯和常用小工具，并支持纯文本、Puppeteer 卡片图与 QQ 官方 Bot Markdown 渲染喵。

## 安装

在 Koishi 插件市场搜索 `60s-vincentzyu`，或在工作区中安装：

```bash
yarn add koishi-plugin-60s-vincentzyu
```

插件需要 Koishi 的 `http` 服务喵。若要生成卡片图，请同时安装并启用 `koishi-plugin-puppeteer` 喵。

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
| `renderModePriority` | `RenderPriorityEntry[]` | `general-auto` | 渲染优先级表，表格从上到下依次尝试，重复项只取首次出现的位置 |
| `renderModePriority[].mode` | `qq-auto` / `general-auto` / `text` / `image` / `qq-markdown` | `general-auto` | `qq-auto` 为 QQ 官方 Bot 优先 Markdown；`general-auto` 为列表优先图片、单条文本；`text` 始终文本；`image` 强制图片；`qq-markdown` 仅 QQ 官方 Bot |
| `renderModePriority[].enabled` | `boolean` | `true` | 是否参与优先级选择 |
| `enableQuote` | `boolean` | `true` | 是否引用触发命令的消息 |
| `enableWaitingHint` | `boolean` | `true` | 是否发送并自动撤回“获取中”提示 |

每条指令都可附加 `-m image`、`-m text` 等方式临时优先尝试某种渲染模式；该方式不可用时会继续按配置表回退喵。

### 🤖 QQ 官方 Bot Markdown

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enableQQMarkdown` | `boolean` | `false` | 是否启用 QQ 官方 Bot 原生 Markdown |
| `qqMarkdownKeyboardJson` | `string` | 内置“再来一次 / 帮助”键盘 JSON | QQ Markdown 按钮配置，支持 `${command}` 变量 |
| `qqMarkdownButtonMode` | `string[]` | `['append-qq-markdown']` | 按钮发送位置：`standalone`、`append-qq-markdown`、`append-puppeteer-image`，可多选 |

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

`npm-lxgw` 使用插件随附的霞鹜文楷且不联网喵。`release-lxgw` 会在首次使用时从 Gitee / GitHub Release 下载等宽版到 Koishi 根目录 `data/fonts` 喵。所选字体不可用时截图会报错，不会静默改用其他字体喵。

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
```

更多参数可使用 `60s.xxx --help` 查看喵。

## 测试

测试命令、真实 API 冒烟和全指令文本/截图验收说明见 [test/README.md](./test/README.md) 喵。真实验收会写入被 Git 忽略的 `output/runs/`，每轮都有可直接查看的文本、图片与 Markdown 报告喵。
