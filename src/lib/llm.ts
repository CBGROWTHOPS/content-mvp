import OpenAI from "openai";
import { loadBrand } from "./brandRegistry.js";
import type { BrandKit } from "../core/types.js";

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
}

/** Creative Director Brief - full playbook for Director/Cinematic levels */
export interface CreativeDirectorBrief {
  creativeDirection: {
    concept: string;
    audienceFeeling: string;
    visualMetaphor: string;
    pacingReference: string;
    editingReference: string;
    doAndDontList: string[];
  };
  artDirection: {
    locationStyle: string;
    materials: string[];
    colorPalette: string[];
    textureNotes: string;
    furnitureNotes: string;
    windowDetails: string;
    timeOfDay: string;
    weatherCues: string;
  };
  cameraDirection: {
    lensFeel: string;
    framingRules: string[];
    movementRules: string[];
    compositionRules: string[];
    mustBeVisible: string[];
  };
  lightingDirection: {
    exposureTargets: string;
    glareBehavior: string;
    diffusionBehavior: string;
    shadowBehavior: string;
  };
  typographySystem: {
    fontType: string;
    hierarchy: string;
    placementGrid: string;
    animationRules: string;
    maxWordsPerFrame: number;
  };
  soundDirection: {
    musicMood: string;
    sfxList: string[];
    mixNotes: string;
    voiceoverStyle: string;
  };
  deliverables: {
    cuts: string[];
    hookVariants: number;
    ctaEndFrame: string;
  };
}

/** Reel type determines rendering pipeline and required assets */
export type ReelType = "text_overlay" | "voiceover" | "broll" | "talking_head";

/** Visual source for a shot - determines how background is rendered */
export type VisualSource = "solid_bg" | "generated_video" | "avatar";

/** Single shot spec for reel blueprint */
export interface ReelBlueprintShot {
  shotId: string;
  timeStart: number;
  timeEnd: number;
  shotType: "wide" | "medium" | "close";
  cameraMovement: "static" | "slow_push" | "handheld" | "pan" | "other";
  sceneDescription: string;
  visualSource: VisualSource;
  videoPrompt?: string;
  avatarScript?: string;
  propsSetDressingNotes?: string;
  lightingNotes?: string;
  talentNotes?: string;
  onScreenText?: {
    text: string;
    position?: string;
    animationRules?: string;
  };
  brollRequirements?: string;
  assetRequirements?: string[];
}

/** Voiceover script with per-shot segments */
export interface VoiceoverScript {
  fullScript: string;
  segments: Array<{
    shotId: string;
    text: string;
    emotion?: string;
  }>;
}

/** Music track selection for reel */
export interface MusicTrackSelection {
  mood: string;
  tempo: "slow" | "medium" | "upbeat";
  genre?: string;
}

