import { answerScoringPrompt } from '../prompts/answerScoring';
import { getYandexClient, resolveYandexModel } from './yandexClient';
import { log } from '../logger';

export async function scoreAnswer(params: {
  question: string;
  reference: string;
  answer: string;
}) {
  const openai = getYandexClient();
  const model = resolveYandexModel('YANDEX_SCORING_MODEL', 'yandexgpt-lite');
  const startedAt = Date.now();

  const prompt = answerScoringPrompt
    .replace('{{question}}', params.question)
    .replace('{{reference}}', params.reference)
    .replace('{{answer}}', params.answer);

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Не удалось разобрать ответ модели.');
    }

    const parsed = JSON.parse(match[0]) as { score: number; feedback?: string };
    const normalizedScore = Math.max(0, Math.min(10, Math.round(parsed.score)));

    log('info', 'llm.score.success', {
      model,
      durationMs: Date.now() - startedAt,
      questionPreview: params.question.slice(0, 80),
    });

    return {
      score: normalizedScore,
      feedback: parsed.feedback ?? '',
    };
  } catch (err) {
    log('error', 'llm.score.error', {
      model,
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

