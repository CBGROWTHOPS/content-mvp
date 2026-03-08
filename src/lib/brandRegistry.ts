import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supabase } from "./supabase.js";
import type { BrandKit } from "../core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** DB row shape from brand_kits */
interface BrandKitRow {
  id: string;
  name: string;
  slug: string;
  niche: string;
  industry?: string | null;
  icp?: { description?: string } | null;
  voice?: { tone?: string; description?: string } | null;
  visuals?: Record<string, unknown> | null;
  cta_defaults?: { primary?: string } | null;
  guardrails?: string[] | null;
}

/** Path to brands folder. Checks dist/brands first (production), then project root brands/ */
function getBrandsDir(): string {
  const parent = join(__dirname, "..");
  const distBrands = join(parent, "brands");
  if (existsSync(distBrands)) return distBrands;
  const rootBrands = join(parent, "..", "brands");
  return rootBrands;
}

/** Check if a brand folder with brand.json exists on disk */
function hasBrandFile(brandKey: string): boolean {
  const brandsDir = getBrandsDir();
  const brandPath = join(brandsDir, brandKey, "brand.json");
  return existsSync(brandPath);
}

/**
 * Load brand kit from Supabase brand_kits table.
 * Returns null if not found.
 */
export async function getBrandKitFromDB(slug: string): Promise<BrandKit | null> {
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as BrandKitRow;
  const icpDesc = row.icp?.description;
  const voiceVal = row.voice?.tone ?? row.voice?.description;
  const ctaPrimary = row.cta_defaults?.primary;
  const guardrails = row.guardrails ?? [];

  return {
    brand_key: row.slug,
    display_name: row.name,
    positioning: row.niche,
    target_icp: icpDesc ? { audiences: [icpDesc] } : undefined,
    primary_cta: ctaPrimary ?? undefined,
    voice_profile: voiceVal ? { tone_must_be: [voiceVal] } : undefined,
    forbidden_language: guardrails.length > 0 ? guardrails : undefined,
  };
}

/**
 * Load brand for job processing: try DB first, fall back to file system.
 * Throws if neither source has the brand.
 */
export async function loadBrandForJob(brandKey: string): Promise<BrandKit> {
  const db = await getBrandKitFromDB(brandKey);
  if (db) return db;
  if (hasBrandFile(brandKey)) return loadBrand(brandKey);
  throw new Error(`Brand kit not found for slug: ${brandKey}`);
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
