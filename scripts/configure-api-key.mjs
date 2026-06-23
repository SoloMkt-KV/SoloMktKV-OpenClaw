#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_BASE_URL = "https://api.kv.solomarketing.com.cn";

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

async function promptApiKey() {
  const cli = createInterface({ input, output });
  try {
    const apiKey = await cli.question("Enter your SoloMkt-KV API key: ");
    return apiKey.trim();
  } finally {
    cli.close();
  }
}

async function validateApiKey(apiKey) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/v1/models?type=all`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Model validation failed with HTTP ${response.status}: ${text}`);
  }
  const payload = JSON.parse(text);
  const count = (payload.data?.system?.length || 0) + (payload.data?.custom?.length || 0);
  return count;
}

async function main() {
  const apiKey = (process.argv[2] || "").trim() || await promptApiKey();
  if (!apiKey) {
    throw new Error("API key is required.");
  }

  const target = credentialsPath();
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify({ apiKey }, null, 2)}\n`, { mode: 0o600 });

  const count = await validateApiKey(apiKey);
  console.log(`API key saved to ${target}`);
  console.log(`Validation succeeded. ${count} model(s) are available.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
