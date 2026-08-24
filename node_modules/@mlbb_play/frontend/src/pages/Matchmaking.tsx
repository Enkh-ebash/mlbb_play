import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, X, Check, Loader2, Bot } from "lucide-react";
import { useAuthStore, useMatchmakingStore } from "../store";
import { getSocket } from "../services/socket";

interface MatchPlayer {
  userId: string;
  elo: number;
  team: "BLUE" | "RED";
}

interface MatchRecord {
  matchId: string;
  players: MatchPlayer[];
}

export function Matchmaking() {
  const { user } = useAuthStore();
  const { status, eloRange, secondsInQueue, setStatus, setEloRange, tick, reset } =
    useMatchmakingStore();

  const [activeMatch, setActiveMatch] = useState<MatchRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  // Wire up the real matchmaking-service events once. Handlers close
  // over store setters (stable references from zustand), so this
  // effect only needs to run once per mount.
  useEffect(() => {
    const socket = getSocket();

    const onMatchFound = (match: MatchRecord) => {
      setActiveMatch(match);
      setStatus("match_found");
    };
    const onLobbyReady = (payload: { lobbyId: string; players: MatchPlayer[] }) => {
      setActiveMatch({ matchId: payload.lobbyId, players: payload.players });
      setStatus("in_lobby");
    };
    const onCancelled = ({ reason }: { reason: string }) => {
      setCancelReason(reason);
      setActiveMatch(null);
      reset();
    };
    const onQueueLeft = () => reset();

    socket.on("MATCH_FOUND", onMatchFound);
    socket.on("LOBBY_READY", onLobbyReady);
    socket.on("MATCH_CANCELLED", onCancelled);
    socket.on("queue_left", onQueueLeft);

    return () => {
      socket.off("MATCH_FOUND", onMatchFound);
      socket.off("LOBBY_READY", onLobbyReady);
      socket.off("MATCH_CANCELLED", onCancelled);
      socket.off("queue_left", onQueueLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local display-only timer + ELO-tolerance mirror. The server is
  // the source of truth for actual matching; this just mirrors the
  // same widening formula (±25 every 10s, capped at ±300) for the UI.
  useEffect(() => {
    if (status !== "searching") return;
    const interval = setInterval(() => {
      tick();
      setEloRange(Math.min(300, 100 + Math.floor((secondsInQueue + 1) / 10) * 25));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsInQueue]);

  const handleJoinQueue = () => {
    if (!user) return;
    setCancelReason(null);
    getSocket().emit("join_queue", { userId: user.id, region: "MN", elo: user.elo });
    setStatus("searching");
  };

  const handleCancel = () => {
    if (user) getSocket().emit("leave_queue", { userId: user.id, region: "MN" });
    reset();
  };

  const handleAccept = () => {
    if (!user || !activeMatch) return;
    getSocket().emit("match_accept", { matchId: activeMatch.matchId, userId: user.id });
  };

  const handleDecline = () => {
    if (!user || !activeMatch) return;
    getSocket().emit("match_decline", { matchId: activeMatch.matchId, userId: user.id });
  };

  const handleSeedBots = () => {
    if (!user) return;
    getSocket().emit("dev_seed_bots", { region: "MN", elo: user.elo });
  };

  const myTeam = activeMatch?.players.find((p) => p.userId === user?.id)?.team;
  const blueTeam = activeMatch?.players.filter((p) => p.team === "BLUE") ?? [];
  const redTeam = activeMatch?.players.filter((p) => p.team === "RED") ?? [];

  return (
    <div className="flex flex-col items-center gap-8 mt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">Матчмайкинг</h1>
        <p className="text-gray-400">
          Одоогийн ELO:{" "}
          <span className="text-cyber-purple font-semibold">{user?.elo ?? 1000}</span>
        </p>
        {cancelReason && (
          <p className="text-sm text-cyber-red mt-2">
            {cancelReason === "you_declined"
              ? "Чи тоглолтоос татгалзсан."
              : cancelReason === "timeout"
              ? "Тоглолт хугацаандаа бүгд зөвшөөрөгдөөгүй тул цуцлагдлаа."
              : "Тоглолт цуцлагдлаа."}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="cyber-card p-10 flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-purple to-cyber-blue flex items-center justify-center">
              <Swords size={40} />
            </div>
            <button onClick={handleJoinQueue} className="cyber-button flex items-center gap-2">
              <Swords size={18} />
              Тоглолт хайх
            </button>
          </motion.div>
        )}

        {status === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="cyber-card p-10 flex flex-col items-center gap-6 animate-pulse-glow"
          >
            <Loader2 size={48} className="text-cyber-purple animate-spin" />
            <div className="text-center">
              <div className="text-xl font-semibold">Тоглогчид хайж байна...</div>
              <div className="text-sm text-gray-400 mt-1">
                {Math.floor(secondsInQueue / 60)}:
                {String(secondsInQueue % 60).padStart(2, "0")} — ELO муж: ±{eloRange}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="cyber-button-secondary text-sm">
                Цуцлах
              </button>
              <button
                onClick={handleSeedBots}
                title="Ганцаараа туршихад: 9 бот тоглогч нэмнэ"
                className="cyber-button-secondary text-sm flex items-center gap-1 text-cyber-cyan border-cyber-cyan/50"
              >
                <Bot size={16} />9 бот нэмэх
              </button>
            </div>
          </motion.div>
        )}

        {status === "match_found" && (
          <motion.div
            key="match_found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="cyber-card p-10 flex flex-col items-center gap-6 border-cyber-cyan/50 max-w-lg w-full"
          >
            <div className="text-2xl font-bold text-cyber-cyan neon-text">
              Тоглолт олдлоо!
            </div>
            <p className="text-sm text-gray-400">30 секундын дотор баталгаажуулна уу</p>

            <div className="grid grid-cols-2 gap-4 w-full text-sm">
              <div className="cyber-card p-3">
                <div className="font-semibold text-cyber-blue mb-1">
                  BLUE {myTeam === "BLUE" && "(чи)"}
                </div>
                {blueTeam.map((p) => (
                  <div key={p.userId} className="text-gray-400">
                    {p.userId === user?.id ? user?.username : p.userId} — {p.elo}
                  </div>
                ))}
              </div>
              <div className="cyber-card p-3">
                <div className="font-semibold text-cyber-red mb-1">
                  RED {myTeam === "RED" && "(чи)"}
                </div>
                {redTeam.map((p) => (
                  <div key={p.userId} className="text-gray-400">
                    {p.userId === user?.id ? user?.username : p.userId} — {p.elo}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleAccept} className="cyber-button flex items-center gap-2">
                <Check size={18} />
                Зөвшөөрөх
              </button>
              <button
                onClick={handleDecline}
                className="cyber-button-secondary flex items-center gap-2 border-cyber-red/50 text-cyber-red"
              >
                <X size={18} />
                Татгалзах
              </button>
            </div>
          </motion.div>
        )}

        {status === "in_lobby" && (
          <motion.div
            key="in_lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cyber-card p-10 text-center"
          >
            <div className="text-xl font-semibold text-cyber-green">Лобби руу шилжлээ</div>
            <p className="text-sm text-gray-400 mt-2">
              Pick/Ban шат — Phase 2-т нэмэгдэнэ.
            </p>
            <button onClick={handleCancel} className="cyber-button-secondary text-sm mt-4">
              Буцах
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
