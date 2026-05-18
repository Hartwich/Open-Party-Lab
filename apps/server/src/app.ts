import { loadEnv, type AppEnv } from "./core/config/env.js";
import { logger } from "./core/logger/logger.js";
import { now } from "./core/time/now.js";
import { GameRegistry } from "./game-engine/gameRegistry.js";
import { GameRuntime } from "./game-engine/gameRuntime.js";
import { GameTransitionService } from "./game-engine/gameTransitionService.js";
import { RoundManager } from "./game-engine/roundManager.js";
import { RoundTimerService } from "./game-engine/roundTimerService.js";
import { ScoreManager } from "./game-engine/scoreManager.js";
import { StateBroadcaster } from "./game-engine/stateBroadcaster.js";
import { createHttpServer } from "./network/http/createHttpServer.js";
import { buildJoinUrl } from "./network/qr/buildJoinUrl.js";
import { createIo } from "./network/socket/createIo.js";
import { registerSocketHandlers } from "./network/socket/registerSocketHandlers.js";
import { SocketSessionStore } from "./network/socket/socketSessionStore.js";
import { PlayerManager } from "./players/playerManager.js";
import { PlayerPresenceTracker } from "./players/playerPresenceTracker.js";
import { PlayerStore } from "./players/playerStore.js";
import { ReconnectService } from "./players/reconnectService.js";
import { RoomManager } from "./rooms/roomManager.js";
import { RoomStore } from "./rooms/roomStore.js";

export function createApp(environment: AppEnv = loadEnv()) {
  const httpServer = createHttpServer(environment);
  const io = createIo(httpServer, environment);

  const roomStore = new RoomStore();
  const playerStore = new PlayerStore();
  const sessionStore = new SocketSessionStore();
  const roomManager = new RoomManager(
    roomStore,
    (roomCode) => buildJoinUrl(environment.publicControllerOrigin, roomCode),
    now,
    environment.fixedPrimaryRoomCode
  );
  const primaryRoom = roomManager.ensurePrimaryRoom("Party Room");
  const reconnectService = new ReconnectService(sessionStore, now);
  const playerPresenceTracker = new PlayerPresenceTracker(
    environment.playerReconnectWindowMs,
    now
  );
  const playerManager = new PlayerManager(
    playerStore,
    playerPresenceTracker,
    reconnectService,
    now
  );
  const gameRegistry = new GameRegistry();
  const scoreManager = new ScoreManager(now);
  const roundManager = new RoundManager();
  const gameTransitionService = new GameTransitionService(roundManager, scoreManager);
  const gameRuntime = new GameRuntime(
    gameRegistry,
    roundManager,
    gameTransitionService,
    now
  );
  const stateBroadcaster = new StateBroadcaster(
    io,
    gameRegistry,
    gameRuntime,
    scoreManager
  );
  const roundTimerService = new RoundTimerService(
    roomStore,
    playerManager,
    gameRegistry,
    gameRuntime,
    stateBroadcaster,
    environment.roundTickMs
  );

  registerSocketHandlers({
    io,
    roomManager,
    playerManager,
    reconnectService,
    gameRegistry,
    gameRuntime,
    stateBroadcaster
  });

  return {
    env: environment,
    httpServer,
    io,
    async start(): Promise<void> {
      await new Promise<void>((resolve) => {
        httpServer.listen(environment.port, () => resolve());
      });

      roundTimerService.start();

      logger.info("Party platform server listening.", {
        port: environment.port,
        controllerOrigin: environment.publicControllerOrigin,
        roomCode: primaryRoom.code,
        reconnectWindowMs: environment.playerReconnectWindowMs,
        roundTickMs: environment.roundTickMs
      });
    }
  };
}
