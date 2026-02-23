import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { selectModel } from "../../lib/models.js";
import { generateStructuredContent, type StrategySelection } from "../../lib/llm.js";
import { jobSchema } from "../../schema/job.js";

const router = Router();

/** Resolve strategy from preset id (from brand or defaults). */
function resolveStrategy(
  presetId: string,
  brandPresets: Array<{ id: string; strategy: Record<string, unknown> }> | undefined,
  defaultPresets: Array<{ id: string; strategy: Record<string, unknown> }>
): Record<string, unknown> {
  const presets = brandPresets && brandPresets.length > 0 ? brandPresets : defaultPresets;
  const preset = presets.find((p) => p.id === presetId);
  return preset?.strategy ?? { campaignObjective: "lead_generation", audienceContext: "affluent_homeowner", propertyType: "single_family", visualEnergy: "calm", hookFramework: "contrast", platformFormat: "reel_kit", directionLevel: "director" };
}

const DEFAULT_PRESETS = [
  { id: "lead_gen_high_rise", strategy: { campaignObjective: "lead_generation", audienceContext: "condo_owner", propertyType: "high_rise", visualEnergy: "calm", hookFramework: "contrast", platformFormat: "reel_kit", directionLevel: "director" } },
  { id: "awareness_modern_build", strategy: { campaignObjective: "awareness", audienceContext: "new_build", propertyType: "modern_build", visualEnergy: "editorial", hookFramework: "concept", platformFormat: "reel_kit", directionLevel: "director" } },
  { id: "motorized_upgrade", strategy: { campaignObjective: "lead_generation", audienceContext: "affluent_homeowner", propertyType: "single_family", visualEnergy: "controlled", hookFramework: "motorized_demo", platformFormat: "reel_kit", directionLevel: "director" } },
  { id: "builder_grade_upgrade", strategy: { campaignObjective: "lead_generation", audienceContext: "builder_grade_upgrade", propertyType: "single_family", visualEnergy: "calm", hookFramework: "contrast", platformFormat: "reel_kit", directionLevel: "director" } },
  { id: "waterfront_luxury", strategy: { campaignObjective: "lead_generation", audienceContext: "waterfront", propertyType: "single_family", visualEnergy: "aspirational", hookFramework: "concept", platformFormat: "reel_kit", directionLevel: "director" } },
];

async function createAndQueueJob(
  payload: Record<string, unknown>,
  generationId: string | null
): Promise<{ jobId: string }> {
  const parsed = jobSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid job payload: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  const data = parsed.data;
  const selected = selectModel(data.format as "reel_kit" | "image_kit", data.quality, data.model_key);
  const enrichedPayload = {
    ...data,
    model_key: selected.key,
    provider_model_id: selected.provider_model_id,
    ...(generationId && { generation_id: generationId }),
  };
  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      status: "pending",
      brand: data.brand_key ?? (data as { brand?: string }).brand ?? "default",
      format: data.format,
      objective: data.objective,
      model: selected.key,
      payload: enrichedPayload,
      ...(generationId && { generation_id: generationId }),
    })
    .select("id")
    .single();
  if (error || !job) throw new Error("Failed to create job");
  await contentQueue.add("content-job", { jobId: job.id, payload: enrichedPayload }, { jobId: job.id });
  return { jobId: job.id };
}

/** Flow 1: Image Ad Pack — generate marketing + spawn image job(s) */
router.post("/image-ad-pack", async (req: Request, res: Response) => {
  try {
    const { brandId, strategyPresetId, platformSet, creativeAngle } = req.body;
    if (!brandId || !strategyPresetId) {
      res.status(400).json({ error: "brandId and strategyPresetId required" });
      return;
    }
    const { loadBrand } = await import("../../lib/brandRegistry.js");
    const brand = loadBrand(brandId) as { strategy_presets?: Array<{ id: string; strategy: Record<string, unknown> }> };
    const strategy = resolveStrategy(strategyPresetId, brand?.strategy_presets, DEFAULT_PRESETS) as Record<string, unknown>;
    const strategySelection: StrategySelection = {
      campaignObjective: String(strategy.campaignObjective ?? "lead_generation"),
      audienceContext: String(strategy.audienceContext ?? "affluent_homeowner"),
      propertyType: String(strategy.propertyType ?? "single_family"),
      visualEnergy: String(strategy.visualEnergy ?? "calm"),
      hookFramework: String(strategy.hookFramework ?? "contrast"),
      platformFormat: String(strategy.platformFormat ?? "reel_kit"),
      directionLevel: "template",
    };

    const result = await generateStructuredContent(brandId, strategySelection);
    const generationId = crypto.randomUUID();

    await supabase.from("generations").insert({
      id: generationId,
      brand_id: brandId,
      strategy: strategySelection,
      marketing_output: result.marketingOutput ?? null,
      creative_brief: result.creativeBrief ?? null,
      creative_director_brief: result.creativeDirectorBrief ?? null,
      reel_blueprint: result.reelBlueprint ?? null,
      token_usage: result.tokenUsage ?? null,
    });

    const jobPayload = {
      brand_key: brandId,
      format: "image_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      aspect_ratio: "4:5",
      variables: {
        body: creativeAngle ?? "Architectural window treatment in modern space",
        headline: result.marketingOutput?.headline,
        cta: result.marketingOutput?.cta,
      },
    };
    const { jobId } = await createAndQueueJob(jobPayload, generationId);

    res.json({
      generationId,
      jobIds: [jobId],
      marketingOutput: result.marketingOutput,
    });
  } catch (err) {
    console.error("Image ad pack flow error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Flow failed" });
  }
});

