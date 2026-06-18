import {
  DEFAULT_BASE_URL,
  DEFAULT_GENERATION_TIMEOUT_MS,
  DEFAULT_MODEL_TIMEOUT_MS
} from "./constants.js";
import { PluginConfig, readApiKey } from "./credentials.js";

export interface KvModel {
  id: string;
  name?: string;
  sub?: string;
  tags?: string[];
  gradient?: string;
  previewImageUrl?: string;
  styleProjectId?: string;
  templateId?: string;
  templateCode?: string;
  subId?: string;
  subCode?: string;
}

export interface ModelsResponse {
  success: boolean;
  data?: {
    system?: KvModel[];
    custom?: KvModel[];
  };
  timestamp?: number;
}

export interface GenerateKvInput {
  modelId: string;
  activityName: string;
  activityTheme: string;
  activityTime: string;
  activityLocation: string;
  prompt?: string;
  posterQuality?: string;
  posterSize?: string;
}

function endpoint(config: PluginConfig, path: string): string {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return `${baseUrl}${path}`;
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${bodyText || response.statusText}`);
    }
    return (bodyText ? JSON.parse(bodyText) : null) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listModels(config: PluginConfig = {}): Promise<ModelsResponse> {
  const credential = await readApiKey(config);
  return requestJson<ModelsResponse>(
    endpoint(config, "/api/v1/models?type=all"),
    {
      method: "GET",
      headers: {
        "x-api-key": credential.apiKey
      }
    },
    DEFAULT_MODEL_TIMEOUT_MS
  );
}

export function flattenModels(models: ModelsResponse): KvModel[] {
  return [
    ...(models.data?.system || []),
    ...(models.data?.custom || [])
  ];
}

export async function generateKv(
  input: GenerateKvInput,
  config: PluginConfig = {}
): Promise<string[]> {
  const credential = await readApiKey(config);
  const timeoutMs = config.generationTimeoutMs || DEFAULT_GENERATION_TIMEOUT_MS;
  return requestJson<string[]>(
    endpoint(config, "/api/v1/generateKV"),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": credential.apiKey
      },
      body: JSON.stringify({
        posterQuality: "2K",
        posterSize: "[\"16:9\"]",
        ...input
      })
    },
    timeoutMs
  );
}

export function summarizeModels(models: ModelsResponse): string {
  const groups = [
    ["system", models.data?.system || []] as const,
    ["custom", models.data?.custom || []] as const
  ];
  const lines: string[] = [];
  for (const [groupName, groupModels] of groups) {
    if (groupModels.length === 0) continue;
    lines.push(`${groupName}:`);
    for (const model of groupModels) {
      const tags = model.tags?.length ? ` tags=${model.tags.join(", ")}` : "";
      const sub = model.sub ? ` sub=${model.sub}` : "";
      const preview = model.previewImageUrl ? ` preview=${model.previewImageUrl}` : "";
      lines.push(`- ${model.id}: ${model.name || "Unnamed model"}${sub}${tags}${preview}`);
    }
  }
  return lines.length ? lines.join("\n") : "No models returned.";
}
