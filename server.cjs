var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_http = require("http");
var import_ws = require("ws");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const httpServer = (0, import_http.createServer)(app);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const wss = new import_ws.WebSocketServer({ server: httpServer });
  let waitingPlayer = null;
  wss.on("connection", (ws) => {
    let opponentSocket = null;
    let isP1 = false;
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "join_queue") {
          if (waitingPlayer && waitingPlayer.ws !== ws) {
            opponentSocket = waitingPlayer.ws;
            waitingPlayer.ws.opponentSocket = ws;
            isP1 = false;
            ws.send(JSON.stringify({
              type: "match_found",
              role: "p2",
              opponentName: waitingPlayer.name
            }));
            waitingPlayer.ws.send(JSON.stringify({
              type: "match_found",
              role: "p1",
              opponentName: data.name || "Player 2"
            }));
            waitingPlayer = null;
          } else {
            waitingPlayer = { ws, name: data.name || "Player 1", queueId: Date.now().toString() };
          }
        } else if (data.type === "action") {
          const targetWs = ws.opponentSocket || opponentSocket;
          if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
            targetWs.send(JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
    ws.on("close", () => {
      if (waitingPlayer && waitingPlayer.ws === ws) {
        waitingPlayer = null;
      }
      const targetWs = ws.opponentSocket || opponentSocket;
      if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
        targetWs.send(JSON.stringify({ type: "opponent_disconnected" }));
      }
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on address http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
