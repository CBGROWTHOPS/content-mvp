import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import type { QueueJobPayload } from "../types/index.js";

const redisUrl = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing UPSTASH_REDIS_URL or REDIS_URL");
}

// Parse Redis URL for ioredis (Upstash uses rediss:// for TLS)
const connection: ConnectionOptions = {
  host: new URL(redisUrl).hostname,
  port: parseInt(new URL(redisUrl).port || "6379", 10),
  password: new URL(redisUrl).password || undefined,
  username: new URL(redisUrl).username || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  ...(redisUrl.startsWith("rediss://") ? { tls: {} } : {}),
};

export const QUEUE_NAME = "content-jobs";

export const contentQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
  },
});

export function createWorker(
  processor: (job: Job<QueueJobPayload, void, string>) => Promise<void>
): Worker<QueueJobPayload, void, string> {
  return new Worker(QUEUE_NAME, processor, {
    connection,
    concurrency: 3,
  });
}
