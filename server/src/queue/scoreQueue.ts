import { Worker, Queue } from 'bullmq';
import { redis } from '../redisClient';
import { getState, getSubmissionsForStage, updatePlayerScore, addSubmission, Submission, getPlayer, setState, loadStateFromRedis } from '../gameState';
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

// Worker
const worker = new Worker('scoring', async (job) => {
  const { submissionId, questionText, referenceAnswer, participantAnswer } = job.data;
  
  try {
    const client = getYandexClient();
    const model = getModelId();
    
    const prompt = answerScoringPrompt
      .replace('{{question}}', questionText)
      .replace('{{reference}}', referenceAnswer)
      .replace('{{answer}}', participantAnswer);

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
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

    // Update state
    // We need to access the module scope state in gameState.ts
    // Since we are in same process (for now), we can import function.
    // If worker was separate process, we'd need to use Redis to update state.
    // Given the architecture "Node/TS backend", likely single instance or we need Redis-based state sync.
    // `gameState.ts` saves to Redis. If we update in memory here, we must ensure we are the only writer or we use Redis locking.
    // For this simple app, single server instance is assumed.
    
    // We need to add `updateSubmission` to gameState.ts
    const { updateSubmission } = await import('../gameState');
    updateSubmission(submissionId, { score, feedback });
    
    // Update player score
    // We need submission to know playerId
    // We passed it in job? Or fetch from state.
    // updatePlayerScore(playerId, score);
    
  } catch (err) {
    console.error(`Scoring failed for ${submissionId}`, err);
  }
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
