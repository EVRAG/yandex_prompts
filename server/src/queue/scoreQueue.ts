import { Worker, Queue } from 'bullmq';
import { redis } from '../redisClient';
import { getState, getSubmissionsForStage, updatePlayerScore, addSubmission, Submission, getPlayer, setState, loadStateFromRedis, updateSubmission } from '../gameState';
import { getYandexClient, getModelId } from '../services/yandexClient';
import { answerScoringPrompt } from '../prompts/answerScoring';
import { gameConfig } from '@prompt-night/shared';

// Use same redis connection string
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null,
};

export const scoreQueue = new Queue('scoring', { connection });

// We need a way to update the specific submission in the state.
// gameState stores submissions in an array. We should probably index them or just find by ID.
// Ideally gameState should export a function to update a submission.

// Let's modify gameState to export updateSubmission.
// But for now I'll just access state directly if I can, or add the helper.
// Since I can't easily edit `gameState.ts` without rewriting it, I'll rewrite it briefly or assume I can append a helper.
// Actually, `addSubmission` pushes to array.
// I will rewrite `server/src/gameState.ts` to include `updateSubmission` or I will handle it by re-reading state, finding, updating, saving.

// Worker with concurrency control
// Process up to 10 jobs in parallel to avoid overwhelming YandexGPT API
// Adjust based on your YandexGPT rate limits (check your plan limits)
const worker = new Worker('scoring', async (job) => {
  const { submissionId, questionText, referenceAnswer, participantAnswer, playerId } = job.data;
  
  console.log(`[scoring] Processing submission ${submissionId} for player ${playerId}`);
  console.log(`[scoring] Question: ${questionText}`);
  console.log(`[scoring] Participant answer: ${participantAnswer}`);
  
  try {
    const client = getYandexClient();
    const model = getModelId();
    
    const prompt = answerScoringPrompt
      .replace('{{question}}', questionText)
      .replace('{{reference}}', referenceAnswer)
      .replace('{{answer}}', participantAnswer);

    console.log(`[scoring] Sending request to YandexGPT with model: ${model}`);
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Ты эксперт по оценке ответов. Всегда отвечай только валидным JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.3,
      response_format: { type: 'json_object' }, // If supported, otherwise parse
    });

    const content = response.choices[0]?.message?.content || '{}';
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // fallback if not valid JSON (try to find JSON block)
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid JSON from LLM');
      }
    }

    const score = Math.min(10, Math.max(0, Number(result.score) || 0));
    const feedback = result.feedback || '';

    console.log(`[scoring] Submission ${submissionId} scored: ${score}/10`);
    console.log(`[scoring] Feedback: ${feedback}`);

    // Update state
    updateSubmission(submissionId, { score, feedback });
    
    // Trigger broadcast via Redis pub/sub (works even if worker is in separate process)
    // The main process will pick it up and broadcast to all clients
    redis.publish('state:changed', JSON.stringify({ type: 'score_updated', submissionId }));
    
  } catch (err) {
    console.error(`[scoring] Failed for ${submissionId}:`, err);
    // Re-throw to mark job as failed (BullMQ will retry based on job options)
    throw err;
  }
}, { 
  connection,
  concurrency: parseInt(process.env.SCORING_CONCURRENCY || '10', 10), // Process 10 jobs in parallel (adjust based on YandexGPT rate limits)
  limiter: {
    max: parseInt(process.env.SCORING_RATE_LIMIT || '20', 10), // Max 20 requests
    duration: 1000, // per second
  },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
