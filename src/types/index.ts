import type { JobInput } from "../schema/job.js";

export type { JobInput };

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface EnrichedJobPayload extends JobInput {
  model_key: string;
  provider_model_id: string;
}

export interface QueueJobPayload {
  jobId: string;
  payload: EnrichedJobPayload;
}

export interface ReplicateOutput {
  url: string;
  cost?: number;
}
