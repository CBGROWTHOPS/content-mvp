import { Router, type Request, type Response } from "express";
import { supabase } from "../../lib/supabase.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select("id, brand, format, objective, model, status, created_at, payload")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
      return;
    }

    const jobs = jobsData ?? [];
    const jobIds = jobs.map((j) => j.id);

    let assetByJob: Record<string, { url: string; type: string }> = {};
    if (jobIds.length > 0) {
      const { data: assets } = await supabase
        .from("assets")
        .select("job_id, url, type")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      for (const a of assets ?? []) {
        const jid = a.job_id as string;
        if (!assetByJob[jid]) assetByJob[jid] = { url: a.url, type: a.type };
      }
    }

    res.json(
      jobs.map((j) => ({
        id: j.id,
        brand: j.brand,
        format: j.format,
        hook_type: (j.payload as { hook_type?: string } | null)?.hook_type ?? null,
        status: j.status,
        created_at: j.created_at,
        primary_asset: assetByJob[j.id] ?? null,
      }))
    );
  } catch (err) {
    console.error("GET /jobs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });

    const payload = (job.payload ?? {}) as Record<string, unknown>;

    res.json({
      id: job.id,
      brand: job.brand,
      format: job.format,
      objective: job.objective,
      model: job.model,
      status: job.status,
      cost: job.cost,
      error_message: job.error_message,
      created_at: job.created_at,
      updated_at: job.updated_at,
      payload,
      assets: assets ?? [],
    });
  } catch (err) {
    console.error("GET /jobs/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
