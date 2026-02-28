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
  generateCompactBrief,
  type CompactCreativeBrief,
} from "@/lib/api";

type ContentType = "tutorial" | "showcase" | "tips" | "behind_scenes";

const CONTENT_TYPES: { value: ContentType; label: string; description: string; hook: string }[] = [
  { value: "tutorial", label: "Quick Tutorial", description: "How-to in 60 seconds", hook: "contrast" },
  { value: "showcase", label: "Product Showcase", description: "Feature highlight", hook: "reveal" },
  { value: "tips", label: "Tips & Tricks", description: "Valuable quick tips", hook: "question" },
  { value: "behind_scenes", label: "Behind the Scenes", description: "Authentic glimpse", hook: "problem" },
];

export default function YouTubeShortsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brandId, setBrandId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("showcase");
  const [topic, setTopic] = useState("");
  const [cta, setCta] = useState("Subscribe for more");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [brief, setBrief] = useState<CompactCreativeBrief | null>(null);

  useEffect(() => {
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
    });
  }, []);

  const steps: WorkflowStep[] = [
    { id: "setup", label: "Setup", status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "pending" },
    { id: "brief", label: "Creative Brief", status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending" },
    { id: "short", label: "Generate Short", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending" },
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
      // Step 1: Generate brief using energetic preset for YouTube
      const briefResult = await generateCompactBrief({
        usePreset: "energetic_promo_v1",
      });

      if ("error" in briefResult) {
        throw new Error(briefResult.error);
      }

      setBrief(briefResult.data.brief);
      setCurrentStep(2);

      // Step 2: Generate content
      const selectedType = CONTENT_TYPES.find(t => t.value === contentType);
      
      const contentResult = await generateContent(brandId, {
        campaignObjective: "engagement",
        audienceContext: "youtube viewers",
        propertyType: "general",
        visualEnergy: "high",
        hookFramework: selectedType?.hook || "contrast",
        platformFormat: "youtube_short",
        directionLevel: "director",
        contextTitle: topic || `YouTube Short - ${selectedType?.label}`,
        contextNotes: `Content type: ${selectedType?.label}. ${selectedType?.description}. End CTA: ${cta}`,
      });

      if ("error" in contentResult) {
        throw new Error(contentResult.error);
      }

      // Step 3: Create render job
      const jobPayload = {
        brand_key: brandId,
        brand: brandId,
        format: "reel_kit",
        objective: "engagement",
        hook_type: selectedType?.hook || "contrast",
        aspect_ratio: "9:16",
        generation_id: contentResult.data.generationId,
        preset_id: "energetic_promo_v1",
        variables: {
          theme: topic || "YouTube Short",
          cta: cta,
          platform: "youtube",
        },
      };

      const jobResult = await createJob(jobPayload);

      if ("error" in jobResult) {
        throw new Error(jobResult.error);
      }

      setJobId(jobResult.data.id);
      setCurrentStep(3);

      router.push(`/jobs/${jobResult.data.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">YouTube Shorts</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Create YouTube Short</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate a vertical video optimized for YouTube Shorts algorithm.
        </p>
      </div>

      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
        <h3 className="text-sm font-medium text-red-300">What you'll get</h3>
        <ul className="mt-2 space-y-1 text-sm text-red-200/80">
          <li>• 9:16 vertical video (up to 60 seconds)</li>
          <li>• Fast-paced, attention-grabbing hook</li>
          <li>• Voiceover + energetic music</li>
          <li>• Bold text overlays</li>
          <li>• Subscribe CTA end frame</li>
        </ul>
      </div>

      <WorkflowProgress steps={steps} />

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Brand</label>
          <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Content Type</label>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setContentType(type.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  contentType === type.value
                    ? "border-red-600 bg-red-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{type.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Topic / Subject
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 3 Smart Home Tips, How to Install Motorized Blinds"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            End CTA
          </label>
          <input
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Subscribe for more"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!brandId || loading}
          className="w-full rounded bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "Generating Short..." : "Create YouTube Short"}
        </button>
      </div>

      {brief && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Creative Brief</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
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
