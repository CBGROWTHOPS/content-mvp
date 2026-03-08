import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate.js";
import flowsRouter from "./routes/flows.js";
import jobsRouter from "./routes/jobs.js";
import brandsRouter from "./routes/brands.js";
import brandKitsRouter from "./routes/brandKits.js";
import saveToDriveRouter from "./routes/saveToDrive.js";
import customerProfilesRouter from "./routes/customerProfiles.js";

const allowedOrigins = [
  "https://content-admin-nine.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  /^http:\/\/localhost:\d+$/, // Any localhost port for dev
  /^https:\/\/content-admin-nine-[a-z0-9-]+\.vercel\.app$/, // Vercel preview
  /^https:\/\/content-admin-.*\.vercel\.app$/, // Vercel automatic aliases
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Same-origin or non-browser
    const ok = allowedOrigins.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    cb(null, ok);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions)); // Explicit allowlist for Vercel UI + localhost
app.use(express.json());

app.get("/health", async (_req, res) => {
  const status = "ok";

  // ElevenLabs — voiceover
  let elevenlabs: "connected" | "missing" | "invalid" = "missing";
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": elevenKey },
        signal: AbortSignal.timeout(5000),
      });
      elevenlabs = r.ok ? "connected" : "invalid";
    } catch {
      elevenlabs = "invalid";
    }
  }

  // Replicate — images, video fallback
  let replicate: "connected" | "missing" | "invalid" = "missing";
  const repToken = process.env.REPLICATE_API_TOKEN;
  if (repToken) {
    try {
      const r = await fetch("https://api.replicate.com/v1/account", {
        headers: { Authorization: `Token ${repToken}` },
        signal: AbortSignal.timeout(5000),
      });
      replicate = r.ok ? "connected" : "invalid";
    } catch {
      replicate = "invalid";
    }
  }

  // Higgsfield — images, video (primary, before Replicate fallback)
  let higgsfield: "connected" | "missing" | "invalid" = "missing";
  const hfKey = process.env.HIGGSFIELD_API_KEY;
  if (hfKey) {
    try {
      const r = await fetch("https://cloud.higgsfield.ai/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: hfKey }),
        signal: AbortSignal.timeout(8000),
      });
      higgsfield = r.ok ? "connected" : "invalid";
    } catch {
      higgsfield = "invalid";
    }
  }

  // OpenAI — copy, briefs, storyboard
  let openai: "connected" | "missing" | "invalid" = "missing";
  const oaiKey = process.env.OPENAI_API_KEY;
  if (oaiKey) {
    openai = "connected"; // No lightweight check; assume valid if set
  }

  const apis = { elevenlabs, replicate, higgsfield, openai };

  const models = [
    { use: "Voiceover", provider: "ElevenLabs", model: "eleven_monolingual_v1" },
    { use: "Copy & briefs", provider: "OpenAI", model: "gpt-4o-mini" },
    { use: "Images (primary)", provider: "Higgsfield", model: "nano-banana-pro" },
    { use: "Images (fallback)", provider: "Replicate", model: "black-forest-labs/flux-1.1-pro" },
    { use: "Video b-roll (primary)", provider: "Higgsfield", model: "dop-standard" },
    { use: "Video b-roll (fallback)", provider: "Replicate", model: "google/veo-3-fast" },
    { use: "Video UGC (primary)", provider: "Higgsfield", model: "kling-3.0" },
    { use: "Video UGC (fallback)", provider: "Replicate", model: "kling-ai/kling-video-3.0" },
    { use: "Image-to-video", provider: "Replicate", model: "stability-ai/stable-video-diffusion" },
  ];

  res.json({ status, apis, models });
});

app.use(generateRouter);
app.use(customerProfilesRouter);
app.post("/batch", (req, res, next) => {
  const orig = req.url;
  req.url = "/content-batch";
  flowsRouter(req, res, (err: unknown) => {
    req.url = orig;
    if (err) next(err);
  });
});
app.use("/flows", flowsRouter);
app.use("/jobs", jobsRouter);
app.use("/brands", brandsRouter);
app.use("/brand-kits", brandKitsRouter);
app.use(saveToDriveRouter);

export default app;
