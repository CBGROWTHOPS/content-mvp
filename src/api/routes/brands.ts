import { Router, type Request, type Response } from "express";
import { loadBrand, listBrandKeys } from "../../lib/brandRegistry.js";

const router = Router();

/** GET /brands - list available brand keys and display names */
router.get("/", (_req: Request, res: Response) => {
  const keys = listBrandKeys();
  const brands = keys.map((key) => {
    const profile = loadBrand(key);
    return {
      key,
      display_name: profile.display_name ?? key,
    };
  });
  res.json(brands);
});

/** GET /brands/:key - full BrandKit (positioning, target ICP, voice, visuals, scene, offers, etc.) */
router.get("/:key", (req: Request, res: Response) => {
  const { key } = req.params;
  const brand = loadBrand(key);
  res.json(brand);
});

export default router;
