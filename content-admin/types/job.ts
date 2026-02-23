export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type JobFormat = "reel" | "story" | "post" | "image";

export type JobObjective =
  | "lead_generation"
  | "engagement"
  | "awareness"
  | "conversion";

export type HookType =
  | "contrast"
  | "question"
  | "pain_point"
  | "statistic"
  | "story";

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export interface JobInput {
  brand: string;
  format: JobFormat;
  length_seconds?: number;
  scene_structure?: number;
  aspect_ratio?: AspectRatio;
  objective: JobObjective;
  hook_type: HookType;
  model_key?: string;
  model?: string;
  variables: Record<string, string | number | boolean>;
}

export interface JobListItem {
  id: string;
  brand: string;
  format: string;
  hook_type: string | null;
  status: JobStatus;
  created_at: string;
}

export interface Asset {
  id: string;
  job_id: string;
  type: "video" | "image";
  url: string;
  thumbnail: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface JobDetail extends JobListItem {
  objective: string;
  model: string;
  cost: number | null;
  error_message: string | null;
  updated_at: string;
  payload: Partial<JobInput>;
  assets: Asset[];
}

export interface GenerateResponse {
  id: string;
  status: string;
}
