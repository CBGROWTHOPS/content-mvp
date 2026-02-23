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
const collectionEnum = z.enum(["sheer", "soft", "dark", "smart"]);
const reelKitHookEnum = z.enum(["contrast", "concept", "motorized_demo"]);
const wideVideoProjectEnum = z.enum(["high-rise", "single-family", "townhouse"]);

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
  collection: collectionEnum.optional(),
  reel_kit_hook_type: reelKitHookEnum.optional(),
  wide_video_project_type: wideVideoProjectEnum.optional(),
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
