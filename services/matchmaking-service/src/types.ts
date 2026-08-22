export type Region = string;
export type Team = "BLUE" | "RED";
export type MatchStatus = "PENDING_ACCEPT" | "LOBBY_READY" | "CANCELLED";

export interface QueueMeta {
  region: Region;
  elo: number;
  joinedAt: number; // epoch ms
}

export interface MatchPlayer {
  userId: string;
  elo: number;
  team: Team;
}

export interface MatchRecord {
  matchId: string;
  region: Region;
  status: MatchStatus;
  players: MatchPlayer[];
  createdAt: number;
  acceptDeadline: number;
}
