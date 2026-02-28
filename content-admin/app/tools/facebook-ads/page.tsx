"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { WorkflowProgress, WorkflowResult, type WorkflowStep } from "@/components/WorkflowProgress";
import { 
  fetchBrands, 
  createJob,
  generateContent,
  fetchBriefPresets,
  type BriefPreset,
} from "@/lib/api";

type CampaignObjective = "lead_generation" | "brand_awareness" | "conversions" | "traffic";

const OBJECTIVES: { value: CampaignObjective; label: string; description: string }[] = [
  { value: "lead_generation", label: "Lead Generation", description: "Collect leads with forms" },
  { value: "brand_awareness", label: "Brand Awareness", description: "Reach new audiences" },
  { value: "conversions", label: "Conversions", description: "Drive sales or signups" },
  { value: "traffic", label: "Traffic", description: "Send to website" },
];

const FORMATS = [
  { id: "feed", label: "Feed Ad", ratio: "4:5", description: "Best for News Feed" },
  { id: "story", label: "Story Ad", ratio: "9:16", description: "Full screen vertical" },
  { id: "carousel", label: "Carousel", ratio: "1:1", description: "Multiple images" },
];

export default function FacebookAdsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brandId, setBrandId] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("lead_generation");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["feed"]);
  const [topic, setTopic] = useState("");
  const [presets, setPresets] = useState<BriefPreset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [marketingCopy, setMarketingCopy] = useState<{
    headline?: string;
    primaryText?: string;
    cta?: string;
  } | null>(null);

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
    { id: "copy", label: "Generate Copy", status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending" },
    { id: "images", label: "Create Images", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending" },
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
      // Step 1: Generate marketing copy
      const copyResult = await generateContent(brandId, {
        campaignObjective: objective,
        audienceContext: "facebook users",
        propertyType: "general",
        visualEnergy: "balanced",
        hookFramework: "contrast",
        platformFormat: "facebook_feed",
        directionLevel: "template",
        contextTitle: topic || "Facebook Ad Campaign",
      });

      if ("error" in copyResult) {
        throw new Error(copyResult.error);
      }

      setMarketingCopy(copyResult.data.marketingOutput);
      setCurrentStep(2);

      // Step 2: Generate image for primary format
      const primaryFormat = selectedFormats[0] || "feed";
      const aspectRatio = FORMATS.find(f => f.id === primaryFormat)?.ratio || "4:5";

      const imagePayload = {
        brand_key: brandId,
        brand: brandId,
        format: "image_kit",
        objective,
        aspect_ratio: aspectRatio,
        variables: {
          headline: copyResult.data.marketingOutput?.headline || topic,
          theme: topic || "Premium brand showcase",
        },
        generation_id: copyResult.data.generationId,
      };

      const jobResult = await createJob(imagePayload);

      if ("error" in jobResult) {
        throw new Error(jobResult.error);
      }

      setJobId(jobResult.data.id);
      setCurrentStep(3);

      // Redirect to job page to see progress
      router.push(`/jobs/${jobResult.data.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormat = (formatId: string) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId)
        ? prev.filter((f) => f !== formatId)
        : [...prev, formatId]
    );
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Facebook Ads</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Create Facebook Ads</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate ad images and copy optimized for Facebook campaigns.
        </p>
      </div>

      <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
        <h3 className="text-sm font-medium text-blue-300">What you'll get</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-200/80">
          <li>• Ad image in your selected format(s)</li>
          <li>• Headline + primary text + CTA</li>
          <li>• Optimized for Facebook ad manager</li>
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
          <label className="mb-2 block text-sm font-medium text-zinc-400">Campaign Objective</label>
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.value}
                type="button"
                onClick={() => setObjective(obj.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  objective === obj.value
                    ? "border-blue-600 bg-blue-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{obj.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{obj.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Ad Formats</label>
          <div className="flex gap-2">
            {FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => toggleFormat(format.id)}
                className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                  selectedFormats.includes(format.id)
                    ? "border-blue-600 bg-blue-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{format.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{format.ratio}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Topic / Product
            <span className="ml-1 text-zinc-500">(optional)</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Smart motorized blinds, Spring sale"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!brandId || loading || selectedFormats.length === 0}
          className="w-full rounded bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Facebook Ads"}
        </button>
      </div>

      {marketingCopy && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Generated Copy</h3>
          <div className="space-y-2 text-sm">
            {marketingCopy.headline && (
              <div>
                <span className="text-zinc-500">Headline: </span>
                <span className="text-zinc-200">{marketingCopy.headline}</span>
              </div>
            )}
            {marketingCopy.primaryText && (
              <div>
                <span className="text-zinc-500">Primary: </span>
                <span className="text-zinc-200">{marketingCopy.primaryText}</span>
              </div>
            )}
            {marketingCopy.cta && (
              <div>
                <span className="text-zinc-500">CTA: </span>
                <span className="text-zinc-200">{marketingCopy.cta}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <WorkflowResult
        status={loading ? "processing" : jobId ? "completed" : "pending"}
        jobId={jobId ?? undefined}
      />
    </div>
  );
}
