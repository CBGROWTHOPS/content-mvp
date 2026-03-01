"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { WorkflowProgress, type WorkflowStep } from "@/components/WorkflowProgress";
import { 
  fetchBrands, 
  createJob,
  generateContent,
  fetchBriefPresets,
  generateCompactBrief,
  type BriefPreset,
  type CompactCreativeBrief,
} from "@/lib/api";

type ReelStyle = "premium" | "energetic" | "minimal" | "testimonial";

const REEL_STYLES: { value: ReelStyle; label: string; preset: string; description: string }[] = [
  { value: "premium", label: "Premium Cinematic", preset: "default_premium_reel_v1", description: "Slow, elegant, luxury feel" },
  { value: "energetic", label: "Energetic Promo", preset: "energetic_promo_v1", description: "Fast-paced, exciting" },
  { value: "minimal", label: "Minimal Elegant", preset: "minimal_elegant_v1", description: "Clean, refined, simple" },
  { value: "testimonial", label: "Testimonial", preset: "testimonial_trust_v1", description: "Trust-building, authentic" },
];

const HOOK_TYPES = [
  { id: "contrast", label: "Before/After", description: "Show transformation" },
  { id: "question", label: "Question Hook", description: "Engage with a question" },
  { id: "problem", label: "Problem → Solution", description: "Address a pain point" },
  { id: "reveal", label: "Reveal", description: "Build up to something" },
];

export default function InstagramReelsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brandId, setBrandId] = useState("");
  const [reelStyle, setReelStyle] = useState<ReelStyle>("premium");
  const [hookType, setHookType] = useState("contrast");
  const [topic, setTopic] = useState("");
  const [presets, setPresets] = useState<BriefPreset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [brief, setBrief] = useState<CompactCreativeBrief | null>(null);
  const [briefKey, setBriefKey] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
    });
    fetchBriefPresets().then((r) => {
      if ("data" in r) setPresets(r.data);
    });
  }, []);

  const steps: WorkflowStep[] = [
    { id: "setup", label: "Setup", status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "pending" },
    { id: "brief", label: "Creative Brief", status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending" },
    { id: "reel", label: "Generate Reel", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending" },
  ];

  const handleGenerate = async () => {
    if (!brandId) {
      setError("Select a brand");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(1);

    try {
      // Step 1: Generate or use preset brief
      const selectedStyle = REEL_STYLES.find(s => s.value === reelStyle);
      const presetId = selectedStyle?.preset || "default_premium_reel_v1";

      const briefResult = await generateCompactBrief({
        usePreset: presetId,
      });

      if ("error" in briefResult) {
        throw new Error(briefResult.error);
      }

      setBrief(briefResult.data.brief);
      setBriefKey(briefResult.data.briefKey);
      setCurrentStep(2);

      // Step 2: Generate reel with director-level content
      const contentResult = await generateContent(brandId, {
        campaignObjective: "engagement",
        audienceContext: "instagram users",
        propertyType: "general",
        visualEnergy: reelStyle === "energetic" ? "high" : "balanced",
        hookFramework: hookType,
        platformFormat: "instagram_reel",
        directionLevel: "director",
        contextTitle: topic || "Instagram Reel",
        contextNotes: `Style: ${selectedStyle?.label}. ${selectedStyle?.description}.`,
      });

      console.log("[DEBUG] contentResult:", JSON.stringify(contentResult, null, 2));

      if ("error" in contentResult) {
        throw new Error(contentResult.error);
      }

      console.log("[DEBUG] generationId:", contentResult.data.generationId);

      // Step 3: Create render job
      const jobPayload = {
        brand_key: brandId,
        brand: brandId,
        format: "reel_kit",
        objective: "engagement",
        hook_type: hookType,
        aspect_ratio: "9:16",
        generation_id: contentResult.data.generationId,
        preset_id: presetId,
        variables: {
          theme: topic || "Instagram Reel",
        },
      };

      console.log("[DEBUG] jobPayload:", JSON.stringify(jobPayload, null, 2));
      const jobResult = await createJob(jobPayload);
      console.log("[DEBUG] jobResult:", JSON.stringify(jobResult, null, 2));

      if ("error" in jobResult) {
        throw new Error(jobResult.error);
      }

      const newJobId = jobResult.data.id;
      setJobId(newJobId);
      setCurrentStep(3);
      
      // Redirect after brief delay to show success state
      setTimeout(() => {
        router.push(`/jobs/${newJobId}`);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setCurrentStep(0);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Instagram Reels</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Create Instagram Reel</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate a vertical video with voiceover, music, and text overlays.
        </p>
      </div>

      <div className="rounded-lg border border-pink-900/50 bg-pink-950/30 p-4">
        <h3 className="text-sm font-medium text-pink-300">What you'll get</h3>
        <ul className="mt-2 space-y-1 text-sm text-pink-200/80">
          <li>• 9:16 vertical video (6-15 seconds)</li>
          <li>• AI-generated voiceover narration</li>
          <li>• Background music (MusicGen or library)</li>
          <li>• Animated text overlays on each shot</li>
          <li>• Branded end frame with CTA</li>
        </ul>
      </div>

      <WorkflowProgress steps={steps} />

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {jobId && (
        <div className="rounded border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-green-400 font-medium">Job created! Redirecting to progress tracker...</span>
          </div>
          <p className="mt-1 text-green-300/70 text-xs font-mono">Job ID: {jobId}</p>
        </div>
      )}

      <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Brand</label>
          <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Reel Style</label>
          <div className="grid grid-cols-2 gap-2">
            {REEL_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setReelStyle(style.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  reelStyle === style.value
                    ? "border-pink-600 bg-pink-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{style.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{style.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Hook Type</label>
          <div className="grid grid-cols-2 gap-2">
            {HOOK_TYPES.map((hook) => (
              <button
                key={hook.id}
                type="button"
                onClick={() => setHookType(hook.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  hookType === hook.id
                    ? "border-pink-600 bg-pink-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{hook.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{hook.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Topic / Message
            <span className="ml-1 text-zinc-500">(optional)</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Design Your Light, Smart Home Living"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!brandId || loading || !!jobId}
          className="w-full rounded bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3 text-sm font-medium text-white hover:from-pink-500 hover:to-purple-500 disabled:opacity-50"
        >
          {jobId
            ? "Redirecting..."
            : loading
              ? currentStep === 1
                ? "Creating Creative Brief..."
                : currentStep === 2
                  ? "Queuing Reel Generation..."
                  : "Starting..."
              : "Create Instagram Reel"}
        </button>
      </div>

      {brief && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Creative Brief</h3>
            {briefKey && (
              <span className="font-mono text-xs text-zinc-500">{briefKey}</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-zinc-500">Look:</span> <span className="text-zinc-300">{brief.look}</span></div>
            <div><span className="text-zinc-500">Camera:</span> <span className="text-zinc-300">{brief.camera}</span></div>
            <div><span className="text-zinc-500">Light:</span> <span className="text-zinc-300">{brief.light}</span></div>
            <div><span className="text-zinc-500">Music:</span> <span className="text-zinc-300">{brief.music}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
