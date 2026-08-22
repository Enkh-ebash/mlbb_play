import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectMongo } from "@mlbb_play/common";
import { redis } from "./redisClient";
import { startMatchmakingLoop } from "./matchmaker";
import { registerSocketHandlers, broadcastMatchFound } from "./socketHandlers";

const PORT = process.env.PORT ?? 3002;
// Single-region for now (Mongolia diploma scope). Add more regions
// by calling startMatchmakingLoop again with a different code.
const REGION = process.env.MATCHMAKING_REGION ?? "MN";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "matchmaking-service",
    redis: redis.status === "ready",
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

registerSocketHandlers(io);
startMatchmakingLoop(REGION, (match) => broadcastMatchFound(io, match));

async function start() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`[matchmaking-service] listening on :${PORT} (region=${REGION})`);
  });
}

start();
