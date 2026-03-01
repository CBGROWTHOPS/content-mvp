/**
 * Brief Presets - Default creative briefs for testing mode.
 * Skip LLM calls during development and testing.
 */
import { CompactCreativeBrief } from "./compactBrief.js";

export const BRIEF_PRESETS: Record<string, CompactCreativeBrief> = {
  default_premium_reel_v1: {
    v: 1,
    intentCategory: "growth",
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
    intentCategory: "authority",
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
    intentCategory: "conversion",
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
    intentCategory: "authority",
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
    intentCategory: "lead_gen",
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

  education_tips_v1: {
    v: 1,
    intentCategory: "education",
    concept: "Quick educational tips and how-tos",
    tone: "clear helpful",
    look: "clean bright professional",
    camera: "static medium shot",
    light: "even bright fill",
    music: "light upbeat corporate",
    vo: "friendly expert",
    text: "bold readable center",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "clear hierarchy"],
  },

  lead_gen_dm_v1: {
    v: 1,
    intentCategory: "lead_gen",
    concept: "Lead generation with DM CTA",
    tone: "confident direct",
    look: "professional polished studio",
    camera: "medium close-up slight push",
    light: "soft key fill rim",
    music: "modern motivational build",
    vo: "confident persuasive",
    text: "bold impact center punch",
    rules: ["must have real video", "no blank backgrounds", "text every shot", "clear CTA"],
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
