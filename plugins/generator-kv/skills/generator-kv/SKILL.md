---
name: generator-kv
description: Install, configure, verify, and guide first use of the Generator-KV OpenClaw plugin for activity KV/key visual poster generation. Use when a user asks OpenClaw to install or set up this KV poster plugin from GitHub, configure SoloMkt-KV API credentials, list available KV models, generate an activity KV poster, troubleshoot this plugin, or provides this SKILL.md link as the plugin setup guide.
---

# Generator-KV OpenClaw Install Guide

Use this guide to install the Generator-KV plugin from GitHub source or the SoloMkt-KV plugin marketplace, configure credentials, verify the setup, and complete the user's first activity KV poster generation.

## Plugin Identity

- Plugin ID: `generator-kv`
- Display name: `Generator-KV`
- Repository: `https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git`
- Git clone URL: `https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git`
- Owner: `SoloMkt-KV`
- Marketplace name: `SoloMkt-KV`
- Marketplace file: `.agents/plugins/marketplace.json`
- Entry file: `index.js`
- Manifest file: `openclaw.plugin.json`
- OpenClaw plugin API compatibility: `>=2026.3.24-beta.2`
- Default SoloMkt-KV API base URL: `https://kv.solomarketing.com.cn`
- Generation timeout: `600000` ms (10 minutes)
- Tools exposed by the plugin: `list_models`, `generate_image`

Treat the installed plugin code and `openclaw.plugin.json` as the runtime authority. This document is an installation and interaction guide, not a replacement for the plugin implementation.

## Setup Goal

When the user provides this document or asks to install the KV poster plugin, do not stop after installation. Continue through configuration, verification, and a first-use walkthrough unless the user explicitly asks to pause.

The setup is complete only when one of these outcomes is reached:

- The plugin is installed, the API Key is configured, `list_models` succeeds, and the user understands how to start generating KV posters.
- The plugin is installed and configured, and a first `generate_image` request has returned generated image URLs.
- A concrete blocker is reported, such as Git clone failure, missing API Key, failed authentication, network timeout, or invalid SoloMkt-KV response.

## Installation Workflow

### Install From GitHub Source

This plugin is published on GitHub. When a user asks to install it from this document or gives the repository URL, use GitHub as the installation source.

First clone and build the plugin:

```bash
git clone https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git
cd SoloMktKV-OpenClaw
npm install
npm run build
```

Then add Generator-KV to your project `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "generator-kv": {
        "enabled": true,
        "config": {
          "baseUrl": "https://kv.solomarketing.com.cn",
          "generationTimeoutMs": 600000
        }
      }
    }
  }
}
```

### Install From Plugin Marketplace

This repository also includes a marketplace file at `.agents/plugins/marketplace.json` for marketplace-based installation:

```bash
codex plugin marketplace add .agents/plugins
codex plugin add generator-kv@SoloMkt-KV
```

After installation, open a new Codex/OpenClaw thread so the new skill and tools are loaded.

### Verify Runtime Registration

After install, verify the plugin is registered:

```bash
openclaw plugins inspect generator-kv --runtime --json
```

The runtime verification should show the plugin and its tools, especially `list_models` and `generate_image`. After installation and runtime verification, tell the user that the plugin is installed and continue with API Key configuration.

If installation fails, report the actual error and the attempted command. Do not switch to an alternate install source unless the user explicitly wants an alternate install path.

## Configuration Workflow

### API Key Configuration

The required credential file is:

```
$SoloMkt-KV_HOME/.credentials.json
```

The file content must be:

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

For shells and devices where environment variables cannot contain `-`, set `SOLOMKT_KV_HOME` instead. If neither variable is set, the helper scripts use `~/.solomkt-kv/.credentials.json`.

Common credential file locations:

| Environment | Recommended path |
| --- | --- |
| macOS/Linux with SoloMkt-KV_HOME | $SoloMkt-KV_HOME/.credentials.json |
| macOS/Linux portable fallback | $SOLOMKT_KV_HOME/.credentials.json |
| macOS/Linux default | ~/.solomkt-kv/.credentials.json |
| Windows PowerShell with SoloMkt-KV_HOME | $env:SoloMkt-KV_HOME\\.credentials.json |
| Windows PowerShell portable fallback | $env:SOLOMKT_KV_HOME\\.credentials.json |
| Windows default | %USERPROFILE%\\.solomkt-kv\\.credentials.json |
| CI/CD | Set SOLOMKT_KV_HOME to a secret-mounted directory, or pass plugins.entries.generator-kv.config.apiKey through the host secret mechanism. |
| Containers | Mount a secret volume and set SOLOMKT_KV_HOME=/run/secrets/solomkt-kv. |

### Interactive API Key Setup

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

### OpenClaw CLI Configuration (Alternative)

If OpenClaw CLI configuration is available, the following config keys can also be used:

