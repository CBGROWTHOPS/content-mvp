import express from "express";
import generateRouter from "./routes/generate.js";
import jobsRouter from "./routes/jobs.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(generateRouter);
app.use("/jobs", jobsRouter);

export default app;
