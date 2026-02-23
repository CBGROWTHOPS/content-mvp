export interface StrategyPresetOption {
  id: string;
  label: string;
  strategy: Partial<StrategySelection>;
}

export interface StrategySelection {
  campaignObjective: string;
  audienceContext: string;
  propertyType: string;
  visualEnergy: string;
  hookFramework: string;
  platformFormat: string;
  directionLevel?: "template" | "director" | "cinematic";
  productCategory?: string;
  productType?: string;
  /** Preset id - when set, strategy can be derived from preset */
  strategyPreset?: string;
  /** Optional context for generation (shared across Marketing, Director Brief, Storyboard) */
  contextTitle?: string;
  contextNotes?: string;
  /** Advanced: duration in seconds, e.g. 6, 10, 15 */
  duration?: number;
  /** Advanced: number of hook variants */
  hookCount?: number;
  /** Advanced: number of content variants */
  variantCount?: number;
  /** Advanced: CTA style */
  ctaStyle?: string;
  /** Advanced: include offer in output */
  offerToggle?: boolean;
}

export interface TileOption {
  id: string;
  label: string;
  description?: string;
}

export const DEFAULT_STRATEGY: StrategySelection = {
  campaignObjective: "lead_generation",
  audienceContext: "affluent_homeowner",
  propertyType: "single_family",
  visualEnergy: "calm",
  hookFramework: "contrast",
  platformFormat: "reel_kit",
  directionLevel: "template",
};

export const DIRECTION_LEVEL_OPTIONS: TileOption[] = [
  { id: "template", label: "Template", description: "Strict reel kit, minimal choices, highly repeatable" },
  { id: "director", label: "Director", description: "Full director brief + blueprint, brand guardrails" },
  { id: "cinematic", label: "Cinematic", description: "Advanced camera, sound, pacing, more shots" },
];

export const CAMPAIGN_OBJECTIVE_OPTIONS: TileOption[] = [
  { id: "lead_generation", label: "Lead Generation", description: "Capture leads and consultations" },
  { id: "awareness", label: "Awareness", description: "Build brand recognition" },
  { id: "engagement", label: "Engagement", description: "Drive interaction and interest" },
  { id: "conversion", label: "Conversion", description: "Prompt direct action" },
];

export const AUDIENCE_CONTEXT_OPTIONS: TileOption[] = [
  { id: "affluent_homeowner", label: "Affluent Homeowner", description: "Single family, high-end" },
  { id: "condo_owner", label: "Condo Owner", description: "High-rise, urban" },
  { id: "waterfront", label: "Waterfront", description: "Waterfront property owners" },
  { id: "new_build", label: "New Build", description: "Modern new construction" },
  { id: "builder_grade_upgrade", label: "Builder Grade Upgrade", description: "Upgrading from builder grade" },
];

export const PROPERTY_TYPE_OPTIONS: TileOption[] = [
  { id: "single_family", label: "Single Family", description: "Detached homes" },
  { id: "high_rise", label: "High-Rise", description: "Tower condos" },
  { id: "townhouse", label: "Townhouse", description: "Townhouse units" },
  { id: "modern_build", label: "Modern Build", description: "Contemporary architecture" },
];

export const VISUAL_ENERGY_OPTIONS: TileOption[] = [
  { id: "calm", label: "Calm", description: "Serene, understated" },
  { id: "editorial", label: "Editorial", description: "Magazine-style, refined" },
  { id: "aspirational", label: "Aspirational", description: "Elevated, premium" },
  { id: "controlled", label: "Controlled", description: "Intentional, architectural" },
];

export const HOOK_FRAMEWORK_OPTIONS: TileOption[] = [
  { id: "contrast", label: "Contrast", description: "Before/after, transformation" },
  { id: "question", label: "Question", description: "Open with a question" },
  { id: "pain_point", label: "Pain Point", description: "Address a frustration" },
  { id: "concept", label: "Concept", description: "Abstract, conceptual" },
  { id: "motorized_demo", label: "Motorized Demo", description: "Show automation in action" },
  { id: "statistic", label: "Statistic", description: "Lead with a number" },
  { id: "story", label: "Story", description: "Narrative approach" },
];

export const PLATFORM_FORMAT_OPTIONS: TileOption[] = [
  { id: "reel", label: "Reel", description: "9:16 short-form video" },
  { id: "image", label: "Image", description: "Single image" },
  { id: "image_kit", label: "Image Kit (4:5)", description: "4:5 image format" },
  { id: "reel_kit", label: "Reel Kit (9:16)", description: "9:16 transformation" },
  { id: "wide_video_kit", label: "Wide Video Kit (16:9)", description: "16:9 showcase" },
];

export interface ProductCatalogCategory {
  id: string;
  label: string;
  types: Array<{ id: string; label: string; copyDirection?: string }>;
}

/** Fallback presets when brand has none. Architect so these come from brand kit API later. */
export const DEFAULT_STRATEGY_PRESETS: StrategyPresetOption[] = [
  { id: "lead_gen_high_rise", label: "Lead Gen High Rise", strategy: { campaignObjective: "lead_generation", audienceContext: "condo_owner", propertyType: "high_rise", visualEnergy: "calm", hookFramework: "contrast", platformFormat: "reel_kit" } },
  { id: "awareness_modern_build", label: "Awareness Modern Build", strategy: { campaignObjective: "awareness", audienceContext: "new_build", propertyType: "modern_build", visualEnergy: "editorial", hookFramework: "concept", platformFormat: "reel_kit" } },
  { id: "motorized_upgrade", label: "Motorized Upgrade", strategy: { campaignObjective: "lead_generation", audienceContext: "affluent_homeowner", propertyType: "single_family", visualEnergy: "controlled", hookFramework: "motorized_demo", platformFormat: "reel_kit" } },
  { id: "builder_grade_upgrade", label: "Builder Grade Upgrade", strategy: { campaignObjective: "lead_generation", audienceContext: "builder_grade_upgrade", propertyType: "single_family", visualEnergy: "calm", hookFramework: "contrast", platformFormat: "reel_kit" } },
  { id: "waterfront_luxury", label: "Waterfront Luxury", strategy: { campaignObjective: "lead_generation", audienceContext: "waterfront", propertyType: "single_family", visualEnergy: "aspirational", hookFramework: "concept", platformFormat: "reel_kit" } },
];