/** Renderable reel spec for Director/Cinematic levels */
export interface ReelBlueprint {
  format: string;
  reelType: ReelType;
  durationSeconds: number;
  fps: number;
  voiceoverScript?: VoiceoverScript;
  musicTrack?: MusicTrackSelection;
  music?: string;
  soundDesign?: string;
  colorGrade?: string;
  typography?: string;
  deliverables?: string[];
  shots: ReelBlueprintShot[];
  endFrame?: {
    headline?: string;
    cta?: string;
    brandName?: string;
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface GenerateContentResult {
  marketingOutput: {
    primaryText: string;
    headline: string;
    secondaryLine?: string;
    cta: string;
    caption: string;
    variations?: string[];
  };
  creativeBrief?: {
    imageDirection: {
      sceneDescription: string;
      cameraAngle: string;
      framing: string;
      interiorRequirements: string[];
      exteriorContext: string;
      textureNotes: string;
      lightingNotes: string;
    };
    videoDirection: {
      scene1: string;
      scene2: string;
      timing: string;
      textOverlayRules: string;
      motionGuidance: string;
      colorGrade: string;
    };
    editorGuardrails: string[];
  } | null;
  creativeDirectorBrief?: CreativeDirectorBrief | null;
  reelBlueprint?: ReelBlueprint | null;
  tokenUsage?: TokenUsage;
}

function getProductCopyDirection(
  brand: BrandKit,
  productCategory?: string,
  productType?: string
): string | undefined {
  if (!productCategory || !productType) return undefined;
  const categories = brand.kit?.selectors?.productCatalog?.categories ?? [];
  const cat = categories.find((c) => c.id === productCategory);
  const type = cat?.types?.find((t) => t.id === productType);
  return type?.copyDirection;
}

function buildBrandKitSection(brand: BrandKit, strategy: StrategySelection): string[] {
  const parts: string[] = [
    "You are a content strategist and creative director for a premium brand.",
    "",
    "## Brand Kit",
    `Brand: ${brand.display_name ?? brand.brand_key}`,
    `Positioning: ${brand.positioning ?? "Premium quality."}`,
    brand.target_icp?.audiences?.length
      ? `Target audiences: ${brand.target_icp.audiences.join(", ")}`
      : "",
    brand.target_icp?.geographic_context
      ? `Geography: ${brand.target_icp.geographic_context}`
      : "",
    brand.voice_profile
      ? `Voice: ${brand.voice_profile.tone_must_be?.join(", ")}. Never: ${brand.voice_profile.tone_never?.join(", ")}`
      : "",
    brand.voice_rules?.length
      ? `Voice rules: ${brand.voice_rules.join(". ")}`
      : "",
    brand.forbidden_language?.length
      ? `Never use: ${brand.forbidden_language.join(", ")}`
      : "",
    brand.primary_cta ? `Primary CTA: ${brand.primary_cta}` : "",
    brand.secondary_cta ? `Secondary CTA: ${brand.secondary_cta}` : "",
    brand.visual_identity?.color_palette?.length
      ? `Colors: ${brand.visual_identity.color_palette.join(", ")}`
      : "",
    brand.lighting_rules?.required?.length
      ? `Lighting: ${brand.lighting_rules.required.join(". ")}`
      : "",
    brand.scene_requirements?.required?.length
      ? `Scene requirements: ${brand.scene_requirements.required.join(". ")}`
      : "",
    brand.hook_framework_bias?.focus_on?.length
      ? `Hook focus: ${brand.hook_framework_bias.focus_on.join(", ")}. Avoid: ${brand.hook_framework_bias.avoid?.join(", ")}`
      : "",
  ];

  const copyDir = getProductCopyDirection(
    brand,
    strategy.productCategory,
    strategy.productType
  );
  if (copyDir) {
    parts.push("", `Product copy direction (must follow): ${copyDir}`);
  }

  return parts;
}

function buildStrategySection(strategy: StrategySelection): string[] {
  const lines: string[] = [
    "",
    "## Strategy Selection",
    `Campaign objective: ${strategy.campaignObjective}`,
    `Audience context: ${strategy.audienceContext}`,
    `Property type: ${strategy.propertyType}`,
    `Visual energy: ${strategy.visualEnergy}`,
    `Hook framework: ${strategy.hookFramework}`,
    `Platform format: ${strategy.platformFormat}`,
  ];
  if (strategy.productCategory) {
    lines.push(`Product category: ${strategy.productCategory}`);
  }
  if (strategy.productType) {
    lines.push(`Product type: ${strategy.productType}`);
  }
  const ctx = strategy as { contextTitle?: string; contextNotes?: string };
  if (ctx.contextTitle) {
    lines.push(`Context title: ${ctx.contextTitle}`);
  }
  if (ctx.contextNotes) {
    lines.push(`Context notes: ${ctx.contextNotes}`);
  }
  return lines;
}

function buildTemplateSchema(): object {
  return {
    marketingOutput: {
      primaryText: "string",
      headline: "string",
      secondaryLine: "string (optional)",
      cta: "string",
      caption: "string",
      variations: ["string (optional array)"],
    },
    creativeBrief: {
      imageDirection: {
        sceneDescription: "string",
        cameraAngle: "string",
        framing: "string",
        interiorRequirements: ["string"],
        exteriorContext: "string",
        textureNotes: "string",
        lightingNotes: "string",
      },
      videoDirection: {
        scene1: "string",
        scene2: "string",
        timing: "string",
        textOverlayRules: "string",
        motionGuidance: "string",
        colorGrade: "string",
      },
      editorGuardrails: ["string"],
    },
  };
}

function buildDirectorSchema(): object {
  return {
    marketingOutput: {
      primaryText: "string",
      headline: "string",
      secondaryLine: "string (optional)",
      cta: "string",
      caption: "string",
      variations: ["string (optional array)"],
    },
    creativeDirectorBrief: {
      creativeDirection: {
        concept: "string",
        audienceFeeling: "string",
        visualMetaphor: "string",
        pacingReference: "string",
        editingReference: "string",
        doAndDontList: ["string"],
      },
      artDirection: {
        locationStyle: "string",
        materials: ["string"],
        colorPalette: ["string"],
        textureNotes: "string",
        furnitureNotes: "string",
        windowDetails: "string",
        timeOfDay: "string",
        weatherCues: "string",
      },
      cameraDirection: {
        lensFeel: "string",
        framingRules: ["string"],
        movementRules: ["string"],
        compositionRules: ["string"],
        mustBeVisible: ["string"],
      },
      lightingDirection: {
        exposureTargets: "string",
        glareBehavior: "string",
        diffusionBehavior: "string",
        shadowBehavior: "string",
      },
      typographySystem: {
        fontType: "string",
        hierarchy: "string",
        placementGrid: "string",
        animationRules: "string",
        maxWordsPerFrame: "number",
      },
      soundDirection: {
        musicMood: "string",
        sfxList: ["string"],
        mixNotes: "string",
        voiceoverStyle: "string",
      },
      deliverables: {
        cuts: ["string"],
        hookVariants: "number",
        ctaEndFrame: "string",
      },
    },
    reelBlueprint: {
      format: "string (e.g. 9:16)",
      reelType: "text_overlay | voiceover | broll | talking_head - choose based on content needs",
      durationSeconds: "number",
      fps: "number",
      voiceoverScript: {
        fullScript: "string - complete narration script",
        segments: [
          {
            shotId: "string - matches shot.shotId",
            text: "string - narration for this shot",
            emotion: "string (optional) - calm, excited, warm, etc.",
          },
        ],
      },
      musicTrack: {
        mood: "string - calm, upbeat, dramatic, warm, etc.",
        tempo: "slow | medium | upbeat",
        genre: "string (optional) - ambient, corporate, cinematic, etc.",
      },
      music: "string (optional)",
      soundDesign: "string (optional)",
      colorGrade: "string (optional)",
      typography: "string (optional)",
      deliverables: ["string (optional)"],
      shots: [
        {
          shotId: "string",
          timeStart: "number",
          timeEnd: "number",
          shotType: "wide | medium | close",
          cameraMovement: "static | slow_push | handheld | pan | other",
          sceneDescription: "string - visual description for production",
          visualSource: "solid_bg | generated_video | avatar - choose based on reelType",
          videoPrompt: "string (optional) - prompt for AI video generation if visualSource is generated_video",
          avatarScript: "string (optional) - script for avatar if visualSource is avatar",
          propsSetDressingNotes: "string (optional)",
          lightingNotes: "string (optional)",
          talentNotes: "string (optional)",
          onScreenText: {
            text: "string - REQUIRED: marketing text shown on screen (short, punchy, 3-8 words)",
            position: "string (optional)",
            animationRules: "string (optional)",
          },
          brollRequirements: "string (optional)",
          assetRequirements: ["string (optional)"],
        },
      ],
      endFrame: {
        headline: "string (optional) - final screen headline",
        cta: "string (optional) - call to action button text",
        brandName: "string (optional) - brand name or logo text",
      },
    },
  };
}

function buildPrompt(brand: BrandKit, strategy: StrategySelection): string {
  const directionLevel = strategy.directionLevel ?? "template";
  const parts: string[] = [
    ...buildBrandKitSection(brand, strategy),
    ...buildStrategySection(strategy),
  ];

  if (directionLevel === "template") {
    parts.push(
      "",
      "## Task",
      "Generate marketing copy and a creative production brief. Return ONLY valid JSON matching this schema - no markdown, no explanation:",
      JSON.stringify(buildTemplateSchema(), null, 2)
    );
    return parts.filter(Boolean).join("\n");
  }

  // Director or Cinematic
  parts.push(
    "",
    "## Brand Kit as Safety Rails",
    "The Reel Kit and Brand Kit above are mandatory safety rails. All creative direction, art direction, camera, lighting, typography, and sound must respect these constraints. Never violate voice rules, forbidden language, lighting rules, or scene requirements.",
    "",
    "## Reel Type Selection (IMPORTANT)",
    "DEFAULT to 'voiceover' reelType for engaging content. Only use text_overlay for announcements/quotes.",
    "",
    "Reel types:",
    "- voiceover (DEFAULT): Narrator speaks over visuals. Use for storytelling, tutorials, product explanations, most content.",
    "- broll: AI-generated video footage with voiceover. Use for cinematic product showcases, premium brands.",
    "- text_overlay: Text animations only, no voice. ONLY for quick quotes, announcements, captions-as-content.",
    "- talking_head: Avatar presenter (future). Skip for now, use voiceover instead.",
    "",
    "Visual sources per shot:",
    "- solid_bg: Gradient/solid backgrounds with text overlays",
    "- generated_video: AI video generation - include videoPrompt for each shot",
    "",
    "## REQUIRED: Audio Elements",
    "ALWAYS include these for professional content:",
    "",
    "1. voiceoverScript (REQUIRED for voiceover/broll reels):",
    "   - fullScript: Complete narration (warm, conversational, matches brand voice)",
    "   - segments: Array with { shotId, text, emotion } for each shot",
    "",
    "2. musicTrack (REQUIRED for ALL reels):",
    "   - mood: Match brand energy (calm, warm, upbeat, dramatic)",
    "   - tempo: slow | medium | upbeat",
    "   - genre: ambient, corporate, cinematic, acoustic, etc.",
    "",
    "3. onScreenText (REQUIRED for EVERY shot):",
    "   - text: Short, punchy marketing text (3-8 words) displayed on screen",
    "   - Examples: 'Before', 'After', 'Light. Controlled.', 'Design Your Perfect Space'",
    "   - NEVER leave onScreenText empty - every shot needs visible text",
    "",
    "## Task",
    "Generate marketing copy, a full Creative Director Brief (playbook for production), and a Reel Blueprint (renderable shot-by-shot spec). Return ONLY valid JSON matching this schema - no markdown, no explanation:"
  );

  if (directionLevel === "cinematic") {
    parts.push(
      "",
      "Cinematic level: Use advanced camera language, 3-5 shots minimum, detailed sound design, and pacing references. Richer production spec than Director."
    );
  }

  parts.push(JSON.stringify(buildDirectorSchema(), null, 2));
  return parts.filter(Boolean).join("\n");
}

/** Returns the prompt string for a given brand and strategy (used for token estimation). */
export function getPromptForEstimate(
  brand: BrandKit,
  strategy: StrategySelection
): string {
  return buildPrompt(brand, strategy);
}

export async function generateStructuredContent(
  brandId: string,
  strategySelection: StrategySelection
): Promise<GenerateContentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const brand = loadBrand(brandId) as BrandKit;
  const prompt = buildPrompt(brand, strategySelection);
  const directionLevel = strategySelection.directionLevel ?? "template";

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You return only valid JSON. No markdown, no code blocks, no explanation.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from LLM");
  }

