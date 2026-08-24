import { io, Socket } from "socket.io-client";

// Dev: talk to matchmaking-service directly on its own port. In
// production this should go through api-gateway with WebSocket
// proxying enabled (http-proxy-middleware's `ws: true`) so the
// frontend only ever has one origin to know about — left as a
// Phase 2/deploy-time change.
const MATCHMAKING_WS_URL =
  import.meta.env.VITE_MATCHMAKING_WS_URL ?? "http://localhost:3002";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(MATCHMAKING_WS_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}
