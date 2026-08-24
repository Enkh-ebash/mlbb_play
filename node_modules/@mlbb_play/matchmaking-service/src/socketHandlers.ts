import { Server, Socket } from "socket.io";
import { joinQueue, leaveQueue } from "./queue";
import {
  getMatch,
  recordAccept,
  getAcceptCount,
  cancelMatch,
  scheduleAcceptTimeout,
  clearAcceptTimeout,
} from "./matchmaker";
import { MatchRecord } from "./types";

/**
 * In-memory socket registry. Fine for a single-instance dev/thesis
 * deployment. Scaling to multiple gateway instances later needs a
 * Redis-backed Socket.IO adapter so MATCH_FOUND can reach a socket
 * connected to a different instance than the one that formed the match.
 */
const socketsByUser = new Map<string, string>();
const usersBySocket = new Map<string, string>();

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("identify", ({ userId }: { userId: string }) => {
      // TODO: verify a JWT here instead of trusting the client-sent id
      // once auth-service exists (Phase 2).
      socketsByUser.set(userId, socket.id);
      usersBySocket.set(socket.id, userId);
    });

    socket.on(
      "join_queue",
      async ({ userId, region, elo }: { userId: string; region: string; elo: number }) => {
        // TODO(Phase 2): once auth-service exists, look up elo
        // server-side from the authenticated user's record instead
        // of trusting the client-supplied value — trusting the
        // client here is a known simplification for the Phase 1 demo.
        await joinQueue(userId, region, elo);
        socket.emit("queue_joined", { region, elo });
      }
    );

    socket.on("leave_queue", async ({ userId, region }: { userId: string; region: string }) => {
      await leaveQueue(userId, region);
      socket.emit("queue_left");
    });

    // DEV/DEMO ONLY — fills the queue with 9 fake bot players near the
    // caller's ELO so the full matchmaking flow can be demoed solo
    // (e.g. for a thesis defense) without needing 9 other real
    // testers online at once. Gate or remove before any real deploy.
    if (process.env.NODE_ENV !== "production") {
      socket.on("dev_seed_bots", async ({ region, elo }: { region: string; elo: number }) => {
        for (let i = 0; i < 9; i++) {
          const botElo = elo + Math.floor(Math.random() * 80 - 40);
          await joinQueue(`bot_${Date.now()}_${i}`, region, botElo);
        }
      });
    }

    socket.on("match_accept", async ({ matchId, userId }: { matchId: string; userId: string }) => {
      await handleAccept(io, matchId, userId);
    });

    socket.on("match_decline", async ({ matchId, userId }: { matchId: string; userId: string }) => {
      await handleDecline(io, matchId, userId);
    });

    socket.on("disconnect", () => {
      const userId = usersBySocket.get(socket.id);
      if (userId) {
        socketsByUser.delete(userId);
        usersBySocket.delete(socket.id);
      }
    });
  });
}

export function emitToUser(io: Server, userId: string, event: string, payload: unknown): void {
  const socketId = socketsByUser.get(userId);
  if (socketId) io.to(socketId).emit(event, payload);
}

export function broadcastMatchFound(io: Server, match: MatchRecord): void {
  match.players.forEach((p) => emitToUser(io, p.userId, "MATCH_FOUND", match));
  scheduleAcceptTimeout(match.matchId, () => handleTimeout(io, match.matchId));
}

async function handleAccept(io: Server, matchId: string, userId: string): Promise<void> {
  const match = await getMatch(matchId);
  if (!match || match.status !== "PENDING_ACCEPT") return;

  await recordAccept(matchId, userId);
  emitToUser(io, userId, "MATCH_ACCEPT_CONFIRMED", { matchId });

  const acceptedCount = await getAcceptCount(matchId);
  if (acceptedCount >= match.players.length) {
    clearAcceptTimeout(matchId);
    match.players.forEach((p) =>
      emitToUser(io, p.userId, "LOBBY_READY", { lobbyId: matchId, players: match.players })
    );
    // Redis state's job ends here — lobby/pick-ban ownership moves to
    // a lobby service in Phase 2.
    await cancelMatch(matchId);
  }
}

async function handleDecline(io: Server, matchId: string, decliningUserId: string): Promise<void> {
  const match = await getMatch(matchId);
  if (!match) return;
  await requeueAcceptedPlayers(io, match, decliningUserId, "declined");
}

async function handleTimeout(io: Server, matchId: string): Promise<void> {
  const match = await getMatch(matchId);
  if (!match || match.status !== "PENDING_ACCEPT") return; // already resolved
  await requeueAcceptedPlayers(io, match, null, "timeout");
}

async function requeueAcceptedPlayers(
  io: Server,
  match: MatchRecord,
  decliningUserId: string | null,
  reason: "declined" | "timeout"
): Promise<void> {
  await cancelMatch(match.matchId);
  for (const p of match.players) {
    if (p.userId === decliningUserId) {
      emitToUser(io, p.userId, "MATCH_CANCELLED", { reason: "you_declined" });
      continue;
    }
    // Everyone else goes back in the queue at their original ELO.
    // NOTE: this resets their wait clock. A fairer version would
    // credit back time already spent waiting — left as a known
    // simplification for Phase 1.
    await joinQueue(p.userId, match.region, p.elo);
    emitToUser(io, p.userId, "MATCH_CANCELLED", { reason });
  }
}
