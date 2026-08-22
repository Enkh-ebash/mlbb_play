import { create } from "zustand";

export interface AuthUser {
  id: string;
  username: string;
  elo: number;
  rankTier: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
}));

// --- Matchmaking (Phase 1 priority feature) ---------------------------

export type QueueStatus = "idle" | "searching" | "match_found" | "in_lobby";

interface MatchmakingState {
  status: QueueStatus;
  eloRange: number; // current search tolerance, widens over time
  secondsInQueue: number;
  setStatus: (status: QueueStatus) => void;
  setEloRange: (range: number) => void;
  tick: () => void;
  reset: () => void;
}

export const useMatchmakingStore = create<MatchmakingState>((set) => ({
  status: "idle",
  eloRange: 100,
  secondsInQueue: 0,
  setStatus: (status) => set({ status }),
  setEloRange: (eloRange) => set({ eloRange }),
  tick: () => set((s) => ({ secondsInQueue: s.secondsInQueue + 1 })),
  reset: () => set({ status: "idle", eloRange: 100, secondsInQueue: 0 }),
}));