```bash
openclaw config set plugins.generator-kv.apiKey YOUR_API_KEY
openclaw config set plugins.generator-kv.baseUrl https://kv.solomarketing.com.cn
openclaw config set plugins.generator-kv.generationTimeoutMs 600000
```

You may also put the API key directly in `openclaw.json` config, but the local credentials file is preferred:

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

### API Key Handling Rules

When collecting an API Key from the user, treat it as sensitive:

- Do not print the full API Key back to the user.
- Do not store it in generated docs, logs, examples, issue reports, or conversation summaries.
- If a preview is needed, show only a masked value.

Per-call overrides are allowed and take precedence over saved config and environment variables:

- `apiKey`
- `api_key`
- `xApiKey`
- `x_api_key`
- `x-api-key`
- `baseUrl`
- `generationTimeoutMs`

## Verification Workflow

After configuration, verify the setup by calling `list_models` with `type: all`.

If `list_models` succeeds:

1. Tell the user configuration is valid.
2. Summarize that SoloMkt-KV returned available system and/or custom models.
3. Ask whether they want to generate a first KV poster now.
4. If they agree or already asked to generate one, continue to the first-use generation flow.

If `list_models` fails:

- For missing API Key, guide the user to run `npm run configure-api-key` or create `.credentials.json`.
- For `401` or `403` authorization errors, ask the user to confirm the API Key is correct and active. Avoid printing it.
- For network or timeout errors, report the base URL and timeout used, then suggest checking network access or increasing `generationTimeoutMs`.
- For invalid response shape, show the real error or raw response summary.

Do not call `generate_image` until API Key and required activity fields are ready.

## Post-Install User Guidance

After successful install and verification, guide the user into actual use. Prefer natural language over requiring command memorization.

Tell the user they can say things like:

```text
帮我生成一张新品发布会的 KV 海报
为 618 大促做一张主视觉图
生成一个年会活动海报，科技感、明亮、高级
Help me generate a KV poster for a product launch
Create a key visual for our summer sale event
请用 Generator-KV 生成活动主视觉
```

Then offer to create the first poster by collecting:

- Activity name
- Activity theme
- Activity time
- Activity location
- Optional extra prompt or style preference

If the user already provided some of this information, reuse it and ask only for missing fields.

## Tool Routing Rules

Use `list_models` when the user wants to:

- Browse available SoloMkt-KV image models.
- Choose a visual style before generation.
- Verify API Key and SoloMkt-KV connectivity.
- Recover from a missing or invalid `modelId`.

Use `generate_image` when the user wants to:

- Generate an activity KV image.
- Create a key visual, main visual, activity poster, campaign poster, event poster, or KV poster.
- Continue after selecting a model and providing activity details.

For natural language requests, infer intent generously. Requests mentioning `KV`, `key visual`, `主视觉`, `活动海报`, `推广图`, `poster`, `活动视觉`, or similar terms should route to this plugin.

## `list_models`

Call `list_models` with:

- `type`: `system`, `custom`, or `all`; default to `all`.

The tool calls SoloMkt-KV:

```text
GET /api/v1/models?type=<type>
```

with the `x-api-key` header.

When presenting models, preserve the `modelId` exactly. Tell the user that the selected row's ID must be used as `modelId` for generation.

## `generate_image`

Call `generate_image` only after required inputs are ready or when intentionally letting the tool prompt for missing model/activity fields.

Required parameters:

- `modelId`
- `activityName`
- `activityTheme`
- `activityTime`
- `activityLocation`

Optional parameters:

- `prompt`
- `posterQuality`
- `posterSize`

Field limits:

- `activityName`: max 200 characters
- `activityTheme`: max 200 characters
- `activityTime`: max 200 characters
- `activityLocation`: max 200 characters
- `prompt`: max 1000 characters

The tool calls SoloMkt-KV:

```text
POST /api/v1/generateKV
```

with the `x-api-key` header and a JSON body containing the generation parameters. The default HTTP timeout is 600000 ms (10 minutes).

## First Generation Flow

When helping the user generate the first poster after setup:

1. Confirm the API Key is configured.
2. Call `list_models` unless a valid `modelId` was already chosen.
3. Ask the user to select one model.
4. Ask only for missing required fields:
   - 活动名称 / `activityName`
   - 活动主题 / `activityTheme`
   - 活动时间 / `activityTime`
   - 活动地点 / `activityLocation`
5. Ask whether they want to add optional style instructions in `prompt`, quality in `posterQuality`, or size in `posterSize`.
6. Validate field lengths.
7. Call `generate_image`.
8. Return generated image URLs as images when possible.
9. If the response has no recognizable image URLs, return the raw JSON response or a concise summary so the issue can be debugged.

Example generation input:

```text
modelId: 1001
activityName: 第四届中国国际供应链促进博览会
activityTheme: 链接世界，共创未来
activityTime: 2026年6月22日—26日
activityLocation: 中国国际展览中心（顺义馆）
prompt: 科技感强、深色背景、体现供应链展会主视觉
posterQuality: 2K
posterSize: ["16:9"]
```

