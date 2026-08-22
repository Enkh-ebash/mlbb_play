import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// --- Phase 1 targets -------------------------------------------------
// matchmaking-service and mmr-service are separate processes; the
// gateway just proxies to them so the frontend only ever talks to
// one origin. Fill these in as each service comes online — until
// then they'll 502, which is expected.

app.use(
  "/api/v1/matchmaking",
  createProxyMiddleware({
    target: process.env.MATCHMAKING_SERVICE_URL ?? "http://localhost:3002",
    changeOrigin: true,
  })
);

app.use(
  "/api/v1/mmr",
  createProxyMiddleware({
    target: process.env.MMR_SERVICE_URL ?? "http://localhost:3003",
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on :${PORT}`);
});
