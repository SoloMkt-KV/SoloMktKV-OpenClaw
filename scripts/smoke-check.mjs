#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "package.json",
  "openclaw.plugin.json",
  ".agents/plugins/marketplace.json",
  "plugins/generator-kv/.codex-plugin/plugin.json",
  "plugins/generator-kv/skills/generator-kv/SKILL.md",
  "README.md",
  "REMEND.MD"
];

for (const file of requiredFiles) {
  await access(join(process.cwd(), file));
}

const marketplace = JSON.parse(await readFile(" .agents/plugins/marketplace.json".trim(), "utf8"));
if (marketplace.name !== "SoloMkt-KV") {
  throw new Error("Marketplace name must be SoloMkt-KV.");
}

const plugin = marketplace.plugins.find((entry) => entry.name === "generator-kv");
if (!plugin) {
  throw new Error("Marketplace entry for generator-kv is missing.");
}

console.log("Smoke check passed.");
