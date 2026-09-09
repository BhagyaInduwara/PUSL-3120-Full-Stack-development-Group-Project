import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { app } from "../app.js";
import { initSocketServer } from "../realtime/socket.js";
import { authCookie } from "./helpers/auth.js";

let httpServer: HttpServer;
let baseUrl: string;

beforeAll(async () => {
  httpServer = createServer(app);
  initSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

/** Always disconnect the client at the end of each test, pass or fail, so one test's open socket can't bleed into the next. */
function connect(extraHeaders?: Record<string, string>): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { extraHeaders, reconnection: false, forceNew: true });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("Socket.io — authenticated handshake", () => {
  it("rejects a connection with no session cookie", async () => {
    await expect(connect()).rejects.toThrow("Not authenticated.");
  });

  it("rejects a connection with an invalid/garbage cookie", async () => {
    await expect(connect({ Cookie: "flowerp_token=not-a-real-jwt" })).rejects.toThrow("Not authenticated.");
  });

  it("accepts a connection with a valid session cookie", async () => {
    const socket = await connect({ Cookie: authCookie() });
    expect(socket.connected).toBe(true);
    socket.disconnect();
  });
});
