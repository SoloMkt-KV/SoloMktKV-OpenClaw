#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_BASE_URL = "https://solosmart-uat.issmart.com.cn/solomkt_kv";
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

function credentialsHome() {
  return (
    process.env["SoloMkt-KV_HOME"] ||
    process.env.SOLOMKT_KV_HOME ||
    process.env.SoloMkt_KV_HOME ||
    join(homedir(), ".solomkt-kv")
  );
}

function credentialsPath() {
  return process.env.GENERATOR_KV_CREDENTIALS_PATH || join(credentialsHome(), ".credentials.json");
}

async function readApiKey() {
  const target = credentialsPath();
  let raw;
  try {
    raw = await readFile(target, "utf8");
  } catch {
    throw new Error(
      `Generator-KV is not configured. Run "npm run configure-api-key" or create ${target} with {"apiKey":"YOUR_KEY"}.`
    );
  }

  const payload = JSON.parse(raw);
  const apiKey = payload.apiKey || payload.xApiKey || payload["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error(`Credentials file must contain an apiKey field: ${target}`);
  }
  return apiKey.trim();
}

async function requestJson(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
    }
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function flattenModels(payload) {
  return [
    ...(payload.data?.system || []).map((model) => ({ ...model, group: "system" })),
    ...(payload.data?.custom || []).map((model) => ({ ...model, group: "custom" }))
  ];
}

async function listModels(apiKey) {
  const payload = await requestJson(
    `${DEFAULT_BASE_URL}/api/v1/models?type=all`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey
      }
    },
    30_000
  );
  return flattenModels(payload);
}

function printModels(models) {
  console.log("\nAvailable models:");
  for (const [index, model] of models.entries()) {
    const tags = model.tags?.length ? ` | ${model.tags.join(", ")}` : "";
    const sub = model.sub ? ` | ${model.sub}` : "";
    console.log(`${index + 1}. [${model.group}] ${model.id} - ${model.name || "Unnamed"}${sub}${tags}`);
  }
}

async function askRequired(cli, label, maxLength = 200) {
  while (true) {
    const value = (await cli.question(`${label}: `)).trim();
    if (!value) {
      console.log(`${label} is required.`);
      continue;
    }
    if (value.length > maxLength) {
      console.log(`${label} must be ${maxLength} characters or fewer.`);
      continue;
    }
    return value;
  }
}

async function main() {
  const apiKey = await readApiKey();
  const models = await listModels(apiKey);
  if (!models.length) {
    throw new Error("No models were returned by the model API.");
  }

  printModels(models);
  const cli = createInterface({ input, output });
  try {
    let selected;
    while (!selected) {
      const answer = (await cli.question("\nChoose a model number or modelId: ")).trim();
      const index = Number.parseInt(answer, 10);
      selected = models.find((model, modelIndex) => model.id === answer || modelIndex + 1 === index);
      if (!selected) {
        console.log("Please choose a valid model from the latest list.");
      }
    }

    const body = {
      modelId: selected.id,
      activityName: await askRequired(cli, "Activity name"),
      activityTheme: await askRequired(cli, "Activity theme"),
      activityTime: await askRequired(cli, "Activity time"),
      activityLocation: await askRequired(cli, "Activity location"),
      prompt: (await cli.question("Additional prompt (optional): ")).trim(),
      posterQuality: (await cli.question("Poster quality (default 2K): ")).trim() || "2K",
      posterSize: (await cli.question('Poster size (default ["16:9"]): ')).trim() || "[\"16:9\"]"
    };

    console.log("\nSubmitting KV generation. This can take several minutes; timeout is 10 minutes.");
    const images = await requestJson(
      `${DEFAULT_BASE_URL}/api/v1/generateKV`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(body)
      },
      GENERATION_TIMEOUT_MS
    );

    console.log("\nGeneration completed:");
    for (const url of images) {
      console.log(url);
    }
  } finally {
    cli.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
