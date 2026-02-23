import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export interface BrandProfile {
  brand_key: string;
  positioning: string;
  category_reframe: string;
  tagline: string;
  design_tokens: Record<string, string>;
  typography: {
    headline_font: string;
    body_font: string;
    micro_label: {
      uppercase: boolean;
      size_rem: number;
      letter_spacing_em: number;
    };
  };
  layout_rules: {
    pattern: string;
    wide_margins: boolean;
    high_whitespace: boolean;
    single_cta: boolean;
    no_discount_language: boolean;
  };
  collections: Array<{ key: string; label: string; tagline: string }>;
  primary_cta: string;
  secondary_cta: string;
  intake_headline: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const brandsDir = join(__dirname, "..", "brands");

export function loadBrand(brandKey: string): BrandProfile | null {
  try {
    const path = join(brandsDir, `${brandKey}.json`);
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as BrandProfile;
  } catch {
    return null;
  }
}