/** Flow 2: Reel Campaign — generate full content + create reel job */
router.post("/reel-campaign", async (req: Request, res: Response) => {
  try {
    const { brandId, strategyPresetId, directionLevel, templateType } = req.body;
    if (!brandId || !strategyPresetId) {
      res.status(400).json({ error: "brandId and strategyPresetId required" });
      return;
    }
    const { loadBrand } = await import("../../lib/brandRegistry.js");
    const brand = loadBrand(brandId) as { strategy_presets?: Array<{ id: string; strategy: Record<string, unknown> }> };
    const strategy = resolveStrategy(strategyPresetId, brand?.strategy_presets, DEFAULT_PRESETS) as Record<string, unknown>;
    const dirLevel = (directionLevel ?? "director") as "template" | "director" | "cinematic";
    const strategySelection: StrategySelection = {
      campaignObjective: String(strategy.campaignObjective ?? "lead_generation"),
      audienceContext: String(strategy.audienceContext ?? "affluent_homeowner"),
      propertyType: String(strategy.propertyType ?? "single_family"),
      visualEnergy: String(strategy.visualEnergy ?? "calm"),
      hookFramework: String(strategy.hookFramework ?? "contrast"),
      platformFormat: String(strategy.platformFormat ?? "reel_kit"),
      directionLevel: dirLevel,
    };

    const result = await generateStructuredContent(brandId, strategySelection);
    const generationId = crypto.randomUUID();

    await supabase.from("generations").insert({
      id: generationId,
      brand_id: brandId,
      strategy: strategySelection,
      marketing_output: result.marketingOutput ?? null,
      creative_brief: result.creativeBrief ?? null,
      creative_director_brief: result.creativeDirectorBrief ?? null,
      reel_blueprint: result.reelBlueprint ?? null,
      token_usage: result.tokenUsage ?? null,
    });

    const hookType = templateType ?? "contrast";
    const jobPayload = {
      brand_key: brandId,
      format: "reel_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      reel_kit_hook_type: hookType,
      length_seconds: 6,
      aspect_ratio: "9:16",
      variables: { concept: result.marketingOutput?.headline ?? "Design Your Light" },
    };
    const { jobId } = await createAndQueueJob(jobPayload, generationId);

    res.json({
      generationId,
      jobIds: [jobId],
      marketingOutput: result.marketingOutput,
      creativeDirectorBrief: result.creativeDirectorBrief,
      reelBlueprint: result.reelBlueprint,
    });
  } catch (err) {
    console.error("Reel campaign flow error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Flow failed" });
  }
});

/** Flow 3: Content Batch — generate N content records */
router.post("/content-batch", async (req: Request, res: Response) => {
  try {
    const { brandId, strategyPresetId, contentCount, platform } = req.body;
    if (!brandId || !strategyPresetId) {
      res.status(400).json({ error: "brandId and strategyPresetId required" });
      return;
    }
    const count = Math.min(Number(contentCount) || 1, 10);
    const { loadBrand } = await import("../../lib/brandRegistry.js");
    const brand = loadBrand(brandId) as { strategy_presets?: Array<{ id: string; strategy: Record<string, unknown> }> };
    const strategy = resolveStrategy(strategyPresetId, brand?.strategy_presets, DEFAULT_PRESETS) as Record<string, unknown>;
    const strategySelection: StrategySelection = {
      campaignObjective: String(strategy.campaignObjective ?? "lead_generation"),
      audienceContext: String(strategy.audienceContext ?? "affluent_homeowner"),
      propertyType: String(strategy.propertyType ?? "single_family"),
      visualEnergy: String(strategy.visualEnergy ?? "calm"),
      hookFramework: String(strategy.hookFramework ?? "contrast"),
      platformFormat: String(strategy.platformFormat ?? "reel_kit"),
      directionLevel: "director",
    };

    const generations: { generationId: string; marketingOutput: unknown }[] = [];
    for (let i = 0; i < count; i++) {
      const result = await generateStructuredContent(brandId, strategySelection);
      const generationId = crypto.randomUUID();
      await supabase.from("generations").insert({
        id: generationId,
        brand_id: brandId,
        strategy: strategySelection,
        marketing_output: result.marketingOutput ?? null,
        creative_brief: result.creativeBrief ?? null,
        creative_director_brief: result.creativeDirectorBrief ?? null,
        reel_blueprint: result.reelBlueprint ?? null,
        token_usage: result.tokenUsage ?? null,
      });
      generations.push({ generationId, marketingOutput: result.marketingOutput });
    }

    res.json({ generations });
  } catch (err) {
    console.error("Content batch flow error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Flow failed" });
  }
});

