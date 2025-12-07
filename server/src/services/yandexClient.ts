import OpenAI from 'openai';

const apiKey = process.env.YANDEX_API_KEY;
const folderId = process.env.YANDEX_FOLDER_ID;
// Default to Yandex OpenAI-compatible endpoint for text/gpt models.
const baseURL = process.env.YANDEX_OPENAI_BASE_URL || 'https://llm.api.cloud.yandex.net/foundationModels/v1';

let client: OpenAI | null = null;

export function getYandexClient() {
  if (!client) {
    if (!apiKey) {
      console.warn('YANDEX_API_KEY is not set. LLM features will fail.');
      // Return a dummy or throw? Let's throw when used.
      // But we might want to start server without it for testing UI.
    }
    
    client = new OpenAI({
      apiKey: apiKey || 'dummy',
      baseURL,
      // Yandex requires 'x-folder-id' header or similar sometimes, 
      // but usually for OpenAI compat, it uses the apiKey or project ID.
      // The Yandex docs say to use header `X-Folder-Id` if using IAM token, 
      // or just API Key.
      // If using API Key, folder ID might be optional or inferred?
      // Actually, Yandex GPT API often uses folder ID in the header.
      defaultHeaders: folderId ? { 'x-folder-id': folderId } : undefined,
    });
  }
  return client;
}

export const YANDEX_MODEL = process.env.YANDEX_MODEL || 'yandexgpt/latest'; 
// Note: Yandex models often look like 'gpt://<folder_id>/yandexgpt/latest'
// We might need to construct this.
export function getModelId() {
  if (process.env.YANDEX_MODEL_URI) return process.env.YANDEX_MODEL_URI;
  if (folderId) return `gpt://${folderId}/yandexgpt/latest`;
  return 'yandexgpt';
}
