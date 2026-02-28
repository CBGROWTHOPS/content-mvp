/**
 * Brief Presets - Default creative briefs for testing mode.
 * Skip LLM calls during development and testing.
 */
import { CompactCreativeBrief } from "./compactBrief.js";

export const BRIEF_PRESETS: Record<string, CompactCreativeBrief> = {
  default_premium_reel_v1: {
    v: 1,
    concept: "Premium brand showcase",
    tone: "confident calm",
    look: "cinematic real footage shallow DOF",
    camera: "slow push-in dolly",
    light: "soft key high contrast",
    music: "modern cinematic build",
    vo: "warm confident authority",
    text: "minimal bold sans center",
    rules: ["must have real video", "no blank backgrounds", "text every shot"],
  },

  luxury_crm_v1: {
    v: 1,
    concept: "Luxury CRM infrastructure for professionals",
    tone: "confident authority",
    look: "cinematic real footage shallow DOF",
    camera: "slow push-ins lateral dolly",
    light: "moody warm highlights cool shadows",
    music: "modern cinematic corporate build",
    vo: "calm confident authority",
    text: "minimal bold sans lower-third",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "match brand font"],
  },

  energetic_promo_v1: {
    v: 1,
    concept: "High-energy product promotion",
    tone: "exciting bold",
    look: "vibrant saturated dynamic motion",
    camera: "fast cuts tracking handheld",
    light: "bright punchy dramatic",
    music: "upbeat electronic drive",
    vo: "energetic enthusiastic",
    text: "bold impact large center",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "fast pacing"],
  },

  minimal_elegant_v1: {
    v: 1,
    concept: "Minimalist elegant brand story",
    tone: "refined subtle",
    look: "clean minimal white space",
    camera: "static slow pan",
    light: "soft even natural",
    music: "ambient atmospheric gentle",
    vo: "soft warm intimate",
    text: "thin elegant serif subtle",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "preserve white space"],
  },

  testimonial_trust_v1: {
    v: 1,
    concept: "Customer testimonial trust builder",
    tone: "authentic warm",
    look: "natural documentary realistic",
    camera: "steady medium close-up",
    light: "natural window soft fill",
    music: "gentle acoustic inspiring",
    vo: "conversational genuine",
    text: "clean readable lower-third",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "show faces"],
  },
};

export function getPresetBrief(presetId: string): CompactCreativeBrief {
  return BRIEF_PRESETS[presetId] ?? BRIEF_PRESETS.default_premium_reel_v1;
}

export function listPresets(): Array<{ id: string; concept: string }> {
  return Object.entries(BRIEF_PRESETS).map(([id, brief]) => ({
    id,
    concept: brief.concept,
  }));
}
