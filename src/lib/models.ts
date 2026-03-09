export type JobFormat =
  | "reel"
  | "story"
  | "post"
  | "image"
  | "image_kit"
  | "reel_kit"
  | "wide_video_kit";
export type Quality = "draft" | "final";
export type VideoGenerationMode = "image_first" | "direct_text_to_video";
export type ReelType = "text_overlay" | "voiceover" | "broll" | "talking_head" | "ugc";

export interface ModelConfig {
  provider_model_id: string;
  formats_supported: JobFormat[];
  default_for_format: Partial<Record<JobFormat, boolean>>;
  cost_tier: string;
  short_description: string;
  replicate_page_url: string;
  videoMode?: VideoGenerationMode;
}

/** Higgsfield-first provider IDs for display. Actual routing uses isHiggsfieldAvailable() in worker. */
function getProviderModelId(format: JobFormat, reelType?: ReelType | null): string {
  if (format === "image" || format === "image_kit") {
    return "higgsfield-nano-banana-pro+replicate-flux-fallback";
  }
  if (format === "reel" || format === "story" || format === "post" || format === "reel_kit" || format === "wide_video_kit") {
    return reelType === "ugc"
      ? "higgsfield-kling-3.0+replicate-kling-fallback"
      : "higgsfield-dop-standard+replicate-veo3-fallback";
  }
  return "higgsfield-dop-standard+replicate-veo3-fallback";
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
  "image-first-pipeline": {
    provider_model_id: "higgsfield-dop-standard+replicate-veo3-fallback",
    formats_supported: ["reel", "story", "post", "reel_kit", "wide_video_kit"],
    default_for_format: { reel: true, reel_kit: true, wide_video_kit: true },
    cost_tier: "~$0.13/video (Higgsfield first, Replicate fallback)",
    short_description: "Higgsfield DoP/Kling first, Replicate fallback. Images + video.",
    replicate_page_url: "https://platform.higgsfield.ai",
    videoMode: "image_first",
  },
  "minimax-video-01": {
    provider_model_id: "minimax/video-01",
    formats_supported: ["reel", "story", "post", "reel_kit", "wide_video_kit"],
    default_for_format: {},
    cost_tier: "~$0.20/video",
    short_description: "Direct text-to-video, 720p, up to 6s. Less controllable.",
    replicate_page_url: "https://replicate.com/minimax/video-01",
    videoMode: "direct_text_to_video",
  },
  "stable-video-diffusion": {
    provider_model_id: "stability-ai/stable-video-diffusion",
    formats_supported: ["reel", "story", "post", "reel_kit", "wide_video_kit"],
    default_for_format: {},
    cost_tier: "~$0.10/video",
    short_description: "Image-to-video animation from stills (requires image input)",
    replicate_page_url: "https://replicate.com/stability-ai/stable-video-diffusion",
    videoMode: "image_first",
  },
  "flux-schnell": {
    provider_model_id: "higgsfield-nano-banana-pro+replicate-flux-fallback",
    formats_supported: ["image", "image_kit"],
    default_for_format: { image: true, image_kit: true },
    cost_tier: "~$0.003/image (Higgsfield first, Replicate fallback)",
    short_description: "Higgsfield first, Flux fallback. Fast text-to-image.",
    replicate_page_url: "https://platform.higgsfield.ai",
  },
  "flux-dev": {
    provider_model_id: "black-forest-labs/flux-dev",
    formats_supported: ["image", "image_kit"],
    default_for_format: {},
    cost_tier: "~$0.03/image",
    short_description: "High-quality open-weight, strong prompt adherence",
    replicate_page_url: "https://replicate.com/black-forest-labs/flux-dev",
  },
  "sdxl": {
    provider_model_id: "stability-ai/sdxl",
    formats_supported: ["image", "image_kit"],
    default_for_format: {},
    cost_tier: "~$0.02/image",
    short_description: "Stable Diffusion XL, versatile and widely used",
    replicate_page_url: "https://replicate.com/stability-ai/sdxl",
  },
};

export interface SelectedModel {
  key: string;
  provider_model_id: string;
  videoMode?: VideoGenerationMode;
}

/**
 * Select model for generation. Uses override if provided and valid for format;
 * otherwise picks default for format. Returns Higgsfield-first provider_model_id.
 * reelType: for video jobs, pass 'ugc' for Kling path, else DoP.
 */
export function selectModel(
  format: JobFormat,
  quality?: Quality,
  modelKeyOverride?: string | null,
  reelType?: ReelType | null
): SelectedModel {
  let key: string = "image-first-pipeline"; // default
  let videoMode: VideoGenerationMode | undefined;

  if (modelKeyOverride) {
    const config = MODEL_CONFIG[modelKeyOverride];
    if (config?.formats_supported.includes(format)) {
      key = modelKeyOverride;
      videoMode = config.videoMode;
    } else {
      key = modelKeyOverride;
      videoMode = undefined;
    }
  } else {
    let found = false;
    for (const [k, config] of Object.entries(MODEL_CONFIG)) {
      if (config.formats_supported.includes(format) && config.default_for_format[format]) {
        key = k;
        videoMode = config.videoMode;
        found = true;
        break;
      }
    }
    if (!found) {
      for (const [k, config] of Object.entries(MODEL_CONFIG)) {
        if (config.formats_supported.includes(format)) {
          key = k;
          videoMode = config.videoMode;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      throw new Error(`No model configured for format: ${format}`);
    }
  }

  const provider_model_id = getProviderModelId(format, reelType);
  return { key, provider_model_id, videoMode };
}

export function getModelsForApi(): Array<{
  key: string;
  provider_model_id: string;
  formats_supported: string[];
  default_for_format: Record<string, boolean>;
  cost_tier: string;
  short_description: string;
  replicate_page_url: string;
  video_mode?: VideoGenerationMode;
}> {
  return Object.entries(MODEL_CONFIG).map(([key, config]) => ({
    key,
    provider_model_id: config.provider_model_id,
    formats_supported: config.formats_supported,
    default_for_format: config.default_for_format as Record<string, boolean>,
    cost_tier: config.cost_tier,
    short_description: config.short_description,
    replicate_page_url: config.replicate_page_url,
    video_mode: config.videoMode,
  }));
}
