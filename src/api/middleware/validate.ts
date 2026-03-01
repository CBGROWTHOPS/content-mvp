import type { Request, Response, NextFunction } from "express";
import { jobSchema } from "../../schema/job.js";

export function validateJobBody(req: Request, res: Response, next: NextFunction): void {
  const result = jobSchema.safeParse(req.body);
  if (!result.success) {
    // #region agent log
    console.log(`[DEBUG] validation_failed fields=${JSON.stringify(result.error.flatten().fieldErrors)}`);
    // #endregion
    res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  req.body = result.data;
  next();
}
