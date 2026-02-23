import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate.js";
import jobsRouter from "./routes/jobs.js";

const allowedOrigins = [
  "https://content-admin-nine.vercel.app",
  "http://localhost:3000",
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
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions)); // Explicit allowlist for Vercel UI + localhost
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(generateRouter);
app.use("/jobs", jobsRouter);

export default app;
