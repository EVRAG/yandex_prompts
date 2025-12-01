import OpenAI from 'openai';
import { answerScoringPrompt } from '../prompts/answerScoring';

const apiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({ apiKey });
}

export async function scoreAnswer(params: {
  question: string;
  reference: string;
  answer: string;
}) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is не задан. Сервис оценки ответов недоступен.');
  }

  const prompt = answerScoringPrompt
    .replace('{{question}}', params.question)
    .replace('{{reference}}', params.reference)
    .replace('{{answer}}', params.answer);

  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
  });

  const rawOutput = response.output_text;
  const text = Array.isArray(rawOutput) ? rawOutput.join('\n') : rawOutput ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Не удалось разобрать ответ модели.');
  }

  const parsed = JSON.parse(match[0]) as { score: number; feedback?: string };
  const normalizedScore = Math.max(0, Math.min(10, Math.round(parsed.score)));
  return {
    score: normalizedScore,
    feedback: parsed.feedback ?? '',
  };
}