### Error Handling & Auto-Recovery

When calling `POST /api/v1/generateKV`, if the server returns an error, the response body follows this structure:

```json
{
  "success": false,
  "error": {
    "code": "GENERATION_ENCODING_ERROR",
    "message": "...",
    "details": {
      "fieldName": "activityName",
      "reason": "...",
      "suggestion": "...",
      "rejectedValue": null
    }
  }
}
```

The model must automatically recover based on `error.code` and retry, instead of showing the raw error to the user.

| Error Code | Meaning | Auto-Recovery Action |
|---|---|---|
| `GENERATION_ENCODING_ERROR` | Non-UTF-8 bytes in request body | Convert the value of the field indicated by `fieldName` to UTF-8, ensure `Content-Type: application/json; charset=utf-8`, then retry |
| `GENERATION_JSON_PARSE_ERROR` | Invalid JSON format | Inspect request body JSON syntax, quotes, and field types, then retry |
| `GENERATION_FIELD_REQUIRED` | Required field missing | Prompt the user for the field indicated by `fieldName`, then retry |
| `GENERATION_FIELD_TOO_LONG` | Field value too long | Shorten the field indicated by `fieldName` to within its limit, then retry |
| `INVALID_MODEL` | Invalid `modelId` | Call `GET /api/v1/models?type=all` to refresh the model list, let the user pick a valid model, then retry |
| `QUOTA_EXCEEDED` | Daily quota exhausted | Stop retrying; inform the user that the daily quota is used up and suggest retrying the next day or contacting the admin |
| `UNAUTHORIZED` | Invalid `x-api-key` | Stop retrying; guide the user to check or reconfigure the API Key |
| `INTERNAL_ERROR` | Server internal error | Retry up to 2 times; if still failing, report to the user and stop |

Auto-recovery principles:
- Always read `error.details.suggestion` first and follow it.
- After fixing, call `POST /api/v1/generateKV` again with the same `x-api-key`.
- Do not modify `x-api-key` or other valid fields.
- If auto-recovery fails twice in a row, stop and clearly inform the user.

## Troubleshooting

### Missing API Key

Tell the user the SoloMkt-KV API Key is required and configure it with:

```bash
npm run configure-api-key
```

Or create the `.credentials.json` file manually. Or pass it once as `apiKey`, `api_key`, `xApiKey`, `x_api_key`, or `x-api-key`.

### Unauthorized Request

For `401` or `403` authorization failures:

- Confirm which source provided the key: per-call override, plugin config, `SMARTKV_API_KEY`, credentials file, or `IMAGE_API_KEY`.
- Show only a masked key preview if necessary.
- Ask the user to re-enter the API Key if it is expired, mistyped, or not the intended key.

### Missing or Invalid `modelId`

Call `list_models` and ask the user to choose a valid model. Do not guess a model ID.

### Missing Activity Fields

Ask only for missing fields. Do not call `generateKV` until all required fields are available.

### Timeout

The default HTTP timeout is `600000` ms (10 minutes). For slow image generation, first check whether SoloMkt-KV is still processing. If the host has a shorter outer tool timeout, use `npm run generate-kv` or increase `generationTimeoutMs` in plugin config or the host tool timeout.

### No Image URL in Response

If generation appears successful but no image URL is recognized, return the raw JSON or a concise response summary. Explain that the backend response shape may differ from the plugin's URL extraction logic.

### No Available Models

If `list_models` returns no models, retry later or contact SoloMkt-KV support.

## Uninstall

From Codex/OpenClaw plugin installation:

```bash
codex plugin remove generator-kv
```

Remove marketplace registration if desired:

```bash
codex plugin marketplace remove SoloMkt-KV
```

Remove local credentials:

macOS/Linux:

```bash
rm -f "$SOLOMKT_KV_HOME/.credentials.json"
rm -f "$HOME/.solomkt-kv/.credentials.json"
```

Windows PowerShell:

```powershell
Remove-Item "$env:SOLOMKT_KV_HOME\.credentials.json" -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.solomkt-kv\.credentials.json" -ErrorAction SilentlyContinue
```

## Safety Boundaries

- Never expose a full API Key.
- Never write the API Key into examples, generated documents, troubleshooting notes, or public output.
- Do not modify unrelated OpenClaw settings while setting up this plugin.
- Only change `plugins.generator-kv.apiKey`, `plugins.generator-kv.baseUrl`, `plugins.generator-kv.generationTimeoutMs`, and the `.credentials.json` file unless the user explicitly asks for broader changes.
- Do not invent installation sources. Use `https://github.com/SoloMkt-KV/SoloMktKV-OpenClaw.git` for Git source installation, or the SoloMkt-KV marketplace for marketplace installation.
