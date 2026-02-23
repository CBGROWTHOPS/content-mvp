import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import type { QueueJobPayload } from "../types/index.js";

function getConnection(): ConnectionOptions {
  // Prefer private URL (Railway: no egress) over public
  const redisUrl =
    process.env.REDIS_PRIVATE_URL ??
    process.env.UPSTASH_REDIS_URL ??
    process.env.REDIS_URL;

  if (redisUrl) {
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

  // Build from host/port/password (Railway private: host = redis.railway.internal)
  const host = process.env.REDIS_HOST ?? process.env.REDISHOST;
  const port = process.env.REDIS_PORT ?? process.env.REDISPORT ?? "6379";
  const password = process.env.REDIS_PASSWORD ?? process.env.REDISPASSWORD;
  const username = process.env.REDIS_USER ?? process.env.REDISUSER;

  if (host) {
    return {
      host,
      port: parseInt(port, 10),
      password: password || undefined,
      username: username || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    } as ConnectionOptions;
  }

  throw new Error(
    "Missing Redis config. Set REDIS_PRIVATE_URL, REDIS_URL, UPSTASH_REDIS_URL, or REDIS_HOST+REDIS_PASSWORD"
  );
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
