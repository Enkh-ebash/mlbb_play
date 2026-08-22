import { RankTier, RANK_TIERS } from "@mlbb_play/common";

/** Lower bound (inclusive) of each tier, in ascending order — mirrors
 * MLBB's own ladder so it lines up with the rank-icon assets. */
export const TIER_THRESHOLDS: Record<RankTier, number> = {
  warrior: 0,
  elite: 1000,
  master: 1200,
  grandmaster: 1400,
  epic: 1600,
  legend: 1800,
  mythic: 2000,
  mythical_honor: 2200,
  mythical_glory: 2400,
};

export function tierForElo(elo: number): RankTier {
  let current: RankTier = "warrior";
  for (const tier of RANK_TIERS) {
    if (elo >= TIER_THRESHOLDS[tier]) current = tier;
  }
  return current;
}

export function tierRank(tier: RankTier): number {
  return RANK_TIERS.indexOf(tier);
}
