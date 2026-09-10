import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initSocketServer } from "./realtime/socket.js";

async function main() {
  await connectDB();

  // Express's own app.listen() creates this same http.Server internally —
  // creating it explicitly here just gives Socket.io something to attach
  // to on the same port, instead of needing a second one.
  const httpServer = createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
