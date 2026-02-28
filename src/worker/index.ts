import { createWorker } from "../lib/queue.js";
import { processContentJob } from "./processors/content.js";

console.log("Creating worker...");
console.log("Redis config:", {
  host: process.env.REDIS_HOST ?? process.env.REDISHOST ?? "not set",
  port: process.env.REDIS_PORT ?? process.env.REDISPORT ?? "6379",
  hasPassword: !!(process.env.REDIS_PASSWORD ?? process.env.REDISPASSWORD),
});

const worker = createWorker(processContentJob);

worker.on("ready", () => {
  console.log("Worker ready and connected to Redis");
});

worker.on("error", (err) => {
  console.error("Worker error:", err.message);
});

worker.on("active", (job) => {
  console.log(`Job ${job.id} is now active`);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err?.message);
});

worker.on("stalled", (jobId) => {
  console.log(`Job ${jobId} stalled`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await worker.close();
  console.log("Worker closed");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Heartbeat every 5 minutes to confirm worker is alive
setInterval(() => {
  console.log(`Worker heartbeat: ${new Date().toISOString()}`);
}, 5 * 60 * 1000);

console.log("Worker started, waiting for jobs...");
