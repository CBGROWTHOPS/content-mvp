import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate.js";
import flowsRouter from "./routes/flows.js";
import jobsRouter from "./routes/jobs.js";
import brandsRouter from "./routes/brands.js";
import saveToDriveRouter from "./routes/saveToDrive.js";

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
app.use("/flows", flowsRouter);
app.use("/jobs", jobsRouter);
app.use("/brands", brandsRouter);
app.use(saveToDriveRouter);

export default app;
