import { redis } from "./redisClient";
import { QueueMeta } from "./types";

const queueKey = (region: string) => `queue:${region}`;
const metaKey = (userId: string) => `qmeta:${userId}`;

export async function joinQueue(userId: string, region: string, elo: number): Promise<void> {
  await redis.zadd(queueKey(region), elo, userId);
  const meta: QueueMeta = { region, elo, joinedAt: Date.now() };
  await redis.set(metaKey(userId), JSON.stringify(meta));
}

export async function leaveQueue(userId: string, region: string): Promise<void> {
  await redis.zrem(queueKey(region), userId);
  await redis.del(metaKey(userId));
}

export async function getQueueMeta(userId: string): Promise<QueueMeta | null> {
  const raw = await redis.get(metaKey(userId));
  return raw ? (JSON.parse(raw) as QueueMeta) : null;
}

export async function getQueueMembersWithScores(
  region: string
): Promise<{ userId: string; elo: number }[]> {
  const raw = await redis.zrange(queueKey(region), 0, -1, "WITHSCORES");
  const out: { userId: string; elo: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ userId: raw[i], elo: Number(raw[i + 1]) });
  }
  return out;
}

export async function removeFromQueue(userIds: string[], region: string): Promise<void> {
  if (userIds.length === 0) return;
  await redis.zrem(queueKey(region), ...userIds);
  await Promise.all(userIds.map((id) => redis.del(metaKey(id))));
}
