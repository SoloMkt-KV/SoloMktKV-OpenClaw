# Generator-KV

Generator-KV is an OpenClaw plugin for generating campaign KV images with SoloMkt-KV models. It always fetches the latest model list first, asks the user to choose a model ID, collects the required campaign fields, and then submits a long-running KV generation request with a 10-minute HTTP timeout.

Repository: [https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git](https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git)  
Owner: `SoloMkt-KV`  
Marketplace: `SoloMkt-KV`  
Plugin name: `Generator-KV` (`generator-kv` in manifests)

## English

### Features

- Configure and validate a SoloMkt-KV API key.
- Fetch current public models from `GET /api/v1/models?type=all` before every generation.
- Let the user choose a model by `modelId`.
- Collect required fields: `activityName`, `activityTheme`, `activityTime`, and `activityLocation`.
- Support optional `prompt`, `posterQuality`, and `posterSize`.
- Submit `POST /api/v1/generateKV` with a 10-minute generation timeout and friendly progress text.
- Provide a Codex/OpenClaw skill for natural-language guided use.
- Include marketplace metadata for installation from the `SoloMkt-KV` plugin marketplace.

### API Key Location

The required credential file is:

```text
$SoloMkt-KV_HOME/.credentials.json
```

The file content must be:

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

For shells and devices where environment variables cannot contain `-`, set `SOLOMKT_KV_HOME` instead. If neither variable is set, the helper scripts use `~/.solomkt-kv/.credentials.json`.

Common locations:

| Environment | Recommended path |
|---|---|
| macOS/Linux with `SoloMkt-KV_HOME` | `$SoloMkt-KV_HOME/.credentials.json` |
| macOS/Linux portable fallback | `$SOLOMKT_KV_HOME/.credentials.json` |
| macOS/Linux default | `~/.solomkt-kv/.credentials.json` |
| Windows PowerShell with `SoloMkt-KV_HOME` | `$env:SoloMkt-KV_HOME\\.credentials.json` |
| Windows PowerShell portable fallback | `$env:SOLOMKT_KV_HOME\\.credentials.json` |
| Windows default | `%USERPROFILE%\\.solomkt-kv\\.credentials.json` |
| CI/CD | Set `SOLOMKT_KV_HOME` to a secret-mounted directory, or pass `plugins.entries.generator-kv.config.apiKey` through the host secret mechanism. |
| Containers | Mount a secret volume and set `SOLOMKT_KV_HOME=/run/secrets/solomkt-kv`. |

### Configure API Key

Interactive setup:

```bash
npm install
npm run configure-api-key
```

Non-interactive setup:

```bash
npm run configure-api-key -- YOUR_SOLOMKT_KV_API_KEY
```

The setup command writes `.credentials.json` and validates the key by requesting the model list. If the key is not configured, Generator-KV reminds the user to configure it. In a conversational agent, the user can provide the API key and the plugin can save it automatically through the configuration helper or tool.

### Install From GitHub Source

```bash
git clone https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git
cd SoloMktKV-OpenClaw
npm install
npm run build
```

Add Generator-KV to your project `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "generator-kv": {
        "enabled": true,
        "config": {
          "baseUrl": "https://api.kv.solomarketing.com.cn",
          "generationTimeoutMs": 600000
        }
      }
    }
  }
}
```

You may also put the API key in config, but the local credentials file is preferred:

```json
{
  "plugins": {
    "entries": {
      "generator-kv": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_SOLOMKT_KV_API_KEY",
          "generationTimeoutMs": 600000
        }
      }
    }
  }
}
```

### Install From Plugin Marketplace

This repository includes a marketplace file:

```text
.agents/plugins/marketplace.json
```

Marketplace name:

```text
SoloMkt-KV
```

Install the marketplace, then install the plugin:

```bash
codex plugin marketplace add .agents/plugins
codex plugin add generator-kv@SoloMkt-KV
```

After installation, open a new Codex/OpenClaw thread so the new skill and tools are loaded.

### Use The Plugin

Natural-language example:

```text
Use Generator-KV to create a campaign KV. Activity name: The 4th China International Supply Chain Expo. Theme: Linking the World for a Shared Future. Time: June 22-26, 2026. Location: China International Exhibition Center, Shunyi Hall. Prompt: dark technology style, strong supply chain visual identity.
```

The agent should:

1. Check API key configuration.
2. Call the model list API.
3. Show current models and ask the user to choose one.
4. Collect missing required fields.
5. Submit KV generation.
6. Wait up to 10 minutes and return generated image URLs.

