import express from "express";
import generateRouter from "./routes/generate.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(generateRouter);

export default app;
