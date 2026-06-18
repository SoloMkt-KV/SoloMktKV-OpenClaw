---
name: generator-kv
description: Guide users through configuring SoloMkt-KV API credentials, listing current KV models, collecting required campaign fields, and generating KV images through natural-language conversation.
---

# Generator-KV Skill

Use this skill when the user wants to configure Generator-KV, check the SoloMkt-KV API key, list available KV models, or generate campaign KV images.

## Conversation Flow

1. Check whether the API key is configured.
   - Preferred file: `$SoloMkt-KV_HOME/.credentials.json`.
   - Portable environment variable fallback: `SOLOMKT_KV_HOME`.
   - If neither home variable exists, use `~/.solomkt-kv/.credentials.json`.
   - The JSON shape is:

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

2. If the key is missing, ask the user to provide it in chat or run the configuration helper.
   - If the user provides the key, save it with:

```bash
npm run configure-api-key -- YOUR_SOLOMKT_KV_API_KEY
```

   - After saving, validate automatically by calling the model list API.
   - If validation fails, explain that the key was rejected or the service could not be reached.

3. Before every generation, call the model list API:
   - `GET https://solosmart-uat.issmart.com.cn/solomkt_kv/api/v1/models?type=all`
   - Header: `x-api-key: <apiKey>`
   - Show the returned system and custom models to the user.
   - Ask the user to choose a model by `id`.

4. Collect these required fields before generating:
   - `modelId`, selected from the latest model list.
   - `activityName`, 1-200 characters.
   - `activityTheme`, 1-200 characters.
   - `activityTime`, 1-200 characters.
   - `activityLocation`, 1-200 characters.

5. Also collect optional fields when the user has preferences:
   - `prompt`, up to 1000 characters.
   - `posterQuality`, default `2K`.
   - `posterSize`, default `["16:9"]` as a string.

6. Submit generation:
   - `POST https://solosmart-uat.issmart.com.cn/solomkt_kv/api/v1/generateKV`
   - Header: `x-api-key: <apiKey>`
   - Timeout: 10 minutes.
   - Tell the user generation may take several minutes.

## Tool Use Policy

- Always list models before generation.
- Do not invent model IDs.
- Do not proceed if required campaign fields are missing.
- If the user has not configured credentials, help them configure and validate first.
- After validation succeeds, explicitly tell the user they can say something like:

```text
请用 Generator-KV 生成活动主视觉。活动名称是..., 主题是..., 时间是..., 地点是..., 风格要求是...
```

or:

```text
Use Generator-KV to create a campaign KV for..., with the theme..., time..., location..., and visual prompt...
```

## Local Helper Commands

Configure and validate:

```bash
npm run configure-api-key
```

Generate through an interactive terminal flow:

```bash
npm run generate-kv
```

## Friendly Status Text

When generation starts, tell the user:

```text
已提交 KV 生成请求。图片生成可能需要几分钟，最长等待 10 分钟，我会在完成后返回图片链接。
```

English:

```text
The KV generation request has been submitted. Image generation can take a few minutes; I will wait up to 10 minutes and return the image links when it completes.
```
