import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import type { QueueJobPayload } from "../types/index.js";

function getConnection() {
  const redisUrl = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("Missing UPSTASH_REDIS_URL or REDIS_URL");
  }

  // Parse Redis URL for ioredis (Upstash uses rediss:// for TLS)
  return {
    host: new URL(redisUrl).hostname,
    port: parseInt(new URL(redisUrl).port || "6379", 10),
    password: new URL(redisUrl).password || undefined,
    username: new URL(redisUrl).username || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...(redisUrl.startsWith("rediss://") ? { tls: {} } : {}),
  } as ConnectionOptions;
}

export const QUEUE_NAME = "content-jobs";

let _contentQueue: Queue | null = null;

export function getContentQueue(): Queue {
  if (!_contentQueue) {
    _contentQueue = new Queue(QUEUE_NAME, {
      connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
  },
    });
  }
  return _contentQueue;
}

export const contentQueue = {
  add: (...args: Parameters<Queue["add"]>) => getContentQueue().add(...args),
};

export function createWorker(
  processor: (job: Job<QueueJobPayload, void, string>) => Promise<void>
): Worker<QueueJobPayload, void, string> {
  return new Worker(QUEUE_NAME, processor, {
    connection: getConnection(),
    concurrency: 3,
  });
}
