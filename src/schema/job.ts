import { z } from "zod";

const formatEnum = z.enum(["reel", "story", "post", "image"]);
const qualityEnum = z.enum(["draft", "final"]);
const aspectRatioEnum = z.enum(["1:1", "4:5", "9:16", "16:9"]);

const baseJobSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  format: formatEnum,
  model_key: z.string().optional(),
  model: z.string().optional(), // backward compat: used as model_key override
  quality: qualityEnum.optional(),
  objective: z.enum(["lead_generation", "awareness", "conversion", "engagement"]),
  hook_type: z.enum(["contrast", "question", "pain_point", "statistic", "story"]),
  length_seconds: z.number().int().positive().max(60).optional(),
  scene_structure: z.number().int().min(1).max(10).optional(),
  aspect_ratio: aspectRatioEnum.optional(),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});

export const jobSchema = baseJobSchema
  .transform((data) => {
    const { model, ...rest } = data;
    return {
      ...rest,
      model_key: data.model_key ?? model ?? undefined,
    };
  })
  .refine(
    (data) => {
      if (data.format === "reel" || data.format === "story" || data.format === "post") {
        return (
          typeof data.length_seconds === "number" &&
          typeof data.scene_structure === "number"
        );
      }
      return true;
    },
    { message: "length_seconds and scene_structure required for reel/story/post" }
  )
  .refine(
    (data) => {
      if (data.format === "image") {
        return typeof data.aspect_ratio === "string";
      }
      return true;
    },
    { message: "aspect_ratio required for image format" }
  );

export type JobInput = z.infer<typeof jobSchema>;
