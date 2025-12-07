import { nicknameModerationPrompt } from '../prompts/nicknameModeration';
import { getYandexClient, resolveYandexModel } from './yandexClient';
import { log } from '../logger';

export async function validateNickname(nickname: string) {
  const openai = getYandexClient();
  const model = resolveYandexModel('YANDEX_MODERATION_MODEL', 'yandexgpt-lite');
  const startedAt = Date.now();

  const trimmed = nickname.trim();
  const prompt = nicknameModerationPrompt.replace('{{nickname}}', trimmed);

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const output = (completion.choices[0]?.message?.content ?? '').trim();
    const normalized = output.toUpperCase();

    const allowed = normalized.startsWith('OK');
    const reason = allowed
      ? ''
      : output.replace(/^REJECT[:\s]*/i, '').trim() || 'Никнейм не прошёл модерацию.';

    log('info', 'llm.moderation.result', {
      model,
      durationMs: Date.now() - startedAt,
      allowed,
    });

    return allowed ? { allowed: true as const } : { allowed: false as const, reason };
  } catch (err) {
    log('error', 'llm.moderation.error', {
      model,
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

