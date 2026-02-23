"use client";

interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface TokenUsageBadgeProps {
  estimate?: TokenEstimate;
  actual?: TokenEstimate;
}

export function TokenUsageBadge({ estimate, actual }: TokenUsageBadgeProps) {
  if (!estimate && !actual) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estimate && (
        <span
          className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400"
          title={`Est. input: ${estimate.inputTokens}, output: ${estimate.outputTokens}`}
        >
          Est. ~{estimate.totalTokens.toLocaleString()} tokens
        </span>
      )}
      {actual && (
        <span
          className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400"
          title={`Input: ${actual.inputTokens}, Output: ${actual.outputTokens}`}
        >
          {actual.inputTokens.toLocaleString()} in / {actual.outputTokens.toLocaleString()} out
        </span>
      )}
    </div>
  );
}