Terminal helper:

```bash
npm run generate-kv
```

### API Details

Model list:

```text
GET https://api.kv.solomarketing.com.cn/api/v1/models?type=all
Header: x-api-key: <apiKey>
```

Generation:

```text
POST https://api.kv.solomarketing.com.cn/api/v1/generateKV
Header: x-api-key: <apiKey>
Timeout: 600000 ms
```

Generation request body:

```json
{
  "modelId": "1001",
  "activityName": "The 4th China International Supply Chain Expo",
  "activityTheme": "Linking the World for a Shared Future",
  "activityTime": "June 22-26, 2026",
  "activityLocation": "China International Exhibition Center, Shunyi Hall",
  "prompt": "Design a technology-driven dark KV visual.",
  "posterQuality": "2K",
  "posterSize": "[\"16:9\"]"
}
```

### Uninstall

From Codex/OpenClaw plugin installation:

```bash
codex plugin remove generator-kv
```

Remove marketplace registration if desired:

```bash
codex plugin marketplace remove SoloMkt-KV
```

Remove local credentials:

```bash
rm -f "$SOLOMKT_KV_HOME/.credentials.json"
rm -f "$HOME/.solomkt-kv/.credentials.json"
```

Windows PowerShell:

```powershell
Remove-Item "$env:SOLOMKT_KV_HOME\.credentials.json" -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.solomkt-kv\.credentials.json" -ErrorAction SilentlyContinue
```

### Troubleshooting

| Problem | Fix |
|---|---|
| API key is missing | Run `npm run configure-api-key` or create `.credentials.json`. |
| Model list fails with 401/403 | Check whether the API key is correct and active. |
| No model is available | Retry later or contact SoloMkt-KV support. |
| Generation times out | The plugin HTTP timeout is 10 minutes. If the host has a shorter outer tool timeout, run `npm run generate-kv` or increase the host plugin/tool timeout. |
| Invalid `modelId` | The plugin must fetch models again and ask the user to choose from the current list. |

## 中文

### 插件介绍

Generator-KV 是一个用于生成活动主视觉 KV 图片的 OpenClaw 插件。插件会在每次生成前先调用模型列表接口，展示当前可用模型并让用户选择 `modelId`，再收集活动名称、活动主题、活动时间、活动地点等必填信息，最后调用 KV 生成接口。生成接口耗时可能较久，插件内置 10 分钟 HTTP 超时，并会给用户友好的等待提示。

### 功能

- 配置并校验 SoloMkt-KV API Key。
- 每次生成前调用 `GET /api/v1/models?type=all` 获取最新模型。
- 让用户基于模型列表选择 `modelId`。
- 收集必填字段：`activityName`、`activityTheme`、`activityTime`、`activityLocation`。
- 支持可选字段：`prompt`、`posterQuality`、`posterSize`。
- 调用 `POST /api/v1/generateKV` 生成 KV 图片，默认等待 10 分钟。
- 提供自然语言对话式 Skill，引导用户完成配置、校验和生成。
- 支持通过 `SoloMkt-KV` 插件市场安装。

### API Key 安装地址

要求的凭证文件位置为：

```text
$SoloMkt-KV_HOME/.credentials.json
```

文件内容：

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

由于部分系统或 Shell 对带 `-` 的环境变量支持不好，插件脚本也支持 `SOLOMKT_KV_HOME`。如果未设置环境变量，默认使用 `~/.solomkt-kv/.credentials.json`。

不同环境和设备中的推荐地址：

| 环境 | 推荐地址 |
|---|---|
| macOS/Linux，设置了 `SoloMkt-KV_HOME` | `$SoloMkt-KV_HOME/.credentials.json` |
| macOS/Linux，兼容写法 | `$SOLOMKT_KV_HOME/.credentials.json` |
| macOS/Linux，默认地址 | `~/.solomkt-kv/.credentials.json` |
| Windows PowerShell，设置了 `SoloMkt-KV_HOME` | `$env:SoloMkt-KV_HOME\\.credentials.json` |
| Windows PowerShell，兼容写法 | `$env:SOLOMKT_KV_HOME\\.credentials.json` |
| Windows 默认地址 | `%USERPROFILE%\\.solomkt-kv\\.credentials.json` |
| CI/CD | 将 `SOLOMKT_KV_HOME` 指向密钥挂载目录，或通过宿主的 Secret 机制传入 `plugins.entries.generator-kv.config.apiKey`。 |
| 容器 | 挂载 Secret 卷，并设置 `SOLOMKT_KV_HOME=/run/secrets/solomkt-kv`。 |

