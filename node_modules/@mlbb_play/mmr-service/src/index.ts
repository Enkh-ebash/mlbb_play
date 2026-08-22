import express from "express";
import { connectMongo } from "@mlbb_play/common";
import { mmrRouter } from "./routes";

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mmr-service" });
});

app.use("/api/v1/mmr", mmrRouter);

async function start() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`[mmr-service] listening on :${PORT}`);
  });
}

start();