  const parsed = JSON.parse(raw) as GenerateContentResult;

  if (!parsed.marketingOutput) {
    throw new Error("Invalid response structure: missing marketingOutput");
  }

  if (directionLevel === "template") {
    if (!parsed.creativeBrief) {
      throw new Error("Invalid response structure: missing creativeBrief");
    }
  } else {
    if (!parsed.creativeDirectorBrief) {
      throw new Error(
        "Invalid response structure: missing creativeDirectorBrief"
      );
    }
    if (!parsed.reelBlueprint || !Array.isArray(parsed.reelBlueprint.shots)) {
      throw new Error("Invalid response structure: missing reelBlueprint.shots");
    }
  }

  const tokenUsage: TokenUsage | undefined = completion.usage
    ? {
        inputTokens: completion.usage.prompt_tokens ?? 0,
        outputTokens: completion.usage.completion_tokens ?? 0,
        totalTokens: completion.usage.total_tokens ?? 0,
      }
    : undefined;

  return {
    ...parsed,
    tokenUsage,
  };
}

import type { CompactCreativeBrief } from "./compactBrief.js";
import { 
  buildViralStoryboardPrompt, 
  validateViralFramework,
  type ShotForValidation,
  type CtaMode,
} from "./viralFramework.js";

export interface StoryboardInput {
  brief: CompactCreativeBrief;
  durationSeconds: number;
  shotCount: number;
  reelType: ReelType;
  customerProfileId?: string;
  ctaMode?: CtaMode;
}

