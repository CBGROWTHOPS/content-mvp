import { z } from "zod";

const formatEnum = z.enum([
  "reel",
  "story",
  "post",
  "image",
  "image_kit",
  "reel_kit",
  "wide_video_kit",
]);
const qualityEnum = z.enum(["draft", "final"]);
const aspectRatioEnum = z.enum(["1:1", "4:5", "9:16", "16:9"]);
const hookTypeEnum = z.enum([
  "contrast",
  "question",
  "pain_point",
  "statistic",
  "story",
  "concept",
  "motorized_demo",
]);

const baseJobSchema = z.object({
  brand_key: z.string().optional(),
  brand: z.string().optional(), // backward compat
  format: formatEnum,
  model_key: z.string().optional(),
  model: z.string().optional(),
  quality: qualityEnum.optional(),
  objective: z.enum(["lead_generation", "awareness", "conversion", "engagement"]),
  hook_type: hookTypeEnum.optional(),
  length_seconds: z.number().int().positive().max(60).optional(),
  scene_structure: z.number().int().min(1).max(10).optional(),
  aspect_ratio: aspectRatioEnum.optional(),
  collection: z.string().optional(),
  reel_kit_hook_type: z.enum(["contrast", "concept", "motorized_demo"]).optional(),
  wide_video_project_type: z.enum(["high-rise", "single-family", "townhouse"]).optional(),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});

export const jobSchema = baseJobSchema
  .transform((data) => {
    const { model, brand, collection, reel_kit_hook_type, wide_video_project_type, variables = {}, ...rest } = data;
    const brand_key = data.brand_key ?? brand ?? "default";
    const mergedVars = { ...variables };
    if (collection) mergedVars.collection = collection;
    if (reel_kit_hook_type) mergedVars.reel_kit_hook = reel_kit_hook_type;
    if (wide_video_project_type) mergedVars.project_type = wide_video_project_type;
    const hook_type = reel_kit_hook_type ?? data.hook_type;
    return {
      ...rest,
      brand_key,
      model_key: data.model_key ?? model ?? undefined,
      hook_type,
      variables: mergedVars,
    };
  })
  .refine((data) => data.brand_key && data.brand_key.length > 0, {
    message: "brand_key or brand is required",
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
  )
  .refine(
    (data) => {
      if (data.format === "image_kit") {
        return data.aspect_ratio === "4:5" || !data.aspect_ratio;
      }
      return true;
    },
    { message: "image_kit uses 4:5 aspect ratio" }
  )
  .refine(
    (data) => {
      if (data.format === "reel_kit") {
        return (
          typeof data.length_seconds === "number" ||
          data.length_seconds === undefined
        );
      }
      return true;
    },
    { message: "length_seconds required for reel_kit (defaults to 6)" }
  )
  .refine(
    (data) => {
      if (data.format === "wide_video_kit") {
        return data.aspect_ratio === "16:9" || !data.aspect_ratio;
      }
      return true;
    },
    { message: "wide_video_kit uses 16:9 aspect ratio" }
  );

export type JobInput = z.infer<typeof jobSchema>;
