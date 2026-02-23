import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { BrandKit } from "../core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Path to brands folder. Checks dist/brands first (production), then project root brands/ */
function getBrandsDir(): string {
  const parent = join(__dirname, "..");
  const distBrands = join(parent, "brands");
  if (existsSync(distBrands)) return distBrands;
  const rootBrands = join(parent, "..", "brands");
  return rootBrands;
}

const defaultBrand: BrandKit = {
  brand_key: "default",
  display_name: "Default",
  positioning: "Premium quality.",
  primary_cta: "Learn more",
  default_micro_label: "BRAND",
};

/**
 * Load and merge brand kit from brands/<brand_key>/.
 * Reads brand.json and tokens.json, merges into normalized BrandKit.
 * Returns default brand if folder or brand.json missing.
 */
export function loadBrand(brandKey: string): BrandKit {
  const brandsDir = getBrandsDir();
  const brandDir = join(brandsDir, brandKey);
  if (!existsSync(brandDir)) {
    return { ...defaultBrand, brand_key: brandKey };
  }
  const brandPath = join(brandDir, "brand.json");
  if (!existsSync(brandPath)) {
    return { ...defaultBrand, brand_key: brandKey };
  }
  let brand: Record<string, unknown>;
  try {
    const raw = readFileSync(brandPath, "utf-8");
    brand = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ...defaultBrand, brand_key: brandKey };
  }
  const tokensPath = join(brandDir, "tokens.json");
  if (existsSync(tokensPath)) {
    try {
      const tokens = JSON.parse(readFileSync(tokensPath, "utf-8")) as Record<string, unknown>;
      brand = { ...brand, ...tokens };
    } catch {
      // ignore
    }
  }
  return {
    ...defaultBrand,
    ...brand,
    brand_key: (brand.brand_key as string) ?? brandKey,
  } as BrandKit;
}

/**
 * List available brand keys (subdirs of brands/)
 */
export function listBrandKeys(): string[] {
  const brandsDir = getBrandsDir();
  if (!existsSync(brandsDir)) return [];
  try {
    return readdirSync(brandsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}
