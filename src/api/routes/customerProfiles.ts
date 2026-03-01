/**
 * Customer Profiles API Routes
 */

import { Router, type Request, type Response } from "express";
import { CUSTOMER_PROFILES, getCustomerProfile, listCustomerProfiles } from "../../lib/customerProfiles.js";

const router = Router();

router.get("/customer-profiles", (_req: Request, res: Response) => {
  res.json({ profiles: listCustomerProfiles() });
});

router.get("/customer-profiles/:id", (req: Request, res: Response) => {
  const profile = getCustomerProfile(req.params.id);
  res.json({ profile });
});

export default router;