export interface StoryboardResult {
  shots: ReelBlueprintShot[];
  voiceoverScript?: VoiceoverScript;
  musicTrack?: MusicTrackSelection;
  viralValidation?: {
    pass: boolean;
    issues: string[];
    beatsCovered: string[];
    hasPayoff: boolean;
  };
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

function buildStoryboardPrompt(input: StoryboardInput): string {
  const { brief, durationSeconds, customerProfileId, ctaMode } = input;
  return buildViralStoryboardPrompt({ brief, durationSeconds, customerProfileId, ctaMode });
}

function enrichShotWithBrief(
  shot: ReelBlueprintShot,
  brief: CompactCreativeBrief
): ReelBlueprintShot {
  const enrichedVideoPrompt = shot.videoPrompt 
    ? `${shot.videoPrompt}. Style: ${brief.look}. Camera: ${brief.camera}. Lighting: ${brief.light}.`
    : `${brief.concept}. Style: ${brief.look}. Camera: ${brief.camera}. Lighting: ${brief.light}.`;
  
  return {
    ...shot,
    videoPrompt: enrichedVideoPrompt,
    lightingNotes: shot.lightingNotes || brief.light,
    cameraMovement: shot.cameraMovement || (brief.camera.includes("push") ? "slow_push" : "static"),
    onScreenText: shot.onScreenText?.text 
      ? shot.onScreenText 
      : { text: shot.sceneDescription.split(" ").slice(0, 4).join(" ") },
  };
}

export async function generateStoryboardFromBrief(
  input: StoryboardInput
): Promise<StoryboardResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const prompt = buildStoryboardPrompt(input);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return only valid JSON. No markdown, no code blocks, no explanation." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty storyboard response from LLM");
  }

  const parsed = JSON.parse(raw) as {
    shots: ReelBlueprintShot[];
    voiceoverScript?: VoiceoverScript;
    musicTrack?: MusicTrackSelection;
  };

  if (!Array.isArray(parsed.shots) || parsed.shots.length === 0) {
    throw new Error("Invalid storyboard: missing shots array");
  }

  const enrichedShots = parsed.shots.map(shot => enrichShotWithBrief(shot, input.brief));

  // Validate viral framework
  const shotsForValidation: ShotForValidation[] = enrichedShots.map(s => ({
    shotId: s.shotId,
    beat: (s as unknown as { beat?: string }).beat,
    timeStart: s.timeStart,
    timeEnd: s.timeEnd,
    onScreenText: s.onScreenText,
  }));
  
  const viralValidation = validateViralFramework(shotsForValidation, input.brief.intentCategory);

  return {
    shots: enrichedShots,
    voiceoverScript: parsed.voiceoverScript,
    musicTrack: parsed.musicTrack ?? {
      mood: input.brief.music.split(" ")[0] || "modern",
      tempo: "medium",
      genre: input.brief.music,
    },
    viralValidation: {
      pass: viralValidation.pass,
      issues: viralValidation.issues,
      beatsCovered: viralValidation.beats.present,
      hasPayoff: viralValidation.beats.hasPayoff,
    },
    tokenUsage: {
      prompt: completion.usage?.prompt_tokens ?? 0,
      completion: completion.usage?.completion_tokens ?? 0,
      total: completion.usage?.total_tokens ?? 0,
    },
  };
}

export function enrichBlueprintWithBrief(
  blueprint: ReelBlueprint,
  brief: CompactCreativeBrief
): ReelBlueprint {
  return {
    ...blueprint,
    shots: blueprint.shots.map(shot => enrichShotWithBrief(shot, brief)),
    musicTrack: blueprint.musicTrack ?? {
      mood: brief.music.split(" ")[0] || "modern",
      tempo: "medium",
      genre: brief.music,
    },
  };
}

/** Upgrade a prompt for better image or video generation. */
export async function upgradePrompt(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a prompt engineer. Given a user's rough prompt for image or video generation, return an improved, more detailed, and more effective prompt. " +
          "Add specific visual details, style cues, composition, lighting, and mood. Keep it concise but rich. Return ONLY the upgraded prompt, no explanation.",
      },
      { role: "user", content: prompt },
    ],
  });

  const upgraded = completion.choices[0]?.message?.content?.trim();
  return upgraded ?? prompt;
}
