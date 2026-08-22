import { Schema, model, Document } from "mongoose";

/**
 * Rank tiers, low -> high. Mirrors MLBB's own rank ladder so the UI
 * (rank-icons, rank badge colors in tailwind.config.js) lines up 1:1.
 */
export const RANK_TIERS = [
  "warrior",
  "elite",
  "master",
  "grandmaster",
  "epic",
  "legend",
  "mythic",
  "mythical_honor",
  "mythical_glory",
] as const;

export type RankTier = (typeof RANK_TIERS)[number];

export interface IUser extends Document {
  odyseeId: string; // in-game ID shown on the MLBB client
  username: string;
  email: string;
  passwordHash: string;
  region: string;

  // Matchmaking + ELO fields — this is the part Phase 1 reads/writes.
  elo: number;
  rankTier: RankTier;
  rankPoints: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;

  stats: {
    kills: number;
    deaths: number;
    assists: number;
    mvpCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    odyseeId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    region: { type: String, required: true, default: "MN" },

    elo: { type: Number, required: true, default: 1000, index: true },
    rankTier: {
      type: String,
      enum: RANK_TIERS,
      required: true,
      default: "warrior",
    },
    rankPoints: { type: Number, required: true, default: 0 },
    totalMatches: { type: Number, required: true, default: 0 },
    wins: { type: Number, required: true, default: 0 },
    losses: { type: Number, required: true, default: 0 },
    winRate: { type: Number, required: true, default: 0 },

    stats: {
      kills: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      mvpCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index used by the matchmaking service to pull candidates
// within an ELO band for a given region without a full collection scan.
UserSchema.index({ region: 1, elo: 1 });

export const User = model<IUser>("User", UserSchema);
