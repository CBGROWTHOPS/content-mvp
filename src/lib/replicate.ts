import Replicate from "replicate";

export interface ReplicateRunResult {
  url: string;
  cost?: number | null;
}

export interface RunReplicateOptions {
  lengthSeconds?: number;
  aspectRatio?: string;
}

export interface ImageGenerationOptions {
  aspectRatio?: string;
  negativePrompt?: string;
  numInferenceSteps?: number;
}

export interface ImageToVideoOptions {
  motionBucketId?: number;
  fps?: number;
  condAug?: number;
}

function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }
  return new Replicate({ auth: token });
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") {
    return output;
  } else if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return output[0];
  } else if (output && typeof output === "object" && "output" in (output as object)) {
    const out = (output as { output: string | string[] }).output;
    return Array.isArray(out) ? out[0] ?? "" : out;
  } else if (output && typeof output === "object" && "url" in (output as object)) {
    return (output as { url: string }).url;
  } else if (output && typeof output === "object" && "video" in (output as object)) {
    return (output as { video: string }).video;
  } else if (output && typeof output === "object" && "image" in (output as object)) {
    return (output as { image: string }).image;
  }
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(output)}`);
}

/**
 * Generate an image from text prompt using Flux.
 * Returns image URL that can be passed to imageToVideo.
 */
export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<ReplicateRunResult> {
  const replicate = getReplicateClient();
  
  const enhancedPrompt = `${prompt}. High quality, photorealistic, cinematic lighting, sharp focus, professional photography`;
  
  const input: Record<string, unknown> = {
    prompt: enhancedPrompt,
    go_fast: true,
    num_outputs: 1,
    output_format: "png",
    output_quality: 90,
    ...(options?.aspectRatio && { aspect_ratio: options.aspectRatio }),
    ...(options?.negativePrompt && { negative_prompt: options.negativePrompt }),
    ...(options?.numInferenceSteps && { num_inference_steps: options.numInferenceSteps }),
  };

  const output = await replicate.run("black-forest-labs/flux-dev" as `${string}/${string}`, { input });
  const url = extractUrl(output);
  
  return { url, cost: 0.03 };
}

/**
 * Animate an image into video using Stable Video Diffusion.
 * Takes an image URL and returns video URL.
 */
export async function imageToVideo(
  imageUrl: string,
  options?: ImageToVideoOptions
): Promise<ReplicateRunResult> {
  const replicate = getReplicateClient();
  
  const input: Record<string, unknown> = {
    input_image: imageUrl,
    video_length: "25_frames_with_svd_xt",
    sizing_strategy: "maintain_aspect_ratio",
    frames_per_second: options?.fps ?? 6,
    motion_bucket_id: options?.motionBucketId ?? 127,
    cond_aug: options?.condAug ?? 0.02,
  };

  const output = await replicate.run("stability-ai/stable-video-diffusion" as `${string}/${string}`, { input });
  const url = extractUrl(output);
  
  return { url, cost: 0.10 };
}

/**
 * Full image-to-video pipeline: generate image then animate it.
 * More controllable than direct text-to-video.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  options?: { aspectRatio?: string; motionIntensity?: "low" | "medium" | "high" }
): Promise<{ imageUrl: string; videoUrl: string; totalCost: number }> {
  const motionBucket = options?.motionIntensity === "low" ? 50 
    : options?.motionIntensity === "high" ? 200 
    : 127;
  
  const imageResult = await generateImage(prompt, {
    aspectRatio: options?.aspectRatio,
    negativePrompt: "blurry, low quality, abstract, void, blank, amateur, watermark",
  });
  
  const videoResult = await imageToVideo(imageResult.url, {
    motionBucketId: motionBucket,
    fps: 6,
  });
  
  return {
    imageUrl: imageResult.url,
    videoUrl: videoResult.url,
    totalCost: (imageResult.cost ?? 0) + (videoResult.cost ?? 0),
  };
}

/**
 * Direct text-to-video using minimax (legacy, less controllable).
 */
export async function runReplicate(
  providerModelId: string,
  prompt: string,
  options?: RunReplicateOptions
): Promise<ReplicateRunResult> {
  const replicate = getReplicateClient();

  const input: Record<string, unknown> = {
    prompt,
    ...(options?.lengthSeconds && { duration: Math.min(options.lengthSeconds, 6) }),
    ...(options?.aspectRatio && { aspect_ratio: options.aspectRatio }),
  };

  const output = await replicate.run(providerModelId as `${string}/${string}`, { input });
  const url = extractUrl(output);

  return { url, cost: null };
}
