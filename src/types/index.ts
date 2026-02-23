import type { JobInput } from "../schema/job.js";

export type { JobInput };

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface QueueJobPayload {
  jobId: string;
  payload: JobInput;
}

export interface ReplicateOutput {
  url: string;
  cost?: number;
}
