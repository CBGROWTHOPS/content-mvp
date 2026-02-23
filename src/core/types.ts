/**
 * Canonical Brand Kit schema. Used by both static JSON files and future DB layer.
 * Database-ready: sections can map to JSONB columns or normalized tables.
 */

export interface TargetICP {
  audiences?: string[];
  geographic_context?: string;
  regions?: string[];
  environmental_cues?: string;
}

export interface VoiceProfile {
  tone_must_be?: string[];
  tone_never?: string[];
  language_feel?: string[];
}

export interface VisualIdentityRules {
  color_palette?: string[];
  typography?: Record<string, string>;
  colors?: Record<string, string>;
}

export interface LightingRules {
  required?: string[];
  prohibited?: string[];
}

export interface SceneRequirements {
  required?: string[];
  prohibited_visuals?: string[];
}

export interface OfferPositioningRules {
  primary_cta: string;
  secondary_cta?: string | null;
  prohibited_phrases?: string[];
  discount_guidance?: string;
}

export interface HookFrameworkBias {
  focus_on?: string[];
  avoid?: string[];
}

export interface BrandKit {
  brand_key: string;
  display_name?: string;

  /** Brand positioning statement */
  positioning?: string;
  positioning_tier?: string;

  /** Target ICP - audiences, geography, environmental cues */
  target_icp?: TargetICP;

  /** Voice profile - tone, language feel */
  voice_profile?: VoiceProfile;
  voice_rules?: string[];
  conversion_rules?: string[];

  /** Visual identity - colors, typography */
  visual_identity?: VisualIdentityRules;
  typography?: Record<string, string>;
  colors?: Record<string, string>;

  /** Lighting rules for creative direction */
  lighting_rules?: LightingRules;

  /** Scene requirements for imagery */
  scene_requirements?: SceneRequirements;

  /** Offer and CTA rules */
  offer_positioning?: OfferPositioningRules;
  primary_cta?: string;
  secondary_cta?: string | null;
  default_micro_label?: string;

  /** Prohibited language and phrases */
  forbidden_language?: string[];
  prohibited_language?: string[];

  /** Hook framework bias for content strategy */
  hook_framework_bias?: HookFrameworkBias;

  /** Product/collection groupings */
  collections?: Array<{ key: string; label: string; tagline?: string }>;
  allowed_formats?: string[];

  /** Editor guardrails (exposure, composition, animation, typography) */
  guardrails?: Record<string, string[]>;

  /** Product catalog for brand-aware selectors. Only brands with this defined show product tiles. */
  kit?: {
    selectors?: {
      productCatalog?: {
        categories: Array<{
          id: string;
          label: string;
          types: Array<{ id: string; label: string; copyDirection?: string }>;
        }>;
      };
    };
  };
}

/** @deprecated Use BrandKit. Kept for backward compatibility. */
export type BrandProfile = BrandKit;

export interface KitPlan {
  prompt: string;
  overlay?: {
    micro_label?: string;
    headline: string;
    body?: string;
    cta: string;
  };
}

export type TemplateBuildFn = (
  profile: BrandKit,
  variables: Record<string, string | number | boolean>,
  options?: Record<string, unknown>
) => string;
