/**
 * CTA Mode System - Flexible call-to-action types per intent.
 */

export type CtaMode = "engage" | "dm" | "link" | "follow" | "soft" | "book";

export const DEFAULT_CTA_MODE_BY_INTENT: Record<string, CtaMode> = {
  growth: "engage",
  lead_gen: "dm",
  authority: "soft",
  education: "follow",
  conversion: "book",
};

export const CTA_EXAMPLES: Record<CtaMode, string[]> = {
  engage: ["Save this", "Share with someone", "Comment below", "Double tap"],
  dm: ["DM 'START'", "DM me for access", "Send me a message"],
  link: ["Link in bio", "Tap to shop", "Get yours now"],
  follow: ["Follow for more", "Follow for part 2", "Don't miss the next one"],
  soft: ["Learn more in bio", "We build systems like this", "This is what we do"],
  book: ["Book a call", "Schedule your demo", "Grab your slot"],
};

export function resolveCtaMode(intentCategory: string, explicit?: CtaMode): CtaMode {
  return explicit || DEFAULT_CTA_MODE_BY_INTENT[intentCategory] || "soft";
}

export function getCtaExample(mode: CtaMode): string {
  const examples = CTA_EXAMPLES[mode];
  return examples[Math.floor(Math.random() * examples.length)];
}
