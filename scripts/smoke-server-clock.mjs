import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { ServerClock } from "../packages/game-core/dist/time/ServerClock.js";

const server = process.argv[2] ?? "http://127.0.0.1:3000";
const clients = [io(server, { transports: ["websocket"], timeout: 3000 }), io(server, { transports: ["websocket"], timeout: 3000 })];
const clocks = [new ServerClock(() => performance.now(), Date.now() + 23000), new ServerClock(() => performance.now(), Date.now() - 17000)];
try {
  await Promise.all(clients.map((socket) => new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  })));
  for (let sample = 0; sample < 3; sample++) {
    await Promise.all(clients.map((socket, index) => new Promise((resolve, reject) => {
      const sentAt = performance.now();
      socket.timeout(3000).emit("server:time", {}, (error, serverTime) => {
        if (error) return reject(error);
        try {
          assert.equal(typeof serverTime, "number", "server must acknowledge the clock request");
          clocks[index].synchronize(serverTime, sentAt);
          resolve();
        } catch (error) { reject(error); }
      });
    })));
  }
  const differenceMs = Math.abs(clocks[0].now() - clocks[1].now());
  assert.ok(differenceMs < 1000, `Host and phone differ by ${differenceMs} ms`);
  console.log(`PASS: live socket clock synchronization; 40-second initial skew reduced to ${differenceMs.toFixed(1)} ms`);
} finally {
  for (const socket of clients) socket.disconnect();
}
