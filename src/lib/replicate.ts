import Replicate from "replicate";

export interface ReplicateRunResult {
  url: string;
  cost?: number | null;
}

export interface RunReplicateOptions {
  lengthSeconds?: number;
  aspectRatio?: string;
}

export async function runReplicate(
  providerModelId: string,
  prompt: string,
  options?: RunReplicateOptions
): Promise<ReplicateRunResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  const replicate = new Replicate({ auth: token });
  const modelPath = providerModelId;

  const input: Record<string, unknown> = {
    prompt,
    ...(options?.lengthSeconds && { duration: Math.min(options.lengthSeconds, 6) }),
    ...(options?.aspectRatio && { aspect_ratio: options.aspectRatio }),
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
