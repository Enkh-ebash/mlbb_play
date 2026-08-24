import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/common/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Matchmaking } from "./pages/Matchmaking";
import { Login } from "./pages/Login";
import { useAuthStore } from "./store";
import { getOrCreateGuestIdentity } from "./services/guestIdentity";
import { getSocket } from "./services/socket";

export default function App() {
  const { user, setUser } = useAuthStore();

  // Phase 1: no auth-service yet, so assign a guest identity so the
  // matchmaking flow is fully testable. Replace with real login state
  // in Phase 2.
  useEffect(() => {
    if (!user) setUser(getOrCreateGuestIdentity());
  }, [user, setUser]);

  useEffect(() => {
    if (!user) return;
    getSocket().emit("identify", { userId: user.id });
  }, [user]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}
