import OpenAI from 'openai';

// Yandex OpenAI-compatible endpoint for chat completions
const baseURL = process.env.YANDEX_OPENAI_BASE_URL || 'https://llm.api.cloud.yandex.net/v1';

let client: OpenAI | null = null;

export function getYandexClient() {
  if (!client) {
    // Читаем переменные окружения при каждом вызове (после загрузки dotenv)
    const apiKey = process.env.YANDEX_API_KEY;
    const folderId = process.env.YANDEX_FOLDER_ID;
    
    if (!apiKey) {
      console.warn('YANDEX_API_KEY is not set. LLM features will fail.');
    }
    if (!folderId) {
      console.warn('YANDEX_FOLDER_ID is not set. Some YandexGPT features may fail.');
    }
    
    console.log(`[yandex] Initializing client: baseURL=${baseURL}, folderId=${folderId || 'not set'}`);
    
    client = new OpenAI({
      apiKey: apiKey || 'dummy',
      baseURL,
      // Yandex requires 'x-folder-id' header for folder-scoped requests
      defaultHeaders: folderId ? { 'x-folder-id': folderId } : undefined,
    });
  }
  return client;
}

// YandexGPT model identifier
// Format: gpt://<folder_id>/yandexgpt/latest or just yandexgpt/latest if folder in header
export function getModelId() {
  // Читаем переменные окружения внутри функции (после загрузки dotenv)
  const folderId = process.env.YANDEX_FOLDER_ID;
  
  if (process.env.YANDEX_MODEL_URI) return process.env.YANDEX_MODEL_URI;
  if (process.env.YANDEX_MODEL) return process.env.YANDEX_MODEL;
  
  // Yandex API требует полный URI формата gpt://<folder_id>/yandexgpt/latest
  // даже если folderId передается в заголовке
  if (folderId) {
    return `gpt://${folderId}/yandexgpt/latest`;
  }
  // If no folderId, we can't make requests - return a placeholder that will fail gracefully
  throw new Error('YANDEX_FOLDER_ID is required. Please set it in .env file.');
}
