import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import {
  DEFAULT_BASE_URL,
  DEFAULT_GENERATION_TIMEOUT_MS,
  PLUGIN_ID,
  PLUGIN_NAME
} from "./constants.js";
import {
  flattenModels,
  generateKv,
  listModels,
  summarizeModels
} from "./client.js";
import { writeApiKey } from "./credentials.js";

const configSchema = Type.Object({
  apiKey: Type.Optional(Type.String({ description: "Optional SoloMkt-KV API key." })),
  credentialsPath: Type.Optional(Type.String({ description: "Optional .credentials.json path." })),
  baseUrl: Type.Optional(Type.String({ default: DEFAULT_BASE_URL })),
  generationTimeoutMs: Type.Optional(Type.Number({ default: DEFAULT_GENERATION_TIMEOUT_MS }))
});

const generationParameters = Type.Object({
  modelId: Type.String({ minLength: 1, description: "Model ID from generator_kv_list_models." }),
  activityName: Type.String({ minLength: 1, maxLength: 200 }),
  activityTheme: Type.String({ minLength: 1, maxLength: 200 }),
  activityTime: Type.String({ minLength: 1, maxLength: 200 }),
  activityLocation: Type.String({ minLength: 1, maxLength: 200 }),
  prompt: Type.Optional(Type.String({ maxLength: 1000 })),
  posterQuality: Type.Optional(Type.String({ default: "2K" })),
  posterSize: Type.Optional(Type.String({ default: "[\"16:9\"]" }))
});

export default defineToolPlugin({
  id: PLUGIN_ID,
  name: PLUGIN_NAME,
  description: "Generate campaign KV images with SoloMkt-KV public models.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "generator_kv_configure_api_key",
      label: "Configure Generator-KV API Key",
      description:
        "Save a SoloMkt-KV API key to the local credentials file and validate it by fetching models.",
      optional: true,
      parameters: Type.Object({
        apiKey: Type.String({ minLength: 1, description: "SoloMkt-KV API key." })
      }),
      async execute({ apiKey }, config) {
        const credentialsPath = await writeApiKey(apiKey, config);
        const models = await listModels({ ...config, apiKey });
        const count = flattenModels(models).length;
        return {
          ok: true,
          credentialsPath,
          validation: `API key saved and validated. ${count} model(s) are available.`,
          nextStep:
            "Ask the user for the required KV fields, call generator_kv_list_models, let the user choose a model ID, then call generator_kv_generate."
        };
      }
    }),
    tool({
      name: "generator_kv_list_models",
      label: "List Generator-KV Models",
      description:
        "Fetch public SoloMkt-KV models. Always call this before generating so the user can choose a current model ID.",
      parameters: Type.Object({}),
      async execute(_params, config) {
        const models = await listModels(config);
        return {
          success: models.success,
          models,
          selectionGuide:
            "Show these models to the user and ask them to choose one modelId before generating.",
          text: summarizeModels(models)
        };
      }
    }),
    tool({
      name: "generator_kv_generate",
      label: "Generate KV",
      description:
        "Generate KV images. This tool re-fetches models first, validates the selected modelId, and waits up to 10 minutes by default.",
      parameters: generationParameters,
      async execute(params, config) {
        const models = await listModels(config);
        const availableModels = flattenModels(models);
        const selected = availableModels.find((model) => model.id === params.modelId);
        if (!selected) {
          return {
            ok: false,
            message:
              "The selected modelId was not found in the latest model list. Please call generator_kv_list_models again and ask the user to choose a valid model.",
            availableModelIds: availableModels.map((model) => model.id)
          };
        }

        const images = await generateKv(params, config);
        return {
          ok: true,
          model: selected,
          message:
            "KV generation completed. The generation call can take several minutes; this request used the latest model list before submitting.",
          images
        };
      }
    })
  ]
});
