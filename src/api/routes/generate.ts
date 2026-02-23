import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { selectModel, getModelsForApi } from "../../lib/models.js";
import { validateJobBody } from "../middleware/validate.js";
import { generateStructuredContent } from "../../lib/llm.js";

const router = Router();

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
    const result = await generateStructuredContent(brandId, strategySelection);
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
