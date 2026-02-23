import type { Request, Response, NextFunction } from "express";
import { jobSchema } from "../../schema/job.js";

export function validateJobBody(req: Request, res: Response, next: NextFunction): void {
  const result = jobSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  req.body = result.data;
  next();
}
