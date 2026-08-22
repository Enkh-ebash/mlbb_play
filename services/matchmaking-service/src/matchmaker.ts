import { randomUUID } from "crypto";
import { redis } from "./redisClient";
import { getQueueMeta, getQueueMembersWithScores, removeFromQueue } from "./queue";
import { MatchPlayer, MatchRecord, Team } from "./types";

const TEAM_SIZE = 5;
const MATCH_SIZE = TEAM_SIZE * 2;
const BASE_TOLERANCE = 100;
const TOLERANCE_STEP = 25;
const MAX_TOLERANCE = 300;
const WIDEN_INTERVAL_SEC = 10;
export const ACCEPT_WINDOW_MS = 30_000;

const acceptTimers = new Map<string, NodeJS.Timeout>();

/** ±100 at join, widening by 25 every 10s in queue, capped at ±300. */
export function currentTolerance(waitMs: number): number {
  const widenSteps = Math.floor(waitMs / 1000 / WIDEN_INTERVAL_SEC);
  return Math.min(MAX_TOLERANCE, BASE_TOLERANCE + widenSteps * TOLERANCE_STEP);
}

/**
 * Classic snake draft over the 10 players sorted by ELO desc, so both
 * teams end up with a comparable average ELO rather than one team
 * getting all the high-ELO players.
 */
function assignTeams(players: { userId: string; elo: number }[]): MatchPlayer[] {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  const pattern: Team[] = ["BLUE", "RED", "RED", "BLUE", "BLUE", "RED", "RED", "BLUE", "BLUE", "RED"];
  return sorted.map((p, i) => ({ userId: p.userId, elo: p.elo, team: pattern[i] }));
}

async function tryFormMatch(
  region: string,
  onMatchFound: (match: MatchRecord) => void
): Promise<void> {
  const members = await getQueueMembersWithScores(region);
  if (members.length < MATCH_SIZE) return;

  const matchedThisPass = new Set<string>();

  const withWait = await Promise.all(
    members.map(async (m) => {
      const meta = await getQueueMeta(m.userId);
      return { ...m, joinedAt: meta?.joinedAt ?? Date.now() };
    })
  );
  // Longest-waiting players get first shot at forming a match, so
  // nobody gets stuck behind players who joined after them.
  withWait.sort((a, b) => a.joinedAt - b.joinedAt);

  for (const seed of withWait) {
    if (matchedThisPass.has(seed.userId)) continue;

    const tolerance = currentTolerance(Date.now() - seed.joinedAt);
    const candidates = withWait.filter(
      (m) => !matchedThisPass.has(m.userId) && Math.abs(m.elo - seed.elo) <= tolerance
    );
    if (candidates.length < MATCH_SIZE) continue;

    const chosen = candidates
      .sort((a, b) => Math.abs(a.elo - seed.elo) - Math.abs(b.elo - seed.elo))
      .slice(0, MATCH_SIZE);

    chosen.forEach((c) => matchedThisPass.add(c.userId));
    await removeFromQueue(
      chosen.map((c) => c.userId),
      region
    );

    const matchId = randomUUID();
    const match: MatchRecord = {
      matchId,
      region,
      status: "PENDING_ACCEPT",
      players: assignTeams(chosen),
      createdAt: Date.now(),
      acceptDeadline: Date.now() + ACCEPT_WINDOW_MS,
    };

    await redis.set(`match:${matchId}`, JSON.stringify(match), "EX", 120);
    onMatchFound(match);
  }
}

export function startMatchmakingLoop(
  region: string,
  onMatchFound: (match: MatchRecord) => void,
  intervalMs = 2000
): () => void {
  const timer = setInterval(() => {
    tryFormMatch(region, onMatchFound).catch((err) =>
      console.error("[matchmaker] tick failed", err)
    );
  }, intervalMs);
  return () => clearInterval(timer);
}

export async function getMatch(matchId: string): Promise<MatchRecord | null> {
  const raw = await redis.get(`match:${matchId}`);
  return raw ? (JSON.parse(raw) as MatchRecord) : null;
}

export async function recordAccept(matchId: string, userId: string): Promise<void> {
  await redis.hset(`match:${matchId}:accepts`, userId, "1");
}

export async function getAcceptCount(matchId: string): Promise<number> {
  const accepts = await redis.hgetall(`match:${matchId}:accepts`);
  return Object.keys(accepts).length;
}

export async function cancelMatch(matchId: string): Promise<void> {
  await redis.del(`match:${matchId}`, `match:${matchId}:accepts`);
  clearAcceptTimeout(matchId);
}

export function scheduleAcceptTimeout(matchId: string, cb: () => void): void {
  const t = setTimeout(cb, ACCEPT_WINDOW_MS);
  acceptTimers.set(matchId, t);
}

export function clearAcceptTimeout(matchId: string): void {
  const t = acceptTimers.get(matchId);
  if (t) clearTimeout(t);
  acceptTimers.delete(matchId);
}
