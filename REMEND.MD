# Generator-KV API Key Setup / API Key 安装说明

This file focuses on API key installation for the Generator-KV OpenClaw plugin.

本文专门说明 Generator-KV OpenClaw 插件的 API Key 安装方式。

## English

Generator-KV sends the SoloMkt-KV API key in the `x-api-key` header. The recommended local credential file is:

```text
$SoloMkt-KV_HOME/.credentials.json
```

Because some shells do not support hyphens in environment variable names, the helper scripts also support:

```text
$SOLOMKT_KV_HOME/.credentials.json
```

If no home variable is configured, Generator-KV falls back to:

```text
~/.solomkt-kv/.credentials.json
```

Credential file format:

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

Recommended setup:

```bash
npm install
npm run configure-api-key
```

The setup helper saves the key and immediately validates it by calling:

```text
GET https://solosmart-uat.issmart.com.cn/solomkt_kv/api/v1/models?type=all
```

If validation succeeds, the plugin is ready to use. If validation fails, check whether the API key is correct and whether the service is reachable from your network.

## 中文

Generator-KV 会通过 `x-api-key` 请求头发送 SoloMkt-KV API Key。推荐的本地凭证文件位置是：

```text
$SoloMkt-KV_HOME/.credentials.json
```

由于部分 Shell 不支持带连字符的环境变量名，插件脚本同时支持：

```text
$SOLOMKT_KV_HOME/.credentials.json
```

如果没有配置上述目录，Generator-KV 默认使用：

```text
~/.solomkt-kv/.credentials.json
```

凭证文件格式：

```json
{
  "apiKey": "YOUR_SOLOMKT_KV_API_KEY"
}
```

推荐配置方式：

```bash
npm install
npm run configure-api-key
```

配置脚本会保存 API Key，并自动调用模型列表接口进行校验：

```text
GET https://solosmart-uat.issmart.com.cn/solomkt_kv/api/v1/models?type=all
```

校验通过后即可使用插件。若校验失败，请检查 API Key 是否正确，以及当前网络是否可以访问 SoloMkt-KV 服务。
