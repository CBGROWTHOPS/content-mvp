"use client";

import { useState } from "react";
import Link from "next/link";
import { upgradePrompt } from "@/lib/api";

export default function PromptUpgradeToolPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUpgrade = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const result = await upgradePrompt(input.trim());
    setLoading(false);
    if ("data" in result) {
      setOutput(result.data.upgradedPrompt);
    } else {
      setError(result.error ?? "Failed to upgrade");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Prompt Upgrade</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Prompt Upgrade</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a rough prompt and get an improved, more detailed version for image or video generation.
        </p>
        <div className="mt-3 rounded border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-500">
          <strong className="text-zinc-400">How it works:</strong> Paste your prompt, click Upgrade, then Copy the result for use in Image or Reel tools.
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Your prompt</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="e.g. A modern living room with natural light and window treatments"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={!input.trim() || loading}
        className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? "Upgrading…" : "Upgrade"}
      </button>
      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Upgraded prompt</label>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-200">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
