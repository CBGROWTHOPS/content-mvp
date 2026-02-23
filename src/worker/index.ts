import { createWorker } from "../lib/queue.js";
import { processContentJob } from "./processors/content.js";

const worker = createWorker(processContentJob);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err?.message);
});

console.log("Worker started, waiting for jobs...");
