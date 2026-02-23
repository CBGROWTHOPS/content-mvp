import { Router, type Request, type Response } from "express";
import { loadBrand } from "../../lib/brand.js";

const router = Router();

router.get("/:key", (req: Request, res: Response) => {
  const { key } = req.params;
  const brand = loadBrand(key);
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json(brand);
});

export default router;
