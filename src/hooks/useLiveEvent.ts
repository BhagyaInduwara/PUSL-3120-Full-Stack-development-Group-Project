"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";

/**
 * Subscribes to a named Socket.io event on the app's shared connection for
 * as long as the calling component is mounted, and unsubscribes on
 * unmount. This is the one place pages should reach for real-time updates
 * — it's what lets a future event like "order:updated" reach the Sales
 * board without that page ever touching the Socket.io client directly.
 *
 * `handler` doesn't need to be memoized: the latest one is always called,
 * but the underlying socket.on/off subscription only changes if `socket`
 * or `event` change — so passing an inline arrow function every render is
 * fine and won't cause resubscribe churn.
 */
export function useLiveEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  // Keep the ref pointing at the latest handler without making the
  // subscription effect below depend on it (an inline handler is a new
  // function identity every render, which would otherwise resubscribe on
  // every render instead of only when socket/event change).
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    function listener(payload: T) {
      handlerRef.current(payload);
    }

    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