### 配置 API Key

交互式配置：

```bash
npm install
npm run configure-api-key
```

非交互式配置：

```bash
npm run configure-api-key -- YOUR_SOLOMKT_KV_API_KEY
```

配置脚本会写入 `.credentials.json`，并自动调用模型列表接口进行校验。若用户未配置 API Key，插件使用时会提醒用户配置；用户也可以直接在对话中提供 API Key，由插件协助写入凭证文件并自动校验。

### 从 GitHub 源码安装

```bash
git clone https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git
cd SoloMktKV-OpenClaw
npm install
npm run build
```

在项目的 `openclaw.json` 中添加插件：

```json
{
  "plugins": {
    "entries": {
      "generator-kv": {
        "enabled": true,
        "config": {
          "baseUrl": "https://api.kv.solomarketing.com.cn",
          "generationTimeoutMs": 600000
        }
      }
    }
  }
}
```

也可以把 API Key 写入宿主配置，但更推荐使用本地凭证文件：

```json
{
  "plugins": {
    "entries": {
      "generator-kv": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_SOLOMKT_KV_API_KEY",
          "generationTimeoutMs": 600000
        }
      }
    }
  }
}
```

### 通过插件市场安装

本仓库包含插件市场文件：

```text
.agents/plugins/marketplace.json
```

插件市场名称：

```text
SoloMkt-KV
```

安装市场并安装插件：

```bash
codex plugin marketplace add .agents/plugins
codex plugin add generator-kv@SoloMkt-KV
```

安装完成后，请开启新的 Codex/OpenClaw 会话，以便加载新的 Skill 和工具。

### 插件使用

自然语言示例：

```text
请用 Generator-KV 生成活动主视觉。活动名称：第四届中国国际供应链促进博览会。活动主题：链接世界，共创未来。活动时间：2026年6月22日—26日。活动地点：中国国际展览中心（顺义馆）。补充要求：科技感强、深色背景、体现供应链展会主视觉。
```

插件或代理应执行以下步骤：

1. 检查 API Key 是否已配置。
2. 调用模型列表接口。
3. 展示当前模型并让用户选择模型。
4. 收集缺失的必填字段。
5. 提交 KV 生成请求。
6. 最长等待 10 分钟，并返回生成的图片链接。

终端辅助方式：

```bash
npm run generate-kv
```

### 接口信息

模型列表：

```text
GET https://api.kv.solomarketing.com.cn/api/v1/models?type=all
Header: x-api-key: <apiKey>
```

生成 KV：

```text
POST https://api.kv.solomarketing.com.cn/api/v1/generateKV
Header: x-api-key: <apiKey>
Timeout: 600000 ms
```

请求体示例：

```json
{
  "modelId": "1001",
  "activityName": "第四届中国国际供应链促进博览会",
  "activityTheme": "链接世界，共创未来",
  "activityTime": "2026年6月22日—26日",
  "activityLocation": "中国国际展览中心（顺义馆）",
  "prompt": "设计一张科技感强、深色背景的供应链展会主视觉KV",
  "posterQuality": "2K",
  "posterSize": "[\"16:9\"]"
}
```

### 卸载

卸载插件：

```bash
codex plugin remove generator-kv
```

如需移除插件市场：

```bash
codex plugin marketplace remove SoloMkt-KV
```

移除本地凭证：

```bash
rm -f "$SOLOMKT_KV_HOME/.credentials.json"
rm -f "$HOME/.solomkt-kv/.credentials.json"
```

Windows PowerShell：

```powershell
Remove-Item "$env:SOLOMKT_KV_HOME\.credentials.json" -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.solomkt-kv\.credentials.json" -ErrorAction SilentlyContinue
```

### 常见问题

| 问题 | 处理方式 |
|---|---|
| 未配置 API Key | 运行 `npm run configure-api-key`，或创建 `.credentials.json`。 |
| 模型列表返回 401/403 | 检查 API Key 是否正确、有效。 |
| 没有可用模型 | 稍后重试，或联系 SoloMkt-KV 支持。 |
| 生成超时 | 插件 HTTP 超时为 10 分钟；如果宿主外层工具超时更短，可使用 `npm run generate-kv` 或调整宿主工具超时。 |
| `modelId` 无效 | 必须重新获取模型列表，并让用户从当前列表中选择。 |
