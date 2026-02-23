const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export async function fetchJobs(): Promise<
  { data: unknown[] } | { error: string }
> {
  try {
    const res = await fetch(`${getBaseUrl()}/jobs`, {
      cache: "no-store",
    });
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

export interface BrandProfile {
  brand_key: string;
  positioning?: string;
  collections?: Array<{ key: string; label: string; tagline?: string }>;
  primary_cta?: string;
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

export async function generateContent(
  brandId: string,
  strategySelection: import("@/types/strategy").StrategySelection
): Promise<{ data: import("@/types/generate").GenerateResponse } | { error: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, strategySelection }),
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
