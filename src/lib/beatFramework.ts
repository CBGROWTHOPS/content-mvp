/**
 * Beat Framework - Required content beats per intent category.
 * Beats are flexible: can be reordered, combined, as long as coverage passes.
 */

export type Beat =
  | "hook"
  | "pain"
  | "problem"
  | "mechanism"
  | "solution"
  | "proof"
  | "payoff"
  | "cta"
  | "pov"
  | "breakdown"
  | "example"
  | "agitate"
  | "result";

export type IntentCategory = "growth" | "lead_gen" | "authority" | "education" | "conversion";

export const REQUIRED_BEATS_BY_INTENT: Record<IntentCategory, Beat[]> = {
  growth: ["hook", "pain", "solution", "payoff", "cta"],
  lead_gen: ["hook", "problem", "mechanism", "payoff", "cta"],
  authority: ["hook", "pov", "proof", "payoff", "cta"],
  education: ["hook", "breakdown", "example", "payoff", "cta"],
  conversion: ["hook", "agitate", "solution", "proof", "payoff", "cta"],
};

export const OPTIONAL_BEATS_BY_INTENT: Partial<Record<IntentCategory, Beat[]>> = {
  growth: ["proof"],
  authority: ["proof"],
  education: ["proof"],
};

export const BEAT_DESCRIPTIONS: Record<Beat, string> = {
  hook: "Pattern interrupt, attention grab",
  pain: "Relatable problem or frustration",
  problem: "Specific problem identification",
  mechanism: "How the solution works",
  solution: "The answer or fix",
  proof: "Evidence, testimonial, result",
  payoff: "Visual outcome (not explanation)",
  cta: "Call to action",
  pov: "Strong opinion or stance",
  breakdown: "Step-by-step explanation",
  example: "Concrete demonstration",
  agitate: "Amplify the pain",
  result: "End state or transformation",
};
