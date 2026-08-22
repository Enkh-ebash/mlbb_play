import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Swords, Users, Calendar, Shield, User } from "lucide-react";
import { useAuthStore } from "../../store";

// Only Dashboard + Matchmaking are wired up in Phase 1. The rest stay
// visible (so the nav reads as the full product) but are marked
// "Тун удахгүй" until their services land in later phases.
const navItems = [
  { path: "/", label: "Нүүр", icon: Trophy, ready: true },
  { path: "/matchmaking", label: "Матчмайкинг", icon: Swords, ready: true },
  { path: "/leaderboard", label: "Лидерборд", icon: Users, ready: false },
  { path: "/tournaments", label: "Тэмцээнүүд", icon: Calendar, ready: false },
  { path: "/clans", label: "Кланууд", icon: Shield, ready: false },
  { path: "/profile", label: "Профайл", icon: User, ready: false },
];

export function Layout() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen grid-bg">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-cyber-purple/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-purple to-cyber-blue flex items-center justify-center">
                <span className="text-xl">🎮</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">
                <span className="text-cyber-purple">MLBB</span>
                <span className="text-cyber-cyan"> PLAY</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon, ready }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={ready ? path : "#"}
                    aria-disabled={!ready}
                    className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      !ready
                        ? "text-gray-600 cursor-not-allowed"
                        : active
                        ? "bg-cyber-purple/20 text-cyber-purple"
                        : "hover:bg-white/5 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                    {!ready && (
                      <span className="text-[10px] text-gray-500 ml-1">
                        тун удахгүй
                      </span>
                    )}
                    {active && ready && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-purple"
                        style={{ borderRadius: "2px" }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">{user.username}</span>
                  <span className="rank-badge bg-cyber-purple/20 text-cyber-purple">
                    {user.elo} ELO
                  </span>
                </div>
              ) : (
                <Link to="/login" className="cyber-button-secondary text-sm">
                  Нэвтрэх
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 container mx-auto px-4">
        <Outlet />
      </main>
    </div>
  );
}
