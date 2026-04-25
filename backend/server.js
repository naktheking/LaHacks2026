import "dotenv/config";
import express from "express";
import { searchReliefCenters } from "./api/lib/relief-search.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "safepath-backend" });
});

app.get(["/api/shelters", "/api/shelter"], async (req, res) => {
  try {
    const data = await searchReliefCenters(req.query);
    res.json(data);
  } catch (error) {
    const status = error.statusCode ?? 500;
    res.status(status).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`SafePath backend listening on http://localhost:${port}`);
});
