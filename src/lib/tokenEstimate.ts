/**
 * Token estimation for content generation.
 * Uses ~4 chars per token (typical for English) for input; output varies by direction level.
 */

const CHARS_PER_TOKEN = 4;

const OUTPUT_ESTIMATES: Record<string, { min: number; max: number }> = {
  template: { min: 500, max: 800 },
  director: { min: 1500, max: 2500 },
  cinematic: { min: 2500, max: 4000 },
};

export interface TokenEstimate {
  estimatedInput: number;
  estimatedOutput: number;
  estimatedTotal: number;
}

export function estimateTokenCount(
  prompt: string,
  directionLevel: string
): TokenEstimate {
  const inputEstimate = Math.ceil((prompt.length || 0) / CHARS_PER_TOKEN);
  const systemOverhead = 100;
  const estimatedInput = inputEstimate + systemOverhead;

  const range = OUTPUT_ESTIMATES[directionLevel] ?? OUTPUT_ESTIMATES.template;
  const estimatedOutput = Math.round((range.min + range.max) / 2);
  const estimatedTotal = estimatedInput + estimatedOutput;

  return {
    estimatedInput,
    estimatedOutput,
    estimatedTotal,
  };
}
