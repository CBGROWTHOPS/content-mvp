/**
 * Higgsfield Platform API client.
 *
 * Railway env: HIGGSFIELD_API_KEY = "id:secret" from cloud.higgsfield.ai → API Keys.
 * When credits are loaded, content generation routes here first; Replicate fallback on error.
 *
 * Base: https://platform.higgsfield.ai
 * Auth: Authorization: Key {id:secret} on every request (no separate auth endpoint).
 */

const HIGGSFIELD_BASE = "https://platform.higgsfield.ai";
const POLL_INTERVAL_MS = 3000;

/** Platform model IDs - see https://docs.higgsfield.ai */
const MODEL_IMAGE = "higgsfield-ai/soul/standard";
const MODEL_VIDEO_BROLL = "higgsfield-ai/dop/standard";
const MODEL_VIDEO_UGC = "kling-video/v2.1/pro";

export class HiggsFieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HiggsFieldError";
  }
}

export interface HiggsfieldGenerateOptions {
  aspectRatio?: string;
  durationSeconds?: number;
  imageUrl?: string;
}

export interface HiggsfieldResult {
  url: string;
  duration?: number;
  width?: number;
  height?: number;
}

function getAuthHeader(): string {
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  if (!apiKey) {
    throw new HiggsFieldError("HIGGSFIELD_API_KEY is not set");
  }
  return `Key ${apiKey}`;
}

async function pollRequestUntilComplete(requestId: string): Promise<HiggsfieldResult> {
  const auth = getAuthHeader();
  const statusUrl = `${HIGGSFIELD_BASE}/requests/${requestId}/status`;

  for (;;) {
    const res = await fetch(statusUrl, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new HiggsFieldError(`Status check failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      status?: string;
      images?: Array<{ url?: string }>;
      video?: { url?: string };
    };

    if (data.status === "failed" || data.status === "error") {
      throw new HiggsFieldError(`Request ${requestId} failed: ${JSON.stringify(data)}`);
    }

    if (data.status === "completed") {
      const url =
        data.images?.[0]?.url ?? data.video?.url;
      if (!url || typeof url !== "string") {
        throw new HiggsFieldError(`Completed but no url in response: ${JSON.stringify(data)}`);
      }
      return { url };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

async function submitToModel(
  modelId: string,
  body: Record<string, unknown>
): Promise<HiggsfieldResult> {
  const auth = getAuthHeader();
  const res = await fetch(`${HIGGSFIELD_BASE}/${modelId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new HiggsFieldError(`Submit failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { request_id?: string; requestId?: string };
  const requestId = data.request_id ?? data.requestId;
  if (!requestId || typeof requestId !== "string") {
    throw new HiggsFieldError(`Response missing request_id: ${JSON.stringify(data)}`);
  }

  return pollRequestUntilComplete(requestId);
}

/**
 * Generate static image (text-to-image).
 */
export async function generateImage(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  return submitToModel(MODEL_IMAGE, {
    prompt,
    aspect_ratio: options?.aspectRatio ?? "9:16",
    resolution: "720p",
  });
}

/**
 * Generate video using DoP Standard (b-roll). Supports text-to-video or image-to-video.
 */
export async function generateVideo(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: options?.aspectRatio ?? "9:16",
    duration: Math.min(5, options?.durationSeconds ?? 4),
  };
  if (options?.imageUrl) {
    body.image_url = options.imageUrl;
  }
  return submitToModel(MODEL_VIDEO_BROLL, body);
}

/**
 * Generate UGC-style video using Kling.
 */
export async function generateUGCVideo(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: options?.aspectRatio ?? "9:16",
    duration: Math.min(5, options?.durationSeconds ?? 4),
  };
  if (options?.imageUrl) {
    body.image_url = options.imageUrl;
  }
  return submitToModel(MODEL_VIDEO_UGC, body);
}

/**
 * Check if Higgsfield is available (key set and valid id:secret format).
 */
export function isHiggsfieldAvailable(): boolean {
  const key = process.env.HIGGSFIELD_API_KEY;
  return !!(key && typeof key === "string" && key.includes(":"));
}
