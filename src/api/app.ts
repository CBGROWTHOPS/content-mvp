import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate.js";
import jobsRouter from "./routes/jobs.js";

const app = express();
app.use(cors()); // Allow Vercel frontend and other origins to call Railway API
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(generateRouter);
app.use("/jobs", jobsRouter);

export default app;
