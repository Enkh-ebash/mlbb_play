import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEloChange, kFactorFor, expectedScore } from "./eloEngine";

test("new player's first win gains close to a full K-factor swing", () => {
  const result = calculateEloChange({
    playerElo: 1000,
    opponentAvgElo: 1000,
    won: true,
    totalMatches: 0,
    kda: 2,
    isMvp: false,
  });
  assert.equal(kFactorFor(0), 32);
  // Even matchup -> expected 0.5 -> base swing ~16, plus a small bonus.
  assert.ok(result.eloChange >= 15 && result.eloChange <= 20, `got ${result.eloChange}`);
});

test("a high-K veteran beating a much lower-ELO opponent gains little", () => {
  const result = calculateEloChange({
    playerElo: 2200,
    opponentAvgElo: 1400,
    won: true,
    totalMatches: 250, // veteran -> K=12
    kda: 3,
    isMvp: false,
  });
  assert.equal(kFactorFor(250), 12);
  // Expected score for +800 ELO gap is near 1.0, so the base swing is
  // tiny; the win must still net at least +1 by the floor rule.
  assert.ok(result.eloChange >= 1 && result.eloChange <= 5, `got ${result.eloChange}`);
});

test("a losing streak always nets a negative ELO change, even with a strong KDA", () => {
  const result = calculateEloChange({
    playerElo: 1500,
    opponentAvgElo: 1500,
    won: false,
    totalMatches: 50,
    kda: 6, // capped bonus, but a loss can never flip positive
    isMvp: true,
  });
  assert.ok(result.eloChange < 0, `expected a loss to net negative, got ${result.eloChange}`);
});

test("expectedScore is 0.5 for equal ELO and favors the higher-rated player", () => {
  assert.equal(expectedScore(1000, 1000), 0.5);
  assert.ok(expectedScore(1200, 1000) > 0.5);
  assert.ok(expectedScore(1000, 1200) < 0.5);
});
