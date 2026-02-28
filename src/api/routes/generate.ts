import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { selectModel, getModelsForApi } from "../../lib/models.js";
import { validateJobBody } from "../middleware/validate.js";
import { 
  generateStructuredContent, 
  getPromptForEstimate, 
  upgradePrompt,
  generateStoryboardFromBrief,
  enrichBlueprintWithBrief,
  type ReelType,
} from "../../lib/llm.js";
import { loadBrand } from "../../lib/brandRegistry.js";
import { estimateTokenCount } from "../../lib/tokenEstimate.js";
import { getOrGenerateBrief, computeBriefKey, getCachedBrief } from "../../lib/briefCache.js";
import { listPresets, getPresetBrief } from "../../lib/briefPresets.js";
import type { BriefInput } from "../../lib/compactBrief.js";

const router = Router();

router.get("/generate-content/estimate", (req: Request, res: Response) => {
  try {
    const brandId = req.query.brandId as string | undefined;
    const strategyParam = req.query.strategySelection;
    const raw = (typeof strategyParam === "string"
      ? (JSON.parse(strategyParam as string) as Record<string, unknown>)
      : strategyParam) as Record<string, unknown> | undefined;
    if (!brandId) {
      res.status(400).json({ error: "brandId required" });
      return;
    }
    const brand = loadBrand(brandId);
    const dir = raw?.directionLevel as "template" | "director" | "cinematic" | undefined;
    const directionLevel = (dir === "director" || dir === "cinematic" ? dir : "template") as "template" | "director" | "cinematic";
    const strategy = raw
      ? {
          campaignObjective: String(raw.campaignObjective ?? ""),
          audienceContext: String(raw.audienceContext ?? ""),
          propertyType: String(raw.propertyType ?? ""),
          visualEnergy: String(raw.visualEnergy ?? ""),
          hookFramework: String(raw.hookFramework ?? ""),
          platformFormat: String(raw.platformFormat ?? ""),
          directionLevel,
        }
      : { campaignObjective: "", audienceContext: "", propertyType: "", visualEnergy: "", hookFramework: "", platformFormat: "", directionLevel: "template" as const };
    const prompt = getPromptForEstimate(brand, strategy);
    const estimate = estimateTokenCount(prompt, directionLevel);
    res.json(estimate);
  } catch (err) {
    console.error("Token estimate error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

router.get("/models", (_req: Request, res: Response) => {
  res.json(getModelsForApi());
});

router.post("/upgrade-prompt", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt (string) required" });
      return;
    }
    const upgraded = await upgradePrompt(prompt);
    res.json({ upgradedPrompt: upgraded });
  } catch (err) {
    console.error("Upgrade prompt error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

router.get("/generations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: row, error } = await supabase
      .from("generations")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !row) {
      res.status(404).json({ error: "Generation not found" });
      return;
    }
    res.json({
      generationId: row.id,
      strategy: row.strategy,
      marketingOutput: row.marketing_output,
      creativeBrief: row.creative_brief,
      creativeDirectorBrief: row.creative_director_brief,
      reelBlueprint: row.reel_blueprint,
      tokenUsage: row.token_usage,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error("Get generation error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

router.post("/generate-content", async (req: Request, res: Response) => {
  try {
    const { brandId, strategySelection } = req.body;
    if (!brandId || !strategySelection) {
      res.status(400).json({ error: "brandId and strategySelection required" });
      return;
    }
    // Pass full strategySelection (directionLevel, productCategory, productType, etc.)
    const result = await generateStructuredContent(brandId, strategySelection);
    const generationId = crypto.randomUUID();
    const { error: insertError } = await supabase.from("generations").insert({
      id: generationId,
      brand_id: brandId,
      strategy: strategySelection,
      marketing_output: result.marketingOutput ?? null,
      creative_brief: result.creativeBrief ?? null,
      creative_director_brief: result.creativeDirectorBrief ?? null,
      reel_blueprint: result.reelBlueprint ?? null,
      token_usage: result.tokenUsage ?? null,
    });
    if (insertError) {
      console.error("Generation insert error:", insertError);
      // Still return the result; persistence is best-effort
    }
    // Return full result: canonical Generation with generationId, strategy, outputs, tokenUsage
    res.json({ ...result, generationId, strategy: strategySelection });
  } catch (err) {
    console.error("Generate content error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

router.post("/generate", validateJobBody, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const selected = selectModel(
      payload.format,
      payload.quality,
      payload.model_key
    );

    const kitDefaults: Record<string, unknown> = {};
    if (payload.format === "image_kit") {
      kitDefaults.aspect_ratio = payload.aspect_ratio ?? "4:5";
    } else if (payload.format === "reel_kit") {
      kitDefaults.aspect_ratio = payload.aspect_ratio ?? "9:16";
      kitDefaults.length_seconds = payload.length_seconds ?? 6;
    } else if (payload.format === "wide_video_kit") {
      kitDefaults.aspect_ratio = payload.aspect_ratio ?? "16:9";
    }

    // Resolve compact brief from presetId, briefKey, or direct JSON
    let compactBrief = null;
    let briefKey = null;
    
    if (payload.preset_id) {
      compactBrief = getPresetBrief(payload.preset_id);
      briefKey = `preset:${payload.preset_id}`;
      console.log(`Using brief preset: ${payload.preset_id}`);
    } else if (payload.brief_key) {
      const cached = await getCachedBrief(payload.brief_key);
      if (cached) {
        compactBrief = cached;
        briefKey = payload.brief_key;
        console.log(`Using cached brief: ${payload.brief_key}`);
      }
    } else if (payload.compact_brief) {
      compactBrief = payload.compact_brief;
      briefKey = `inline:${Date.now()}`;
      console.log(`Using inline compact brief`);
    }

    const enrichedPayload = {
      ...payload,
      ...kitDefaults,
      model_key: selected.key,
      provider_model_id: selected.provider_model_id,
      compact_brief: compactBrief,
      brief_key: briefKey,
    };
    const generationId = (payload as { generation_id?: string }).generation_id ?? null;

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        status: "pending",
        brand: payload.brand_key ?? payload.brand,
        format: payload.format,
        objective: payload.objective,
        model: selected.key,
        payload: enrichedPayload,
        ...(generationId && { generation_id: generationId }),
      })
      .select("id")
      .single();

    if (insertError || !job) {
      console.error("DB insert error:", insertError);
      res.status(500).json({ error: "Failed to create job" });
      return;
    }

    const jobId = job.id;

    await contentQueue.add(
      "content-job",
      { jobId, payload: enrichedPayload },
      { jobId }
    );

    res.status(202).json({ id: jobId, status: "queued", briefKey });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Compact Brief endpoints

router.get("/brief-presets", (_req: Request, res: Response) => {
  res.json({ presets: listPresets() });
});

router.get("/brief-presets/:presetId", (req: Request, res: Response) => {
  const { presetId } = req.params;
  const brief = getPresetBrief(presetId);
  res.json({ brief, presetId });
});

router.post("/compact-brief", async (req: Request, res: Response) => {
  try {
    const { brandId, goal, topic, audience, style, constraints, usePreset, skipCache } = req.body;
    
    if (usePreset) {
      const brief = getPresetBrief(usePreset);
      res.json({ 
        brief, 
        briefKey: `preset:${usePreset}`,
        cached: false,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
      });
      return;
    }
    
    if (!brandId || !goal || !topic || !audience || !style) {
      res.status(400).json({ error: "brandId, goal, topic, audience, and style are required" });
      return;
    }
    
    const input: BriefInput = { brandId, goal, topic, audience, style, constraints };
    const briefKey = computeBriefKey(input);
    
    const result = await getOrGenerateBrief(input, { skipCache: Boolean(skipCache) });
    
    res.json({
      brief: result.brief,
      briefKey,
      cached: result.cached,
      tokenUsage: result.tokenUsage,
    });
  } catch (err) {
    console.error("Compact brief error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

router.post("/storyboard-from-brief", async (req: Request, res: Response) => {
  try {
    const { brief, durationSeconds, shotCount, reelType } = req.body;
    
    if (!brief || !durationSeconds || !shotCount || !reelType) {
      res.status(400).json({ 
        error: "brief, durationSeconds, shotCount, and reelType are required" 
      });
      return;
    }
    
    const result = await generateStoryboardFromBrief({
      brief,
      durationSeconds: Number(durationSeconds),
      shotCount: Number(shotCount),
      reelType: reelType as ReelType,
    });
    
    res.json({
      shots: result.shots,
      voiceoverScript: result.voiceoverScript,
      musicTrack: result.musicTrack,
      tokenUsage: result.tokenUsage,
    });
  } catch (err) {
    console.error("Storyboard generation error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

export default router;
