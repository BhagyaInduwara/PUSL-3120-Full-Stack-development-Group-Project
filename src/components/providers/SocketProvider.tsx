"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

interface SocketContextValue {
  socket: Socket;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Mounted once in (app)/layout.tsx, wrapping every authenticated screen —
 * establishes the app's single Socket.io connection (via getSocket()) and
 * tracks its live connected/disconnected state so the UI can reflect it
 * (e.g. an offline-style indicator) without every page re-deriving it.
 * Reconnection itself is handled automatically by Socket.io; this just
 * mirrors "connect"/"disconnect" into React state as it happens.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState<Socket>(() => getSocket());
  const [connected, setConnected] = useState(() => socket.connected);

  useEffect(() => {
    function handleConnect() {
      setConnected(true);
    }
    function handleDisconnect() {
      setConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket() must be used within a SocketProvider");
  return ctx;
}
