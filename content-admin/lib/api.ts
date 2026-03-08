const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export async function fetchJobs(params?: {
  funnel_stage?: string;
  content_intent?: string;
}): Promise<{ data: unknown[] } | { error: string }> {
  try {
    const search = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(
              (kv): kv is [string, string] => !!kv[1]
            )
          )
        ).toString()
      : "";
    const url = search ? `${getBaseUrl()}/jobs?${search}` : `${getBaseUrl()}/jobs`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch jobs",
    };
  }
}

export async function fetchJob(
  id: string
): Promise<{ data: unknown } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/jobs/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Job not found" };
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch job",
    };
  }
}

export interface ApiModel {
  key: string;
  provider_model_id: string;
  formats_supported: string[];
  default_for_format: Record<string, boolean>;
  cost_tier: string;
  short_description: string;
  replicate_page_url: string;
}

export interface StrategyPresetOption {
  id: string;
  label: string;
  strategy: Record<string, unknown>;
}

export interface BrandProfile {
  brand_key: string;
  positioning?: string;
  collections?: Array<{ key: string; label: string; tagline?: string }>;
  primary_cta?: string;
  /** Strategy presets - from brand kit. Use DEFAULT_STRATEGY_PRESETS when empty. */
  strategy_presets?: StrategyPresetOption[];
  /** Product catalog for brand-aware selectors */
  kit?: {
    selectors?: {
      productCatalog?: {
        categories: Array<{
          id: string;
          label: string;
          types: Array<{ id: string; label: string; copyDirection?: string }>;
        }>;
      };
    };
  };
}

export async function fetchBrands(): Promise<
  { data: Array<{ key: string; display_name: string }> } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/brands`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as Array<{ key: string; display_name: string }> };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch brands",
    };
  }
}

// Brand Kits (DB) - new endpoints
export interface BrandKit {
  id: string;
  name: string;
  slug: string;
  niche: string;
  industry?: string | null;
  icp?: Record<string, unknown> | null;
  voice?: Record<string, unknown> | null;
  visuals?: Record<string, unknown> | null;
  cta_defaults?: Record<string, unknown> | null;
  guardrails?: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchBrandKits(): Promise<
  { data: BrandKit[] } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/brand-kits`, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as BrandKit[] };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch brand kits",
    };
  }
}

export async function fetchBrandKit(
  idOrSlug: string
): Promise<{ data: BrandKit } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/brand-kits/${idOrSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Brand kit not found" };
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as BrandKit };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch brand kit",
    };
  }
}

export async function createBrandKit(body: Partial<BrandKit>): Promise<
  { data: BrandKit } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/brand-kits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json as { error?: string }).error ?? res.statusText };
    }
    return { data: json as BrandKit };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create brand kit",
    };
  }
}

export async function updateBrandKit(
  id: string,
  body: Partial<BrandKit>
): Promise<{ data: BrandKit } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/brand-kits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json as { error?: string }).error ?? res.statusText };
    }
    return { data: json as BrandKit };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to update brand kit",
    };
  }
}

export async function deleteBrandKit(
  id: string
): Promise<{ data: null } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/brand-kits/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: (json as { error?: string }).error ?? res.statusText };
    }
    return { data: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete brand kit",
    };
  }
}

export async function fetchHealth(): Promise<
  { data: { status: string; elevenlabs?: string } } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/health`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (data as { error?: string }).error ?? res.statusText };
    }
    return { data: data as { status: string; elevenlabs?: string } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch health",
    };
  }
}

export async function fetchBrand(
  key: string
): Promise<{ data: BrandProfile } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/brands/${key}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Brand not found" };
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as BrandProfile };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch brand",
    };
  }
}

export async function fetchModels(): Promise<
  { data: ApiModel[] } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/models`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as ApiModel[] };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch models",
    };
  }
}

export interface TokenEstimate {
  estimatedInput: number;
  estimatedOutput: number;
  estimatedTotal: number;
}

