export const clientEventNames = {
  roomCreate: "room:create",
  roomJoin: "room:join",
  sessionResume: "session:resume",
  roomLeave: "room:leave",
  playerKick: "player:kick",
  playerReady: "player:ready",
  gameSelect: "game:select",
  gameHostAction: "game:host-action",
  gameInput: "game:input",
  roundStart: "round:start"
} as const;

export const serverEventNames = {
  serverHello: "server:hello",
  roomState: "room:state",
  gameState: "game:state",
  scoreboardState: "scoreboard:state",
  roomError: "room:error",
  sessionResumed: "session:resumed",
  sessionTerminated: "session:terminated"
} as const;
