import type { GenerateResponse } from "@/types/generate";
import type { StrategySelection } from "@/types/strategy";

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export interface SaveToDriveResult {
  success: boolean;
  fileUrls?: string[];
  error?: string;
}

export async function saveToDrive(
  brandId: string,
  strategySelection: StrategySelection,
  generateResponse: GenerateResponse
): Promise<SaveToDriveResult> {
  try {
    const res = await fetch(`${getBaseUrl()}/save-to-drive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generateResponse,
        strategySelection,
        brandId,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      fileUrls?: string[];
      error?: string;
    };
    if (!res.ok) {
      return {
        success: false,
        error: json.error ?? res.statusText,
      };
    }
    return {
      success: json.success ?? true,
      fileUrls: json.fileUrls,
      error: json.error,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to save to Drive",
    };
  }
}
