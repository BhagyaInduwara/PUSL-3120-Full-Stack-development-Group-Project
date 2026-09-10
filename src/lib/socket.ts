"use client";

import { io, type Socket } from "socket.io-client";

// An unset/empty NEXT_PUBLIC_SOCKET_URL means "same origin" (undefined,
// not a hardcoded guess) — required behind the nginx reverse proxy (see
// nginx/nginx.conf's /socket.io/ location block), where the backend isn't
// separately reachable and the browser must connect to whatever origin
// served the page, letting nginx route it to the server container. Local
// dev (no nginx in front) sets NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
// explicitly in .env.local, same as every other env var this app needs —
// see .env.example.
const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_URL = configuredUrl && configuredUrl.length > 0 ? configuredUrl : undefined;

let socket: Socket | null = null;

/**
 * Returns the app's one Socket.io connection, creating it on first call.
 * A module-level singleton (not per-component state) so every page/hook
 * that calls this shares the same underlying connection instead of each
 * opening its own — SocketProvider is the only thing that should call this
 * directly; everything else should go through useSocket()/useLiveEvent().
 *
 * `withCredentials: true` sends the flowerp_token cookie on the handshake.
 * Reconnection is Socket.io's own default behavior (automatic, exponential
 * backoff, no attempt limit) — nothing extra to configure for that.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}
