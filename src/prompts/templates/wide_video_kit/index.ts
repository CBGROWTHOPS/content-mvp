import type { JobInput } from "../../../schema/job.js";
import { loadBrand } from "../../../lib/brand.js";

export type WideVideoProjectType = "high-rise" | "single-family" | "townhouse";

/**
 * Wide video kit: 16:9 editorial lookbook.
 * Structure: Label → Headline → Concept → Detail → CTA
 * Feels like architectural showcase, not ad creative.
 */
export function build(
  variables: JobInput["variables"],
  brandKey: string,
  projectType: WideVideoProjectType
): string {
  const brand = loadBrand(brandKey);
  const headline = brand?.positioning ?? "LIGHT. CONTROLLED.";
  const theme = String(variables?.theme ?? "Design Your Light");
  const cta = brand?.primary_cta ?? "Schedule Design Consultation";

  const projectContext =
    projectType === "high-rise"
      ? "high-rise condo with floor-to-ceiling windows"
      : projectType === "single-family"
        ? "single-family modern home"
        : "townhouse with flexible spaces";

  return [
    "WIDE VIDEO STRUCTURE - 16:9 editorial lookbook. Architectural showcase.",
    "",
    "Label: NA BLINDS",
    "Headline: " + headline,
    "Concept: " + theme,
    "Detail: " + projectContext + ". Light behavior, window architecture.",
    "CTA: " + cta,
    "",
    "Tone: Editorial lookbook. Architectural showcase. Not ad creative.",
    "No discount framing. No loud motion graphics. Calm, aspirational.",
  ].join("\n");
}
