import { act, render, screen } from "@testing-library/react";
import { SocketProvider, useSocket } from "@/components/providers/SocketProvider";
import { useLiveEvent } from "@/hooks/useLiveEvent";

/**
 * A minimal fake Socket.io client — just enough on()/off()/emit-style
 * pub/sub for SocketProvider/useLiveEvent to drive, plus a test-only
 * trigger() to simulate the server pushing an event. Named with the
 * "mock" prefix so Jest's module-factory hoisting allows referencing it
 * from jest.mock() below.
 */
class MockSocket {
  connected = false;
  private listeners: Record<string, Array<(payload: unknown) => void>> = {};

  on(event: string, cb: (payload: unknown) => void) {
    (this.listeners[event] ??= []).push(cb);
  }

  off(event: string, cb: (payload: unknown) => void) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== cb);
  }

  trigger(event: string, payload?: unknown) {
    for (const cb of this.listeners[event] ?? []) cb(payload);
  }

  listenerCount(event: string) {
    return (this.listeners[event] ?? []).length;
  }
}

const mockSocket = new MockSocket();

jest.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
}));

function StatusProbe() {
  const { connected } = useSocket();
  return <div data-testid="status">{connected ? "connected" : "disconnected"}</div>;
}

function EventProbe({ onPayload }: { onPayload: (payload: string) => void }) {
  useLiveEvent<string>("order:updated", onPayload);
  return null;
}

describe("SocketProvider / useSocket / useLiveEvent", () => {
  beforeEach(() => {
    mockSocket.connected = false;
  });

  it("throws when useSocket() is called outside a SocketProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<StatusProbe />)).toThrow("useSocket() must be used within a SocketProvider");
    spy.mockRestore();
  });

  it("reflects connect/disconnect events from the socket as connection state", () => {
    render(
      <SocketProvider>
        <StatusProbe />
      </SocketProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("disconnected");

    act(() => mockSocket.trigger("connect"));
    expect(screen.getByTestId("status")).toHaveTextContent("connected");

    act(() => mockSocket.trigger("disconnect"));
    expect(screen.getByTestId("status")).toHaveTextContent("disconnected");
  });

  it("calls the handler when the socket emits the subscribed event", () => {
    const onPayload = jest.fn();
    render(
      <SocketProvider>
        <EventProbe onPayload={onPayload} />
      </SocketProvider>,
    );

    mockSocket.trigger("order:updated", "ORD-1001");
    expect(onPayload).toHaveBeenCalledWith("ORD-1001");
  });

  it("unsubscribes the event listener on unmount", () => {
    const onPayload = jest.fn();
    const { unmount } = render(
      <SocketProvider>
        <EventProbe onPayload={onPayload} />
      </SocketProvider>,
    );

    expect(mockSocket.listenerCount("order:updated")).toBe(1);
    unmount();
    expect(mockSocket.listenerCount("order:updated")).toBe(0);

    mockSocket.trigger("order:updated", "ORD-1002");
    expect(onPayload).not.toHaveBeenCalled();
  });
});
