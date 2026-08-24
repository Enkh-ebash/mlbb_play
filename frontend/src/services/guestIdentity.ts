import type { AuthUser } from "../store";

const STORAGE_KEY = "mlbb_play_guest_identity";

/**
 * Dev-only stand-in for real auth (Phase 2). Generates a stable guest
 * identity per browser TAB (sessionStorage, not localStorage — that's
 * deliberate: it lets you open several tabs to simulate several
 * different players when testing matchmaking locally). Delete this
 * once auth-service and real login exist.
 */
export function getOrCreateGuestIdentity(): AuthUser {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw) as AuthUser;

  const identity: AuthUser = {
    id: `guest_${Math.random().toString(36).slice(2, 10)}`,
    username: `Тоглогч${Math.floor(1000 + Math.random() * 9000)}`,
    elo: 900 + Math.floor(Math.random() * 500),
    rankTier: "warrior",
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}
