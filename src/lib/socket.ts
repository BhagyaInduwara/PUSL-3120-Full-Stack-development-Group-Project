"use client";

import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Returns the app's one Socket.io connection, creating it on first call.
 * A module-level singleton (not per-component state) so every page/hook
 * that calls this shares the same underlying connection instead of each
 * opening its own — SocketProvider is the only thing that should call this
 * directly; everything else should go through useSocket()/useLiveEvent().
 *
 * `withCredentials: true` sends the flowerp_token cookie on the handshake
 * (see NEXT_PUBLIC_SOCKET_URL's comment in .env.example for why this has
 * to hit the backend's real origin instead of the same-origin proxy).
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
