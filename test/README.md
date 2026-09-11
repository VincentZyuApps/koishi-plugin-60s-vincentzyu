# 🧪 测试说明

以下命令均从 Koishi 根目录 `koishi-dev-8` 执行喵。

## 单元测试

运行全部默认测试（不访问真实 API）：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test
```

只运行某一组测试：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test test/utils/font.test.ts
yarn workspace koishi-plugin-60s-vincentzyu test test/render/dispatch.test.ts
yarn workspace koishi-plugin-60s-vincentzyu test test/commands/hot.test.ts
yarn workspace koishi-plugin-60s-vincentzyu test test/scripts/live-output.test.ts
```

## 真实 API 冒烟测试

默认测试不会联网。下面的测试只会对 60s 服务发起 GET 请求，不会修改远端数据喵。

PowerShell：

```powershell
$env:TEST_LIVE_60S = 'http://127.0.0.1:4399'
yarn workspace koishi-plugin-60s-vincentzyu test test/integration/smoke.test.ts
```

Bash：

```bash
TEST_LIVE_60S=http://127.0.0.1:4399 yarn workspace koishi-plugin-60s-vincentzyu test test/integration/smoke.test.ts
```

`TEST_LIVE_60S` 也可以替换为自行部署的远程 60s 地址喵。

## 全指令文本与图片验收

此工具会从当前 `koishi.yml` 读取 `60s-vincentzyu` 的 `baseUrl`，依次验证规范业务指令、根指令和 11 个热榜来源喵。每个可渲染指令均会验证纯文本与强制图片模式；二维码和 QQ 资料会检查其天然图片输出喵。

首次使用时建议通过私有路径文件指定 Chromium，文件首行填写浏览器可执行文件的绝对路径喵：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path-file external/60s-vincentzyu/temp/private/chromium路径.txt
```

直接指定浏览器和 API 地址：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path 'C:\Program Files\Google\Chrome\Application\chrome.exe' --base-url 'http://127.0.0.1:4399'
```

仅重测指定案例（逗号或空格均可分隔）：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path-file external/60s-vincentzyu/temp/private/chromium路径.txt --only daily,weather,qrcode
```

默认情况下，每个图片案例都会生成 Koishi/GitHub 的浅色与深色四张图，文件名格式为 `<案例>--image--<主题>--<明暗>.png` 喵。传入任一主题参数时只生成指定组合，适合局部复测：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path-file external/60s-vincentzyu/temp/private/chromium路径.txt --only daily --image-theme koishi --color-mode dark
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path-file external/60s-vincentzyu/temp/private/chromium路径.txt --only daily --image-theme github --color-mode light
```

使用 JSON 覆盖内置样例参数：

```powershell
yarn workspace koishi-plugin-60s-vincentzyu test:live-output --browser-path-file external/60s-vincentzyu/temp/private/chromium路径.txt --inputs external/60s-vincentzyu/temp/live-inputs.json
```

覆盖文件按稳定案例 ID 合并 `args` 和 `options`，例如：

```json
{
  "weather": { "args": ["北京"] },
  "password": { "args": [20], "options": { "symbols": true } }
}
```

可用的额外参数为 `--base-url`、`--browser-path`、`--browser-path-file`、`--inputs`、`--output-dir`、`--keep-runs`、`--only`、`--image-theme` 与 `--color-mode` 喵。未指定主题参数时，验收脚本会固定生成四套明确配色，保证无头截图可复现喵。

每轮输出位于 `external/60s-vincentzyu/output/runs/<时间戳>/`，包含 `text/`、`images/`、`manifest.json`、`report.json` 和 `report.md` 喵。该目录已在 `.gitignore` 忽略，默认仅保留最近五轮结果喵。
