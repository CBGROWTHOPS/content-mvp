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
  creativeBrief: {
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
  };
}

function buildPrompt(brand: BrandKit, strategy: StrategySelection): string {
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

  parts.push(
    "",
    "## Strategy Selection",
    `Campaign objective: ${strategy.campaignObjective}`,
    `Audience context: ${strategy.audienceContext}`,
    `Property type: ${strategy.propertyType}`,
    `Visual energy: ${strategy.visualEnergy}`,
    `Hook framework: ${strategy.hookFramework}`,
    `Platform format: ${strategy.platformFormat}`,
    "",
    "## Task",
    "Generate marketing copy and a creative production brief. Return ONLY valid JSON matching this schema - no markdown, no explanation:",
    JSON.stringify({
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
    }, null, 2),
  );

  return parts.filter(Boolean).join("\n");
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

  if (!parsed.marketingOutput || !parsed.creativeBrief) {
    throw new Error("Invalid response structure");
  }

  return parsed;
}
