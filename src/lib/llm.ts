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

/** Single shot spec for reel blueprint */
export interface ReelBlueprintShot {
  shotId: string;
  timeStart: number;
  timeEnd: number;
  shotType: "wide" | "medium" | "close";
  cameraMovement: "static" | "slow_push" | "handheld" | "pan" | "other";
  sceneDescription: string;
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

/** Renderable reel spec for Director/Cinematic levels */
export interface ReelBlueprint {
  format: string;
  durationSeconds: number;
  fps: number;
  music?: string;
  soundDesign?: string;
  colorGrade?: string;
  typography?: string;
  deliverables?: string[];
  shots: ReelBlueprintShot[];
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
      durationSeconds: "number",
      fps: "number",
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
          sceneDescription: "string",
          propsSetDressingNotes: "string (optional)",
          lightingNotes: "string (optional)",
          talentNotes: "string (optional)",
          onScreenText: {
            text: "string",
            position: "string (optional)",
            animationRules: "string (optional)",
          },
          brollRequirements: "string (optional)",
          assetRequirements: ["string (optional)"],
        },
      ],
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
