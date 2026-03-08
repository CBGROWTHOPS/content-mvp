/**
 * Higgsfield Cloud API client.
 *
 * Railway env: Add HIGGSFIELD_API_KEY from cloud.higgsfield.ai → API Keys.
 * When credits are loaded, content generation routes here first; Replicate fallback on error.
 */

const HIGGSFIELD_BASE = "https://cloud.higgsfield.ai/api/v1";
const POLL_INTERVAL_MS = 3000;

let cachedBearerToken: string | null = null;

/** Clear cached token. Call on 401 to force refresh on next request. */
export function clearCachedHiggsfieldToken(): void {
  cachedBearerToken = null;
}

export class HiggsFieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HiggsFieldError";
  }
}

export interface HiggsfieldGenerateOptions {
  aspectRatio?: string;
  durationSeconds?: number;
}

export interface HiggsfieldResult {
  url: string;
  duration?: number;
  width?: number;
  height?: number;
}

async function getBearerToken(): Promise<string> {
  if (cachedBearerToken) return cachedBearerToken;

  const apiKey = process.env.HIGGSFIELD_API_KEY;
  if (!apiKey) {
    throw new HiggsFieldError("HIGGSFIELD_API_KEY is not set");
  }

  console.log("Higgsfield auth request:", {
    url: "https://cloud.higgsfield.ai/api/v1/auth",
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 8),
  });

  const res = await fetch(`${HIGGSFIELD_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await res.text();
  console.log("Higgsfield auth response:", res.status, responseText);

  if (!res.ok) {
    throw new HiggsFieldError(`Auth failed: ${res.status} ${responseText}`);
  }

  const data = JSON.parse(responseText) as { token?: string; access_token?: string; bearer?: string };
  const token = data.token ?? data.access_token ?? data.bearer;
  if (!token || typeof token !== "string") {
    throw new HiggsFieldError("Auth response missing token");
  }

  cachedBearerToken = token;
  return token;
}

async function pollJobUntilComplete(jobId: string): Promise<HiggsfieldResult> {
  let token = await getBearerToken();

  for (;;) {
    const res = await fetch(`${HIGGSFIELD_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 401) {
      clearCachedHiggsfieldToken();
      token = await getBearerToken();
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new HiggsFieldError(`Job status failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      status?: string;
      result?: { url?: string; duration?: number; width?: number; height?: number };
      output?: string;
      video?: string;
      image?: string;
    };

    if (data.status === "failed" || data.status === "error") {
      throw new HiggsFieldError(`Job ${jobId} failed: ${JSON.stringify(data)}`);
    }

    if (data.status === "completed" || data.status === "done") {
      const url =
        data.result?.url ??
        (typeof data.output === "string" ? data.output : null) ??
        data.video ??
        data.image;
      if (!url || typeof url !== "string") {
        throw new HiggsFieldError(`Job completed but no url in response: ${JSON.stringify(data)}`);
      }
      return {
        url,
        duration: data.result?.duration,
        width: data.result?.width,
        height: data.result?.height,
      };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

async function submitGenerate(
  model: string,
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  const token = await getBearerToken();
  const duration = Math.min(4, options?.durationSeconds ?? 4);

  const body = {
    model,
    prompt,
    aspect_ratio: options?.aspectRatio ?? "9:16",
    duration,
  };

  let res = await fetch(`${HIGGSFIELD_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 401) {
    clearCachedHiggsfieldToken();
    const newToken = await getBearerToken();
    res = await fetch(`${HIGGSFIELD_BASE}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new HiggsFieldError(`Generate failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { job_id?: string; id?: string; jobId?: string };
  const jobId = data.job_id ?? data.id ?? data.jobId;
  if (!jobId || typeof jobId !== "string") {
    throw new HiggsFieldError(`Generate response missing job_id: ${JSON.stringify(data)}`);
  }

  return pollJobUntilComplete(jobId);
}

/**
 * Generate video using DoP Standard model (b-roll / TOF).
 */
export async function generateVideo(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  return submitGenerate("dop-standard", prompt, options);
}

/**
 * Generate UGC-style video using Kling 3.0 model (ugc / social).
 */
export async function generateUGCVideo(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  return submitGenerate("kling-3.0", prompt, options);
}

/**
 * Generate static image using Nano Banana Pro.
 */
export async function generateImage(
  prompt: string,
  options?: HiggsfieldGenerateOptions
): Promise<HiggsfieldResult> {
  return submitGenerate("nano-banana-pro", prompt, options);
}

/**
 * Check if Higgsfield is available (API key set).
 */
export function isHiggsfieldAvailable(): boolean {
  return !!process.env.HIGGSFIELD_API_KEY;
}
