import type { JobInput } from "../../../schema/job.js";
import { loadBrand } from "../../../lib/brand.js";

/**
 * Image kit: 4:5 editorial luxury ads.
 * Structure: MICRO LABEL (optional) → HEADLINE → BODY (1 line) → CTA
 * Uses brand profile for reframing language, primary CTA, no discount tone.
 */
export function build(
  variables: JobInput["variables"],
  brandKey: string,
  collectionKey?: string | null
): string {
  const brand = loadBrand(brandKey);
  const headline = brand?.positioning ?? "LIGHT. CONTROLLED.";
  const cta = brand?.primary_cta ?? "Schedule Design Consultation";
  const microLabel = collectionKey ? getCollectionLabel(brand, collectionKey) : "NA BLINDS";

  const bodyHint = String(variables?.body ?? "Architectural window treatment in modern space.");

  return [
    "EDITORIAL ARCHITECTURAL PHOTOGRAPHY. Background image for overlay.",
    "Style: Warm neutrals, realistic exposure. No HDR glow. No text baked into image.",
    "Focus on light behavior in space. South Florida modern home interior.",
    "Scene: " + bodyHint,
    "",
    "OVERLAY STRUCTURE (for post-processing):",
    `MICRO LABEL: ${microLabel}`,
    `HEADLINE: ${headline}`,
    `BODY: ${bodyHint} (1 short line, architectural, no sales tone)`,
    `CTA: ${cta}`,
    "",
    "Do not bake text into the image. Generate clean architectural photography suitable for typography overlay.",
  ].join("\n");
}

function getCollectionLabel(
  brand: ReturnType<typeof loadBrand>,
  key: string
): string {
  const c = brand?.collections?.find((x) => x.key === key);
  return c?.label ?? key.toUpperCase();
}
