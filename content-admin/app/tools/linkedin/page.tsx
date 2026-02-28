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
} from "@/lib/api";

type ContentFormat = "image" | "video" | "carousel";
type PostType = "thought_leadership" | "product_update" | "case_study" | "industry_news";

const CONTENT_FORMATS: { value: ContentFormat; label: string; description: string; ratio: string }[] = [
  { value: "image", label: "Single Image", description: "4:5 vertical post", ratio: "4:5" },
  { value: "video", label: "Video Post", description: "16:9 horizontal", ratio: "16:9" },
  { value: "carousel", label: "Document", description: "PDF-style slides", ratio: "4:5" },
];

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: "thought_leadership", label: "Thought Leadership", description: "Insights and expertise" },
  { value: "product_update", label: "Product Update", description: "Announce features" },
  { value: "case_study", label: "Case Study", description: "Success story" },
  { value: "industry_news", label: "Industry News", description: "Commentary and trends" },
];

export default function LinkedInContentPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brandId, setBrandId] = useState("");
  const [contentFormat, setContentFormat] = useState<ContentFormat>("image");
  const [postType, setPostType] = useState<PostType>("thought_leadership");
  const [topic, setTopic] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [postCopy, setPostCopy] = useState<string | null>(null);

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
    { id: "copy", label: "Generate Copy", status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "pending" },
    { id: "asset", label: "Create Asset", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "pending" },
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
      // Step 1: Generate LinkedIn post copy
      const selectedPost = POST_TYPES.find(p => p.value === postType);
      
      const contentResult = await generateContent(brandId, {
        campaignObjective: "brand_awareness",
        audienceContext: "linkedin professionals, B2B decision makers",
        propertyType: "general",
        visualEnergy: "balanced",
        hookFramework: "contrast",
        platformFormat: "linkedin_post",
        directionLevel: "template",
        contextTitle: topic || `LinkedIn ${selectedPost?.label}`,
        contextNotes: `Post type: ${selectedPost?.label}. ${selectedPost?.description}. Key message: ${keyMessage}`,
      });

      if ("error" in contentResult) {
        throw new Error(contentResult.error);
      }

      const generatedCopy = contentResult.data.marketingOutput?.primaryText || 
        contentResult.data.marketingOutput?.headline || 
        "Post copy generated";
      setPostCopy(generatedCopy);
      setCurrentStep(2);

      // Step 2: Generate visual asset
      const selectedFormat = CONTENT_FORMATS.find(f => f.value === contentFormat);
      
      const jobPayload = contentFormat === "video" ? {
        brand_key: brandId,
        brand: brandId,
        format: "reel_kit",
        objective: "brand_awareness",
        aspect_ratio: selectedFormat?.ratio || "16:9",
        generation_id: contentResult.data.generationId,
        preset_id: "minimal_elegant_v1",
        variables: {
          theme: topic || "LinkedIn Video",
          platform: "linkedin",
        },
      } : {
        brand_key: brandId,
        brand: brandId,
        format: "image_kit",
        objective: "brand_awareness",
        aspect_ratio: selectedFormat?.ratio || "4:5",
        generation_id: contentResult.data.generationId,
        variables: {
          theme: topic || "LinkedIn Post",
          headline: contentResult.data.marketingOutput?.headline,
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
        <span className="text-zinc-300">LinkedIn Content</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Create LinkedIn Content</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate professional posts with visuals for B2B engagement.
        </p>
      </div>

      <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
        <h3 className="text-sm font-medium text-blue-300">What you'll get</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-200/80">
          <li>• LinkedIn-optimized post copy</li>
          <li>• Visual asset (image or video)</li>
          <li>• Professional B2B tone</li>
          <li>• Hook + value + CTA structure</li>
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
          <label className="mb-2 block text-sm font-medium text-zinc-400">Content Format</label>
          <div className="flex gap-2">
            {CONTENT_FORMATS.map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => setContentFormat(format.value)}
                className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                  contentFormat === format.value
                    ? "border-blue-600 bg-blue-950/50 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="text-sm font-medium">{format.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{format.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Post Type</label>
          <div className="grid grid-cols-2 gap-2">
            {POST_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setPostType(type.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  postType === type.value
                    ? "border-blue-600 bg-blue-950/50 text-zinc-100"
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
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The future of smart building automation"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Key Message
            <span className="ml-1 text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={keyMessage}
            onChange={(e) => setKeyMessage(e.target.value)}
            placeholder="What's the main takeaway you want readers to remember?"
            rows={2}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!brandId || loading}
          className="w-full rounded bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Create LinkedIn Post"}
        </button>
      </div>

      {postCopy && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Post Copy</h3>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(postCopy)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{postCopy}</p>
        </div>
      )}
    </div>
  );
}
