import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { selectModel, getModelsForApi } from "../../lib/models.js";
import { validateJobBody } from "../middleware/validate.js";
import { generateStructuredContent, getPromptForEstimate } from "../../lib/llm.js";
import { loadBrand } from "../../lib/brandRegistry.js";
import { estimateTokenCount } from "../../lib/tokenEstimate.js";

const router = Router();

router.get("/generate-content/estimate", (req: Request, res: Response) => {
  try {
    const brandId = req.query.brandId as string | undefined;
    const strategyParam = req.query.strategySelection;
    const raw = (typeof strategyParam === "string"
      ? (JSON.parse(strategyParam) as Record<string, unknown>)
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

router.post("/generate-content", async (req: Request, res: Response) => {
  try {
    const { brandId, strategySelection } = req.body;
    if (!brandId || !strategySelection) {
      res.status(400).json({ error: "brandId and strategySelection required" });
      return;
    }
    // Pass full strategySelection (directionLevel, productCategory, productType, etc.)
    const result = await generateStructuredContent(brandId, strategySelection);
    // Return full result including creativeDirectorBrief, reelBlueprint, tokenUsage
    res.json(result);
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

    const enrichedPayload = {
      ...payload,
      ...kitDefaults,
      model_key: selected.key,
      provider_model_id: selected.provider_model_id,
    };

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        status: "pending",
        brand: payload.brand_key ?? payload.brand,
        format: payload.format,
        objective: payload.objective,
        model: selected.key,
        payload: enrichedPayload,
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

    res.status(202).json({ id: jobId, status: "queued" });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
