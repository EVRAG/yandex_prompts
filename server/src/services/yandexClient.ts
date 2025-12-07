import OpenAI from 'openai';

const apiKey = process.env.YANDEX_API_KEY;
const folderId = process.env.YANDEX_FOLDER_ID ?? process.env.YC_FOLDER_ID ?? process.env.CLOUD_FOLDER_ID;
// Default to Yandex OpenAI-compatible endpoint for text/gpt models.
const baseURL = process.env.YANDEX_OPENAI_BASE_URL ?? 'https://llm.api.cloud.yandex.net/v1';

let client: OpenAI | null = null;

export function getYandexClient() {
  if (!client) {
    if (!apiKey) {
      throw new Error('YANDEX_API_KEY is not set');
    }
    if (!folderId) {
      throw new Error('YANDEX_FOLDER_ID is not set');
    }

    client = new OpenAI({
      apiKey,
      baseURL,
      project: folderId,
    });
  }

  return client;
}

export function resolveYandexModel(envName: string, defaultModelSuffix = 'yandexgpt-lite') {
  const envModel = process.env[envName];
  if (envModel) return envModel;

  if (!folderId) {
    throw new Error(`${envName} is not set and YANDEX_FOLDER_ID is missing`);
  }

  return `gpt://${folderId}/${defaultModelSuffix}`;
}

export function getYandexConfigSnapshot() {
  return {
    baseURL,
    folderId: folderId ?? null,
  };
}

