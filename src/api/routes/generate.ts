import { Router, type Request, type Response } from "express";
import { contentQueue } from "../../lib/queue.js";
import { supabase } from "../../lib/supabase.js";
import { validateJobBody } from "../middleware/validate.js";

const router = Router();

router.post("/generate", validateJobBody, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        status: "pending",
        brand: payload.brand,
        format: payload.format,
        objective: payload.objective,
        model: payload.model,
        payload,
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
      { jobId, payload },
      { jobId }
    );

    res.status(202).json({ id: jobId, status: "queued" });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
