import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { redis } from '../redisClient';
import { scoreAnswer } from '../services/answerScoring';
import { log } from '../logger';

export type ScoreJobData = {
  question: string;
  reference: string;
  answer: string;
  playerId: string;
  stageId: string;
};

export type ScoreJobResult = {
  score: number;
  feedback?: string;
};

const rawQueueName = process.env.SCORE_QUEUE_NAME || 'prompt-night-score';
const queueName = rawQueueName.replace(/:/g, '-');
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 500 },
  removeOnComplete: true,
  removeOnFail: 50,
};

export const scoreQueue = new Queue<ScoreJobData>(queueName, {
  connection: redis,
  defaultJobOptions,
});

export const scoreQueueEvents = new QueueEvents(queueName, { connection: redis });

new Worker<ScoreJobData, ScoreJobResult>(
  queueName,
  async job => {
    const { question, reference, answer } = job.data;
    const result = await scoreAnswer({ question, reference, answer });
    return { score: result.score, feedback: result.feedback };
  },
  {
    connection: redis,
    concurrency: Number(process.env.SCORE_WORKERS ?? 5),
    // Processing timeout: fallback to worker option so the job fails if too long
    // and respects attempts/backoff
    lockDuration: Number(process.env.SCORE_TIMEOUT_MS ?? 8000),
  },
).on('failed', (job, err) => {
  log('error', 'scoreQueue worker failed', { jobId: job?.id, reason: err?.message ?? err });
});

scoreQueueEvents.on('failed', ({ jobId, failedReason }) => {
  log('error', 'scoreQueue event failed', { jobId: jobId ?? 'unknown', reason: failedReason });
});