export async function fetchTokenEstimate(
  brandId: string,
  strategySelection: {
    campaignObjective: string;
    audienceContext: string;
    propertyType: string;
    visualEnergy: string;
    hookFramework: string;
    platformFormat: string;
    directionLevel?: string;
  }
): Promise<{ data: TokenEstimate } | { error: string }> {
  try {
    const params = new URLSearchParams({
      brandId,
      strategySelection: JSON.stringify(strategySelection),
    });
    const res = await fetch(`${getBaseUrl()}/generate-content/estimate?${params}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (json as { error?: string }).error ?? res.statusText;
      return { error: msg };
    }
    return { data: json as TokenEstimate };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch token estimate",
    };
  }
}

export async function fetchGeneration(
  generationId: string
): Promise<{ data: import("@/types/generate").GenerateResponse } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/generations/${generationId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Generation not found" };
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const data = await res.json();
    return { data: data as import("@/types/generate").GenerateResponse };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch generation",
    };
  }
}

export async function generateContent(
  brandId: string,
  strategySelection: import("@/types/strategy").StrategySelection,
  options?: { funnel_stage?: string; content_intent?: string }
): Promise<{ data: import("@/types/generate").GenerateResponse } | { error: string }> {
  try {
    const body: Record<string, unknown> = { brandId, strategySelection };
    if (options?.funnel_stage) body.funnel_stage = options.funnel_stage;
    if (options?.content_intent) body.content_intent = options.content_intent;
    const res = await fetch(`${getBaseUrl()}/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (json as { error?: string }).error ??
        (json as { details?: unknown }).details
          ? JSON.stringify((json as { details?: unknown }).details)
          : res.statusText;
      return { error: msg };
    }
    return { data: json as import("@/types/generate").GenerateResponse };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate content",
    };
  }
}

export async function upgradePrompt(
  prompt: string
): Promise<{ data: { upgradedPrompt: string } } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/upgrade-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      upgradedPrompt?: string;
      error?: string;
    };
    if (!res.ok) {
      return { error: json.error ?? res.statusText };
    }
    return { data: { upgradedPrompt: json.upgradedPrompt ?? prompt } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to upgrade prompt",
    };
  }
}

export async function runFlow(
  flowId: string,
  body: Record<string, unknown>
): Promise<{ data: Record<string, unknown> } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/flows/${flowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (json as { error?: string }).error ?? res.statusText;
      return { error: msg };
    }
    return { data: json as Record<string, unknown> };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Flow failed" };
  }
}

export async function createJob(
  payload: object
): Promise<{ data: { id: string; status: string } } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (json as { error?: string }).error ??
        (json as { details?: unknown }).details
          ? JSON.stringify((json as { details?: unknown }).details)
          : res.statusText;
      return { error: msg };
    }
    return { data: json as { id: string; status: string } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create job",
    };
  }
}

// Compact Brief API

export interface CompactCreativeBrief {
  v: 1;
  concept: string;
  tone: string;
  look: string;
  camera: string;
  light: string;
  music: string;
  vo: string;
  text: string;
  rules: string[];
}

export interface BriefPreset {
  id: string;
  concept: string;
}

export interface CompactBriefResult {
  brief: CompactCreativeBrief;
  briefKey: string;
  cached: boolean;
  tokenUsage: { prompt: number; completion: number; total: number };
}

export async function fetchBriefPresets(): Promise<
  { data: BriefPreset[] } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/brief-presets`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { error: (err as { error?: string }).error ?? res.statusText };
    }
    const json = await res.json();
    return { data: (json as { presets: BriefPreset[] }).presets };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to fetch presets",
    };
  }
}

export async function generateCompactBrief(
  params: {
    brandId?: string;
    goal?: string;
    topic?: string;
    audience?: string;
    style?: string;
    constraints?: string;
    usePreset?: string;
    skipCache?: boolean;
  }
): Promise<{ data: CompactBriefResult } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/compact-brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json as { error?: string }).error ?? res.statusText };
    }
    return { data: json as CompactBriefResult };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate brief",
    };
  }
}

export interface StoryboardResult {
  shots: Array<{
    shotId: string;
    timeStart: number;
    timeEnd: number;
    shotType: string;
    cameraMovement: string;
    sceneDescription: string;
    visualSource: string;
    videoPrompt?: string;
    onScreenText?: { text: string };
    lightingNotes?: string;
  }>;
  voiceoverScript?: {
    fullScript: string;
    segments: Array<{ shotId: string; text: string; emotion?: string }>;
  };
  musicTrack?: { mood: string; tempo: string; genre?: string };
  tokenUsage: { prompt: number; completion: number; total: number };
}

export async function generateStoryboard(
  params: {
    brief: CompactCreativeBrief;
    durationSeconds: number;
    shotCount: number;
    reelType: "text_overlay" | "voiceover" | "broll" | "talking_head";
  }
): Promise<{ data: StoryboardResult } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/storyboard-from-brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json as { error?: string }).error ?? res.statusText };
    }
    return { data: json as StoryboardResult };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate storyboard",
    };
  }
}
