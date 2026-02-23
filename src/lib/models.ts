export type JobFormat = "reel" | "story" | "post" | "image";
export type Quality = "draft" | "final";

export interface ModelConfig {
  provider_model_id: string;
  formats_supported: JobFormat[];
  default_for_format: Partial<Record<JobFormat, boolean>>;
  cost_tier: string;
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
  "video-model-x": {
    provider_model_id: "minimax/video-01",
    formats_supported: ["reel", "story", "post"],
    default_for_format: { reel: true },
    cost_tier: "standard",
  },
  "stable-video": {
    provider_model_id: "stability-ai/stable-video-diffusion",
    formats_supported: ["reel", "story", "post"],
    default_for_format: {},
    cost_tier: "standard",
  },
  "image-default": {
    provider_model_id: "stability-ai/sdxl",
    formats_supported: ["image"],
    default_for_format: { image: true },
    cost_tier: "standard",
  },
};

export interface SelectedModel {
  key: string;
  provider_model_id: string;
}

/**
 * Select model for generation. Uses override if provided and valid for format;
 * otherwise picks default for format. Quality is stubbed for Phase 2.1.
 */
export function selectModel(
  format: JobFormat,
  quality?: Quality,
  modelKeyOverride?: string | null
): SelectedModel {
  if (modelKeyOverride) {
    const config = MODEL_CONFIG[modelKeyOverride];
    if (config?.formats_supported.includes(format)) {
      return { key: modelKeyOverride, provider_model_id: config.provider_model_id };
    }
  }

  for (const [key, config] of Object.entries(MODEL_CONFIG)) {
    if (config.formats_supported.includes(format) && config.default_for_format[format]) {
      return { key, provider_model_id: config.provider_model_id };
    }
  }

  // Fallback: first model that supports format
  for (const [key, config] of Object.entries(MODEL_CONFIG)) {
    if (config.formats_supported.includes(format)) {
      return { key, provider_model_id: config.provider_model_id };
    }
  }

  throw new Error(`No model configured for format: ${format}`);
}

export function getModelsForApi(): Array<{
  key: string;
  provider_model_id: string;
  formats_supported: string[];
  default_for_format: Record<string, boolean>;
  cost_tier: string;
}> {
  return Object.entries(MODEL_CONFIG).map(([key, config]) => ({
    key,
    provider_model_id: config.provider_model_id,
    formats_supported: config.formats_supported,
    default_for_format: config.default_for_format as Record<string, boolean>,
    cost_tier: config.cost_tier,
  }));
}
