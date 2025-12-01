import OpenAI from 'openai';
import { nicknameModerationPrompt } from '../prompts/nicknameModeration';

const openAiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (openAiKey) {
  openai = new OpenAI({ apiKey: openAiKey });
}

export async function validateNickname(nickname: string) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const trimmed = nickname.trim();
  const prompt = nicknameModerationPrompt.replace('{{nickname}}', trimmed);

  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
  });

  const rawOutput = response.output_text;
  const output = (Array.isArray(rawOutput) ? rawOutput.join('\n') : rawOutput ?? '').trim();
  const normalized = output.toUpperCase();

  if (normalized.startsWith('OK')) {
    return { allowed: true as const };
  }

  const reason = output.replace(/^REJECT[:\s]*/i, '').trim();
  return {
    allowed: false as const,
    reason: reason || 'Никнейм не прошёл модерацию.',
  };
}

