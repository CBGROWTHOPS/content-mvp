import { z } from "zod";

export const jobSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  format: z.enum(["reel", "story", "post", "image"]),
  length_seconds: z.number().int().positive().max(60),
  objective: z.enum(["lead_generation", "awareness", "conversion", "engagement"]),
  hook_type: z.enum(["contrast", "question", "pain_point", "statistic", "story"]),
  scene_structure: z.number().int().min(1).max(10),
  model: z.string().min(1, "Model is required"),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});

export type JobInput = z.infer<typeof jobSchema>;
