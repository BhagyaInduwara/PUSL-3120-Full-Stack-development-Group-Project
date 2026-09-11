import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { parse as parseCookie } from "cookie";
import { verifyToken, SESSION_COOKIE_NAME, type JwtPayload } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { setIO } from "../utils/socket.js";

/**
 * Socket.io server infrastructure — attaches to the same HTTP server
 * Express listens on (see server.ts) rather than opening a second port, and
 * authenticates every connection during the handshake using the exact same
 * `flowerp_token` JWT the REST API already trusts (verifyToken(), from
 * utils/jwt.ts) — one source of truth for "is this request authenticated,"
 * not a second auth scheme to keep in sync.
 *
 * Cross-origin cookie caveat, worth knowing before wiring up the frontend
 * client (a separate task): Socket.io's handshake is a plain HTTP request,
 * so the browser only attaches the `flowerp_token` cookie if it's willing
 * to send it cross-origin. With `sameSite: "lax"` (the dev/Docker-Compose
 * setting — see auth.controller.ts's cookieOptions()), that works for
 * frontend/backend on different *ports* of the same host (e.g.
 * localhost:3000 -> localhost:4000, or two Compose services sharing a
 * site) because SameSite is scoped to the registrable domain, not the
 * port. It will NOT work out of the box if frontend and backend end up on
 * genuinely different domains in production (the same reason the REST API
 * needed the same-origin proxy in src/app/api/[...path]/route.ts) — that
 * would need either a real WebSocket proxy on the frontend side, or
 * switching this handshake to an explicit token (e.g. via the client's
 * `auth` option) instead of relying on the cookie.
 */

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  // Registers this server as utils/socket.ts's broadcast target, so every
  // controller's emitEvent("order:created", ...) call (imported from
  // utils/socket.js, not this file) actually reaches connected clients
  // instead of silently no-op'ing — see that module's own comment for why
  // it no-ops when nothing has called setIO() yet.
  setIO(io);

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const token = cookieHeader ? parseCookie(cookieHeader)[SESSION_COOKIE_NAME] : undefined;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      next(new Error("Not authenticated."));
      return;
    }

    socket.data.user = payload;
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as JwtPayload;
    console.log(`[socket] connected: ${user.username} (${socket.id})`);

    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected: ${user.username} (${socket.id}) — ${reason}`);
    });
  });

  return io;
}

/**
 * For code that genuinely requires a live socket server (none yet) —
 * throws if called before initSocketServer() has run. To broadcast an
 * event, use emitEvent() from utils/socket.js instead (see setIO() above)
 * — it's the one every controller already calls, and it no-ops safely
 * when nothing's initialized rather than throwing.
 */
export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io server not initialized — initSocketServer() must run before getSocketServer() is called.");
  }
  return io;
}
