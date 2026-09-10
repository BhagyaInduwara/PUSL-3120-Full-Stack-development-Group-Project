/**
 * FlowERP Socket.io Singleton & Safe Broadcast Utility
 *
 * Provides a centralized reference to the Socket.io Server instance and safe
 * helper functions to emit real-time events. If Socket.io is not initialized
 * (such as during isolated Jest unit/integration tests), `emitEvent` safely no-ops.
 */

export interface SocketEmitter {
  emit: (event: string, ...args: unknown[]) => unknown;
}

let ioInstance: SocketEmitter | null = null;

/**
 * Registers the active Socket.io server instance.
 */
export function setIO(io: SocketEmitter | null): void {
  ioInstance = io;
}

/**
 * Returns the active Socket.io server instance, or null if not yet initialized.
 */
export function getIO(): SocketEmitter | null {
  return ioInstance;
}

/**
 * Safely broadcasts an event and payload to all connected clients.
 * Swallows any unexpected emission error so it never crashes or blocks the primary HTTP flow.
 */
export function emitEvent(event: string, payload: unknown): void {
  try {
    if (ioInstance) {
      ioInstance.emit(event, payload);
    }
  } catch (err) {
    console.error(`[socket] Failed to emit "${event}":`, err);
  }
}
