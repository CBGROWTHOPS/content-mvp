import { createWorker } from "../lib/queue.js";
import { processContentJob } from "./processors/content.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function checkFfprobe(): Promise<void> {
  try {
    const { stdout } = await execAsync("ffprobe -version", { timeout: 5000 });
    const version = stdout.split("\n")[0] ?? "unknown";
    console.log(`ffprobe: ${version}`);
  } catch {
    console.error("FATAL: ffprobe not found. Worker cannot validate video assets.");
    console.error("Install ffmpeg or add it to the container.");
    process.exit(1);
  }
}

console.log("Starting worker...");
await checkFfprobe();

console.log("Redis:", process.env.REDIS_HOST ?? process.env.REDISHOST ?? "localhost");

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
