import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "@open-party-lab/protocol";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { AppEnv } from "../../core/config/env.js";

export function createIo(server: HttpServer, env: AppEnv) {
  return new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    server,
    {
      cors: {
        origin: true,
        credentials: true
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: env.connectionRecoveryMs,
        skipMiddlewares: true
      }
    }
  );
}
