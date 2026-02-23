export interface StrategySelection {
  campaignObjective: string;
  audienceContext: string;
  propertyType: string;
  visualEnergy: string;
  hookFramework: string;
  platformFormat: string;
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
};

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
