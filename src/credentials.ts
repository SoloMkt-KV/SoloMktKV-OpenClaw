import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

export interface PluginConfig {
  apiKey?: string;
  credentialsPath?: string;
  baseUrl?: string;
  generationTimeoutMs?: number;
}

export interface CredentialResult {
  apiKey: string;
  source: "config" | "credentials-file";
  path?: string;
}

export function resolveCredentialsHome(): string {
  return (
    process.env["SoloMkt-KV_HOME"] ||
    process.env.SOLOMKT_KV_HOME ||
    process.env.SoloMkt_KV_HOME ||
    join(homedir(), ".solomkt-kv")
  );
}

export function resolveCredentialsPath(config: PluginConfig = {}): string {
  return config.credentialsPath || join(resolveCredentialsHome(), ".credentials.json");
}

export async function readApiKey(config: PluginConfig = {}): Promise<CredentialResult> {
  if (config.apiKey?.trim()) {
    return { apiKey: config.apiKey.trim(), source: "config" };
  }

  const credentialsPath = resolveCredentialsPath(config);
  let raw: string;
  try {
    raw = await readFile(credentialsPath, "utf8");
  } catch {
    throw new Error(
      `Generator-KV is not configured. Please add your API key to ${credentialsPath} or provide it through plugin config.`
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`Generator-KV credentials file is not valid JSON: ${credentialsPath}`);
  }

  const record = payload as Record<string, unknown>;
  const apiKey = record.apiKey || record.xApiKey || record["x-api-key"];
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error(`Generator-KV credentials file must contain an apiKey field: ${credentialsPath}`);
  }

  return { apiKey: apiKey.trim(), source: "credentials-file", path: credentialsPath };
}

export async function writeApiKey(apiKey: string, config: PluginConfig = {}): Promise<string> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("API key is required.");
  }

  const credentialsPath = resolveCredentialsPath(config);
  await mkdir(dirname(credentialsPath), { recursive: true });
  await writeFile(credentialsPath, `${JSON.stringify({ apiKey: trimmed }, null, 2)}\n`, {
    mode: 0o600
  });
  return credentialsPath;
}
