import { Router, type Request, type Response } from "express";
import { supabase } from "../../lib/supabase.js";

const router = Router();

/** GET /brand-kits - list all active brand kits */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("brand_kits")
      .select("id, name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails, active, created_at, updated_at")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("GET /brand-kits error:", error);
      res.status(500).json({ error: "Failed to fetch brand kits" });
      return;
    }
    res.json(data ?? []);
  } catch (err) {
    console.error("GET /brand-kits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /brand-kits/:id - single brand kit by id or slug */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = supabase
      .from("brand_kits")
      .select("id, name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails, active, created_at, updated_at")
      .eq("active", true);

    if (isUuid) {
      query.eq("id", id);
    } else {
      query.eq("slug", id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      res.status(404).json({ error: "Brand kit not found" });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("GET /brand-kits/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /brand-kits - create new brand kit */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails } = req.body;

    if (!name || !slug || !niche) {
      res.status(400).json({ error: "name, slug, and niche are required" });
      return;
    }

    const { data, error } = await supabase
      .from("brand_kits")
      .insert({
        name,
        slug,
        niche,
        industry: industry ?? null,
        icp: icp ?? null,
        voice: voice ?? null,
        visuals: visuals ?? null,
        cta_defaults: cta_defaults ?? null,
        guardrails: Array.isArray(guardrails) ? guardrails : [],
      })
      .select()
      .single();

    if (error) {
      console.error("POST /brand-kits error:", error);
      res.status(500).json({ error: "Failed to create brand kit" });
      return;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /brand-kits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** PUT /brand-kits/:id - update brand kit */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, niche, industry, icp, voice, visuals, cta_defaults, guardrails } = req.body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (niche !== undefined) updates.niche = niche;
    if (industry !== undefined) updates.industry = industry;
    if (icp !== undefined) updates.icp = icp;
    if (voice !== undefined) updates.voice = voice;
    if (visuals !== undefined) updates.visuals = visuals;
    if (cta_defaults !== undefined) updates.cta_defaults = cta_defaults;
    if (guardrails !== undefined) updates.guardrails = Array.isArray(guardrails) ? guardrails : [];

    const { data, error } = await supabase
      .from("brand_kits")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PUT /brand-kits/:id error:", error);
      res.status(500).json({ error: "Failed to update brand kit" });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Brand kit not found" });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("PUT /brand-kits/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** DELETE /brand-kits/:id - soft delete (set active=false) */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("brand_kits")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      console.error("DELETE /brand-kits/:id error:", error);
      res.status(500).json({ error: "Failed to delete brand kit" });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Brand kit not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /brand-kits/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
