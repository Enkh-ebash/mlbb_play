/**
 * Standalone check against a real Redis instance (docker-compose up
 * redis, or a local redis-server) — no Mongo, no HTTP server needed.
 * Seeds 10 fake players and confirms the queue actually forms a
 * balanced match. Run with: npm run smoke -w services/matchmaking-service
 */
import { joinQueue } from "./queue";
import { startMatchmakingLoop, currentTolerance } from "./matchmaker";

async function main() {
  console.log("tolerance at t=0s:", currentTolerance(0));
  console.log("tolerance at t=25s:", currentTolerance(25_000));

  for (let i = 0; i < 10; i++) {
    await joinQueue(`user${i}`, "MN", 1000 + i * 5);
  }
  console.log("seeded 10 players into MN queue");

  const stop = startMatchmakingLoop(
    "MN",
    (match) => {
      console.log("MATCH FOUND:");
      console.log("  matchId:", match.matchId);
      console.log("  BLUE team elos:", match.players.filter(p => p.team === "BLUE").map(p => p.elo));
      console.log("  RED team elos: ", match.players.filter(p => p.team === "RED").map(p => p.elo));
      const blueAvg = match.players.filter(p=>p.team==="BLUE").reduce((a,p)=>a+p.elo,0)/5;
      const redAvg = match.players.filter(p=>p.team==="RED").reduce((a,p)=>a+p.elo,0)/5;
      console.log("  BLUE avg:", blueAvg, " RED avg:", redAvg);
      stop();
      process.exit(0);
    },
    500
  );

  setTimeout(() => {
    console.log("FAILED: no match formed within timeout");
    process.exit(1);
  }, 6000);
}

main();
