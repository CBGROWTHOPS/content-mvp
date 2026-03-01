/**
 * Compact Creative Brief - Ultra-low token creative direction contract.
 * This replaces the verbose CreativeDirectorBrief with a 10-field schema.
 */
import OpenAI from "openai";
import type { IntentCategory } from "./beatFramework.js";

export type { IntentCategory };

export interface CompactCreativeBrief {
  v: 1;
  intentCategory: IntentCategory;  // Drives structure, CTA, emotional arc
  concept: string;    // 1 line what this reel is
  tone: string;       // 3 words max
  look: string;       // 3-6 words (visual style)
  camera: string;     // 3-6 words (camera language)
  light: string;      // 3-6 words (lighting)
  music: string;      // 3-6 words
  vo: string;         // 3-6 words (voiceover tone)
  text: string;       // 3-6 words (text style)
  rules: string[];    // 2-5 items, 2-6 words each
}

export interface BriefInput {
  brandId: string;
  goal: string;
  topic: string;
  audience: string;
  style: string;
  constraints?: string;
}

const COMPACT_SCHEMA = `{"v":1,"intentCategory":"growth|lead_gen|authority|education|conversion","concept":"","tone":"","look":"","camera":"","light":"","music":"","vo":"","text":"","rules":[]}`;

const SYSTEM_PROMPT = "Return only valid minified JSON matching schema. No markdown. No extra keys. No explanations.";

function buildUserPrompt(input: BriefInput): string {
  const lines = [
    `Brand: ${input.brandId}`,
    `Goal: ${input.goal}`,
    `Topic: ${input.topic}`,
    `Audience: ${input.audience}`,
    `Style: ${input.style}`,
  ];
  if (input.constraints) {
    lines.push(`Constraints: ${input.constraints}`);
  }
  lines.push("", "Schema:", COMPACT_SCHEMA);
  return lines.join("\n");
}

const DEFAULT_VALUES: Partial<CompactCreativeBrief> = {
  tone: "confident calm",
  camera: "slow push-in dolly",
  light: "soft key high contrast",
  music: "modern cinematic build",
  vo: "warm confident authority",
  text: "minimal bold sans center",
};

const MANDATORY_RULES = [
  "must have real video",
  "no blank backgrounds",
  "text every shot",
];

function inferIntentCategory(goal: string): IntentCategory {
  const lower = goal.toLowerCase();
  if (lower.includes("lead") || lower.includes("dm") || lower.includes("opt-in")) return "lead_gen";
  if (lower.includes("authority") || lower.includes("trust") || lower.includes("position")) return "authority";
  if (lower.includes("teach") || lower.includes("educat") || lower.includes("explain")) return "education";
  if (lower.includes("convert") || lower.includes("sale") || lower.includes("buy") || lower.includes("urgent")) return "conversion";
  return "growth";
}

function applyDefaults(brief: Partial<CompactCreativeBrief>, goal?: string): CompactCreativeBrief {
  return {
    v: 1,
    intentCategory: brief.intentCategory || inferIntentCategory(goal || ""),
    concept: brief.concept || "Brand showcase",
    tone: brief.tone || DEFAULT_VALUES.tone!,
    look: brief.look || "cinematic real footage",
    camera: brief.camera || DEFAULT_VALUES.camera!,
    light: brief.light || DEFAULT_VALUES.light!,
    music: brief.music || DEFAULT_VALUES.music!,
    vo: brief.vo || DEFAULT_VALUES.vo!,
    text: brief.text || DEFAULT_VALUES.text!,
    rules: [
      ...MANDATORY_RULES,
      ...(brief.rules || []).filter(r => !MANDATORY_RULES.includes(r)),
    ],
  };
}

export interface GenerateBriefResult {
  brief: CompactCreativeBrief;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached: boolean;
}

export async function generateCompactBrief(
  input: BriefInput
): Promise<GenerateBriefResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const userPrompt = buildUserPrompt(input);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from LLM");
  }

  let parsed: Partial<CompactCreativeBrief>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse brief JSON: ${raw.slice(0, 100)}`);
  }

  const brief = applyDefaults(parsed, input.goal);

  return {
    brief,
    tokenUsage: {
      prompt: completion.usage?.prompt_tokens ?? 0,
      completion: completion.usage?.completion_tokens ?? 0,
      total: completion.usage?.total_tokens ?? 0,
    },
    cached: false,
  };
}

const VALID_INTENT_CATEGORIES: IntentCategory[] = ["growth", "lead_gen", "authority", "education", "conversion"];

export function validateBrief(brief: unknown): brief is CompactCreativeBrief {
  if (!brief || typeof brief !== "object") return false;
  const b = brief as Record<string, unknown>;
  return (
    b.v === 1 &&
    typeof b.intentCategory === "string" &&
    VALID_INTENT_CATEGORIES.includes(b.intentCategory as IntentCategory) &&
    typeof b.concept === "string" &&
    typeof b.tone === "string" &&
    typeof b.look === "string" &&
    typeof b.camera === "string" &&
    typeof b.light === "string" &&
    typeof b.music === "string" &&
    typeof b.vo === "string" &&
    typeof b.text === "string" &&
    Array.isArray(b.rules)
  );
}
