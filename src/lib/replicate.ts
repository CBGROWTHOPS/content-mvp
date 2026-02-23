import Replicate from "replicate";

const MODEL_MAP: Record<string, string> = {
  "video-model-x": "minimax/video-01",
  "stable-video": "stability-ai/stable-video-diffusion",
};

export interface ReplicateRunResult {
  url: string;
  cost?: number | null;
}

export async function runReplicate(
  modelKey: string,
  prompt: string,
  options?: { lengthSeconds?: number }
): Promise<ReplicateRunResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  const replicate = new Replicate({ auth: token });
  const modelPath = MODEL_MAP[modelKey] ?? modelKey;

  const input: Record<string, unknown> = {
    prompt,
    ...(options?.lengthSeconds && { duration: Math.min(options.lengthSeconds, 6) }),
  };

  const output = await replicate.run(modelPath as `${string}/${string}`, { input });

  let url: string;
  if (typeof output === "string") {
    url = output;
  } else if (output && typeof output === "object" && "output" in (output as object)) {
    const out = (output as { output: string | string[] }).output;
    url = Array.isArray(out) ? out[0] ?? "" : out;
  } else if (output && typeof output === "object" && "url" in (output as object)) {
    url = (output as { url: string }).url;
  } else if (output && typeof output === "object" && "video" in (output as object)) {
    url = (output as { video: string }).video;
  } else {
    throw new Error(`Unexpected Replicate output format: ${JSON.stringify(output)}`);
  }

  return { url, cost: null };
}
