import { Router, type Request, type Response } from "express";

const router = Router();

const MATON_API_BASE = "https://api.maton.ai";

interface SaveToDriveBody {
  generateResponse: unknown;
  strategySelection: unknown;
  brandId: string;
}

router.post("/save-to-drive", async (req: Request, res: Response) => {
  try {
    const { generateResponse, strategySelection, brandId } = req.body as SaveToDriveBody;
    if (!generateResponse || !brandId) {
      res.status(400).json({ error: "generateResponse and brandId required" });
      return;
    }

    const apiKey = process.env.MATON_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: "Save to Drive not configured (MATON_API_KEY)",
      });
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const slug = brandId.replace(/\s+/g, "_").toLowerCase();
    const suffix = Date.now().toString(36);
    const filename = `${date}_${slug}_content_${suffix}.json`;

    const content = JSON.stringify(
      {
        generateResponse,
        strategySelection: strategySelection ?? {},
        brandId,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );

    const args: Record<string, unknown> = {
      content,
      mime_type: "application/json",
      name: filename,
    };
    const parentId = process.env.MATON_DRIVE_FOLDER_ID;
    if (parentId) {
      args.parent_id = parentId;
    }

    const matonRes = await fetch(`${MATON_API_BASE}/invoke-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        app: "google-drive",
        action: "create-file",
        args,
      }),
    });

    const matonJson = (await matonRes.json().catch(() => ({}))) as {
      id?: string;
      webViewLink?: string;
      error?: string;
    };

    if (!matonRes.ok) {
      const errMsg =
        (matonJson as { message?: string }).message ??
        matonJson.error ??
        matonRes.statusText;
      console.error("Maton API error:", matonRes.status, matonJson);
      res.status(502).json({
        success: false,
        error: `Save to Drive failed: ${errMsg}`,
      });
      return;
    }

    const fileUrls = matonJson.webViewLink ? [matonJson.webViewLink] : undefined;

    res.json({
      success: true,
      fileUrls,
      fileId: matonJson.id,
    });
  } catch (err) {
    console.error("Save to Drive error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
