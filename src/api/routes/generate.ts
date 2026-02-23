import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { selectModel, getModelsForApi } from "../../lib/models.js";
import { validateJobBody } from "../middleware/validate.js";

const router = Router();

router.get("/models", (_req: Request, res: Response) => {
  res.json(getModelsForApi());
});

router.post("/generate", validateJobBody, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const selected = selectModel(
      payload.format,
      payload.quality,
      payload.model_key
    );

    const enrichedPayload = {
      ...payload,
      model_key: selected.key,
      provider_model_id: selected.provider_model_id,
    };

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        status: "pending",
        brand: payload.brand,
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
