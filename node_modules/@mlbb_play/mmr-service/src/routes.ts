import { Router, Request, Response } from "express";
import { User, EloHistory } from "@mlbb_play/common";
import { calculateEloChange } from "./eloEngine";
import { tierForElo, tierRank } from "./rankTiers";

export const mmrRouter = Router();

interface MatchPlayerInput {
  userId: string;
  team: "BLUE" | "RED";
  kills: number;
  deaths: number;
  assists: number;
  isMvp: boolean;
}

interface CalculateBody {
  matchId: string;
  winningTeam: "BLUE" | "RED";
  players: MatchPlayerInput[];
}

mmrRouter.post("/calculate", async (req: Request<{}, {}, CalculateBody>, res: Response) => {
  const { matchId, winningTeam, players } = req.body;

  if (!matchId || !winningTeam || !Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ error: "matchId, winningTeam, and players[] are required" });
  }

  const users = await User.find({ _id: { $in: players.map((p) => p.userId) } });
  const userById = new Map(users.map((u) => [u.id.toString(), u]));

  const eloByTeam: Record<"BLUE" | "RED", number[]> = { BLUE: [], RED: [] };
  for (const p of players) {
    const user = userById.get(p.userId);
    if (user) eloByTeam[p.team].push(user.elo);
  }
  const avgElo = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 1000);
  const teamAvg = { BLUE: avgElo(eloByTeam.BLUE), RED: avgElo(eloByTeam.RED) };

  const results = [];

  for (const p of players) {
    const user = userById.get(p.userId);
    if (!user) {
      results.push({ userId: p.userId, error: "user not found" });
      continue;
    }

    const won = p.team === winningTeam;
    const opponentTeam = p.team === "BLUE" ? "RED" : "BLUE";
    const kda = (p.kills + p.assists) / Math.max(1, p.deaths);

    const calc = calculateEloChange({
      playerElo: user.elo,
      opponentAvgElo: teamAvg[opponentTeam],
      won,
      totalMatches: user.totalMatches,
      kda,
      isMvp: p.isMvp,
    });

    const eloBefore = user.elo;
    const eloAfter = Math.max(0, eloBefore + calc.eloChange);
    const oldTier = user.rankTier;
    const newTier = tierForElo(eloAfter);

    user.elo = eloAfter;
    user.rankTier = newTier;
    user.rankPoints = eloAfter;
    user.totalMatches += 1;
    if (won) user.wins += 1;
    else user.losses += 1;
    user.winRate = user.totalMatches > 0 ? user.wins / user.totalMatches : 0;
    if (p.isMvp) user.stats.mvpCount += 1;
    user.stats.kills += p.kills;
    user.stats.deaths += p.deaths;
    user.stats.assists += p.assists;

    await user.save();
    await EloHistory.create({
      userId: user.id,
      matchId,
      eloBefore,
      eloAfter,
      eloChange: calc.eloChange,
      kFactor: calc.kFactor,
      performanceBonus: calc.performanceBonus,
      won,
    });

    results.push({
      userId: p.userId,
      eloBefore,
      eloAfter,
      eloChange: calc.eloChange,
      rankTier: newTier,
      promoted: tierRank(newTier) > tierRank(oldTier),
      demoted: tierRank(newTier) < tierRank(oldTier),
    });
  }

  res.json({ matchId, results });
});

mmrRouter.get("/history/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = Math.min(200, Number(req.query.limit) || 50);

  const history = await EloHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  res.json({ userId, history });
});
