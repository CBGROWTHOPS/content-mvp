import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate.js";
import flowsRouter from "./routes/flows.js";
import jobsRouter from "./routes/jobs.js";
import brandsRouter from "./routes/brands.js";
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
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions)); // Explicit allowlist for Vercel UI + localhost
app.use(express.json());

// #region agent log
app.use((req, _res, next) => {
  if (req.method === 'POST') {
    console.log(`REQ ${req.method} ${req.path} origin=${req.headers.origin || 'none'}`);
  }
  next();
});
// #endregion

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(generateRouter);
app.use(customerProfilesRouter);
app.use("/flows", flowsRouter);
app.use("/jobs", jobsRouter);
app.use("/brands", brandsRouter);
app.use(saveToDriveRouter);

export default app;
