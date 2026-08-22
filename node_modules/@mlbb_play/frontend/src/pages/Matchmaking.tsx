import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, X, Check, Loader2 } from "lucide-react";
import { useAuthStore, useMatchmakingStore } from "../store";

/**
 * TODO (Step 1 wiring): this page currently simulates the queue with
 * local timers so the flow is demoable end-to-end. Once
 * matchmaking-service exposes its real endpoints, replace:
 *  - handleJoinQueue()   -> POST /api/v1/matchmaking/queue/join
 *  - the tick interval   -> a socket.io connection subscribed to
 *                           "QUEUE_UPDATE" / "MATCH_FOUND" events
 *  - handleAccept/Decline -> emit "MATCH_ACCEPT" / "MATCH_DECLINE"
 */
export function Matchmaking() {
  const { user } = useAuthStore();
  const { status, eloRange, secondsInQueue, setStatus, setEloRange, tick, reset } =
    useMatchmakingStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "searching") return;

    intervalRef.current = setInterval(() => {
      tick();
      // Widen the ELO tolerance every 10s, capped at ±300 — mirrors
      // the real service's expansion rule from the Step 1 prompt.
      const next = secondsInQueue + 1;
      if (next % 10 === 0) {
        setEloRange(Math.min(300, eloRange + 25));
      }
      // Demo-only: "find" a match after 15s so the accept/decline
      // flow can be reviewed without a live backend.
      if (next >= 15) {
        setStatus("match_found");
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsInQueue]);

  const handleJoinQueue = () => setStatus("searching");
  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    reset();
  };
  const handleAccept = () => setStatus("in_lobby");
  const handleDecline = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    reset();
  };

  return (
    <div className="flex flex-col items-center gap-8 mt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">Матчмайкинг</h1>
        <p className="text-gray-400">
          Одоогийн ELO:{" "}
          <span className="text-cyber-purple font-semibold">
            {user?.elo ?? 1000}
          </span>
        </p>
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
                {String(secondsInQueue % 60).padStart(2, "0")} — ELO муж: ±
                {eloRange}
              </div>
            </div>
            <button onClick={handleCancel} className="cyber-button-secondary text-sm">
              Цуцлах
            </button>
          </motion.div>
        )}

        {status === "match_found" && (
          <motion.div
            key="match_found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="cyber-card p-10 flex flex-col items-center gap-6 border-cyber-cyan/50"
          >
            <div className="text-2xl font-bold text-cyber-cyan neon-text">
              Тоглолт олдлоо!
            </div>
            <p className="text-sm text-gray-400">30 секундын дотор баталгаажуулна уу</p>
            <div className="flex gap-4">
              <button
                onClick={handleAccept}
                className="cyber-button flex items-center gap-2"
              >
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
            <div className="text-xl font-semibold text-cyber-green">
              Лобби руу шилжлээ
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Pick/Ban шат — дараагийн шатны prompt-оор хийгдэнэ.
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
