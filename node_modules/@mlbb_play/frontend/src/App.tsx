import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/common/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Matchmaking } from "./pages/Matchmaking";
import { Login } from "./pages/Login";

export default function App() {
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
