/**
 * Dynamic ELO with an anti-inflation K-factor and a capped performance
 * bonus (MVP / KDA), per the platform's Phase 1 design doc.
 */

export interface EloCalcInput {
  playerElo: number;
  opponentAvgElo: number;
  won: boolean;
  totalMatches: number; // matches played BEFORE this one
  kda: number; // (kills + assists) / max(1, deaths)
  isMvp: boolean;
}

export interface EloCalcResult {
  kFactor: number;
  expectedScore: number;
  performanceBonus: number;
  eloChange: number;
}

/** Veterans move less per game than newer players. */
export function kFactorFor(totalMatches: number): number {
  if (totalMatches < 30) return 32;
  if (totalMatches < 100) return 20;
  return 12;
}

/** Standard logistic expected-score curve, 400-point ELO scale. */
export function expectedScore(playerElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - playerElo) / 400));
}

/**
 * Bonus from individual performance, capped so a strong KDA/MVP game
 * can never flip a loss into a net ELO gain (or a win into a net
 * loss) — it can only nudge the result within the same match.
 */
export function performanceBonus(kda: number, isMvp: boolean, kFactor: number): number {
  const kdaComponent = Math.min(kda, 5) * 0.4; // diminishing returns past 5.0 KDA
  const mvpComponent = isMvp ? 2 : 0;
  const rawBonus = kdaComponent + mvpComponent;

  // Cap: bonus can be at most ~25% of the base K-swing, in either
  // direction, so it stays a modifier rather than the main driver.
  const cap = kFactor * 0.25;
  return Math.max(-cap, Math.min(cap, rawBonus));
}

export function calculateEloChange(input: EloCalcInput): EloCalcResult {
  const kFactor = kFactorFor(input.totalMatches);
  const expected = expectedScore(input.playerElo, input.opponentAvgElo);
  const actual = input.won ? 1 : 0;
  const bonus = performanceBonus(input.kda, input.isMvp, kFactor);

  const baseSwing = kFactor * (actual - expected);
  let eloChange = Math.round(baseSwing + bonus);

  // A loss should never produce a net positive ELO change, and a win
  // should never produce a net negative one — the bonus rewards good
  // individual play within the result, not against it.
  if (!input.won && eloChange > 0) eloChange = Math.min(eloChange, -1);
  if (input.won && eloChange < 0) eloChange = Math.max(eloChange, 1);

  return { kFactor, expectedScore: expected, performanceBonus: bonus, eloChange };
}
