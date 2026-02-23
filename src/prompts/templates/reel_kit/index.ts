import type { JobInput } from "../../../schema/job.js";
import { loadBrand } from "../../../lib/brand.js";

export type ReelKitHookType = "contrast" | "concept" | "motorized_demo";

/**
 * Reel kit: 9:16 transformation structure.
 * Label → Headline → Transformation → CTA
 * Primary format: UNCONTROLLED → DESIGNED. Calm, deliberate, static camera.
 */
export function build(
  variables: JobInput["variables"],
  brandKey: string,
  hookType: ReelKitHookType
): string {
  const brand = loadBrand(brandKey);
  const headline = brand?.positioning ?? "LIGHT. CONTROLLED.";
  const cta = brand?.primary_cta ?? "Schedule Design Consultation";

  if (hookType === "contrast") {
    return [
      "REEL STRUCTURE - 6 second contrast. Static camera. Natural light. No flashy transitions.",
      "",
      "Scene 1 (UNCONTROLLED):",
      "Raw, authentic space. Natural lighting, uncurated. Light flooding in without control.",
      "",
      "Scene 2 (DESIGNED):",
      "Same space with window treatment. Polished, aspirational. Light controlled.",
      "",
      "End Frame:",
      headline,
      cta,
      "",
      "Tone: Calm, deliberate. Feels like editorial, not ad creative. No aggressive text motion.",
    ].join("\n");
  }

  if (hookType === "concept") {
    const concept = String(variables?.concept ?? "Design Your Light");
    return [
      "REEL STRUCTURE - 6 second concept reveal. Static camera. Natural light.",
      "",
      "Concept theme: " + concept,
      "",
      "Scene 1: Setup - space before",
      "Scene 2: Reveal - light controlled",
      "End Frame: " + headline + " | " + cta,
      "",
      "Tone: Calm, deliberate. Editorial feel.",
    ].join("\n");
  }

  if (hookType === "motorized_demo") {
    return [
      "REEL STRUCTURE - 6 second motorized demo. Static camera.",
      "",
      "Show: Silent automation of window treatment. Quiet, smooth movement.",
      "End Frame: " + headline + " | " + cta,
      "",
      "Tone: Calm. Show the product in use, no loud motion graphics.",
    ].join("\n");
  }

  return [
    "REEL STRUCTURE - 6 second contrast. Static camera. Natural light.",
    "",
    "Scene 1 (UNCONTROLLED): Raw, authentic space. Light flooding in without control.",
    "Scene 2 (DESIGNED): Same space with window treatment. Light controlled.",
    "End Frame: " + headline + " | " + cta,
    "",
    "Tone: Calm, deliberate. Editorial feel.",
  ].join("\n");
}
