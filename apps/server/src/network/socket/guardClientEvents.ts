import type {
  AckResult,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "@open-party-lab/protocol";
import { logger } from "../../core/logger/logger.js";

type RoomSocket = import("socket.io").Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type ClientEventName = keyof ClientToServerEvents;

/**
 * Registers a client event handler that cannot take the server down.
 *
 * Socket.IO dispatches events through a plain EventEmitter, so anything a
 * handler throws becomes an uncaught exception and ends the process — every
 * room on the server, not just the offending client's. The listener signature
 * is a contract with well-behaved clients, and nothing enforces it on the wire:
 * a client that emits `room:create` with no payload at all reaches
 * `payload.hostName` on `undefined`, and one that omits the acknowledgement
 * callback reaches `ack(...)` on `undefined`. Both were reproducible from a
 * three-line script.
 *
 * This normalises the arguments so a handler written against the declared
 * signature always sees what it expects, and contains whatever still goes wrong
 * to the one socket that caused it.
 */
export type GuardedOn = <TEvent extends ClientEventName>(
  event: TEvent,
  handler: ClientToServerEvents[TEvent]
) => void;

function isAckFunction(value: unknown): value is (result: AckResult<unknown>) => void {
  return typeof value === "function";
}

export function createGuardedOn(socket: RoomSocket): GuardedOn {
  return function on(event, handler) {
    const listener = (...args: unknown[]): void => {
      // A missing acknowledgement must not stop a handler mid-way: it has
      // already been let through the door, so let it finish and drop the reply.
      const ack = isAckFunction(args[args.length - 1])
        ? (args[args.length - 1] as (result: AckResult<unknown>) => void)
        : undefined;
      const payload = isAckFunction(args[0]) || args.length === 0 ? {} : args[0];
      const respond = ack ?? ((): void => {});

      try {
        (handler as unknown as (...handlerArgs: unknown[]) => void)(payload, respond);
      } catch (error) {
        logger.error("Client event failed.", {
          event,
          socketId: socket.id,
          roomCode: socket.data.roomCode ?? null,
          playerId: socket.data.playerId ?? null,
          reason: error instanceof Error ? error.message : String(error)
        });

        // The client is waiting on its acknowledgement; leaving it hanging
        // turns a server-side fault into a frozen phone.
        try {
          respond({ ok: false, error: "Die Anfrage konnte nicht verarbeitet werden." });
        } catch {
          // A broken callback is the client's problem, not the server's.
        }
      }
    };

    // The listener deliberately takes the wire's arguments rather than the
    // declared ones — that is the whole point — which Socket.IO's typed
    // overload cannot express.
    socket.on(event, listener as never);
  };
}