/** Flow 4: Landing Hero Pack — generate hero copy + image prompt */
router.post("/landing-hero", async (req: Request, res: Response) => {
  try {
    const { brandId, strategyPresetId, pageType } = req.body;
    if (!brandId || !strategyPresetId) {
      res.status(400).json({ error: "brandId and strategyPresetId required" });
      return;
    }
    const { loadBrand } = await import("../../lib/brandRegistry.js");
    const brand = loadBrand(brandId) as { strategy_presets?: Array<{ id: string; strategy: Record<string, unknown> }> };
    const strategy = resolveStrategy(strategyPresetId, brand?.strategy_presets, DEFAULT_PRESETS) as Record<string, unknown>;
    const strategySelection: StrategySelection = {
      campaignObjective: String(strategy.campaignObjective ?? "lead_generation"),
      audienceContext: String(strategy.audienceContext ?? "affluent_homeowner"),
      propertyType: String(strategy.propertyType ?? "single_family"),
      visualEnergy: String(strategy.visualEnergy ?? "calm"),
      hookFramework: String(strategy.hookFramework ?? "contrast"),
      platformFormat: String(strategy.platformFormat ?? "reel_kit"),
      directionLevel: "director",
    };

    const result = await generateStructuredContent(brandId, strategySelection);
    const generationId = crypto.randomUUID();

    await supabase.from("generations").insert({
      id: generationId,
      brand_id: brandId,
      strategy: strategySelection,
      marketing_output: result.marketingOutput ?? null,
      creative_brief: result.creativeBrief ?? null,
      creative_director_brief: result.creativeDirectorBrief ?? null,
      reel_blueprint: result.reelBlueprint ?? null,
      token_usage: result.tokenUsage ?? null,
    });

    const mo = result.marketingOutput;
    const imagePrompt = result.creativeDirectorBrief?.artDirection?.locationStyle
      ? `${result.creativeDirectorBrief.artDirection.locationStyle}. ${result.creativeDirectorBrief.artDirection.materials?.join(", ")}. Editorial, warm neutrals.`
      : "Modern luxury interior with natural light. Editorial photography.";

    res.json({
      generationId,
      heroHeadline: mo?.headline ?? "",
      heroSubheading: mo?.primaryText ?? "",
      heroCta: mo?.cta ?? "",
      heroImagePrompt: imagePrompt,
    });
  } catch (err) {
    console.error("Landing hero flow error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Flow failed" });
  }
});

/** Flow 5: Seasonal Campaign — multi-channel */
router.post("/seasonal-campaign", async (req: Request, res: Response) => {
  try {
    const { brandId, event, audience, budgetTier } = req.body;
    if (!brandId) {
      res.status(400).json({ error: "brandId required" });
      return;
    }
    const strategySelection: StrategySelection = {
      campaignObjective: "awareness",
      audienceContext: audience ?? "affluent_homeowner",
      propertyType: "single_family",
      visualEnergy: "aspirational",
      hookFramework: "concept",
      platformFormat: "reel_kit",
      directionLevel: "director",
    };

    const result = await generateStructuredContent(brandId, strategySelection);
    const generationId = crypto.randomUUID();

    await supabase.from("generations").insert({
      id: generationId,
      brand_id: brandId,
      strategy: { ...strategySelection, event, budgetTier },
      marketing_output: result.marketingOutput ?? null,
      creative_brief: result.creativeBrief ?? null,
      creative_director_brief: result.creativeDirectorBrief ?? null,
      reel_blueprint: result.reelBlueprint ?? null,
      token_usage: result.tokenUsage ?? null,
    });

    res.json({
      generationId,
      marketingOutput: result.marketingOutput,
      creativeDirectorBrief: result.creativeDirectorBrief,
      reelBlueprint: result.reelBlueprint,
      message: "Seasonal campaign generation complete. Image pack, reel, email, and landing flows can be added.",
    });
  } catch (err) {
    console.error("Seasonal campaign flow error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Flow failed" });
  }
});

export default router;
