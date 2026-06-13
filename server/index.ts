// 권위서버 — 실시간 멀티플레이 (M4: 다중 방 + 방 코드 + 정적 서빙으로 단일 배포).
// 한 프로세스가 빌드된 클라이언트(dist)를 서빙하고, /ws 로 WebSocket 게임을 호스팅한다.
//   개발: npm run server (포트 8787, 클라는 vite 5173)  |  배포: npm run build && npm start
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { GameState, newGame, CAPKO, Cap } from "../src/state";
import {
  tick, recomputeLeaders, strategyProjects, pushLog, canOperate, setCooldown,
  acquireTargets, doAcquire, raiseDebt, borrowRoom, lobbyCost, doLobby, canAct, setActCooldown,
  TECH_NODES, doResearch, entryCost, doEnter, campaignCost, doCampaign,
} from "../src/engine";

const PORT = Number(process.env.PORT || 8787);
const DIST = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist");
const STEP_MS = (sp: number) => sp === 1 ? 2600 : sp === 2 ? 1400 : sp === 3 ? 700 : 0;
const MIME: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

type Action =
  | { kind: "speed"; n: 0 | 1 | 2 | 3 } | { kind: "invest"; cap: Cap } | { kind: "operate"; action: string }
  | { kind: "acquire"; rivalKey: string } | { kind: "raiseDebt" } | { kind: "lobby"; market: string }
  | { kind: "research"; key: string } | { kind: "enter"; market: string } | { kind: "campaign"; market: string };

interface Player { key: string; name: string; }
interface Room { code: string; state: GameState; clients: Set<WebSocket>; players: Map<WebSocket, Player>; timer?: NodeJS.Timeout; }
const rooms = new Map<string, Room>();
const roomOf = new Map<WebSocket, Room>();

function makeCode() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 4; i++) c += a[Math.floor(Math.random() * a.length)]; return rooms.has(c) ? makeCode() : c; }
function newRoom(code?: string): Room {
  const state = newGame(); for (const f of state.firms) f.auto = true; recomputeLeaders(state);
  const room: Room = { code: code || makeCode(), state, clients: new Set(), players: new Map() };
  rooms.set(room.code, room); return room;
}
function world(state: GameState) { const { ui, fx, ...rest } = state; void fx; return { ...rest, over: ui.over }; }
function roster(room: Room) { return room.state.firms.map((f, i) => ({ idx: i, firm: f.name, key: f.key, human: !f.auto, name: [...room.players.values()].find(p => p.key === f.key)?.name || (f.auto ? "AI" : "") })); }
function send(ws: WebSocket, msg: unknown) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); }
function broadcast(room: Room, msg: unknown) { const s = JSON.stringify(msg); for (const ws of room.clients) if (ws.readyState === WebSocket.OPEN) ws.send(s); }
const fiOf = (room: Room, ws: WebSocket) => { const p = room.players.get(ws); return p ? room.state.firms.findIndex(f => f.key === p.key) : -1; };

function applyAction(state: GameState, fi: number, a: Action) {
  const f = state.firms[fi]; if (!f) return;
  switch (a.kind) {
    case "speed": state.speed = a.n; break;
    case "invest": { const p = strategyProjects(state, fi).find(x => x.cap === a.cap); if (p && f.cash >= p.capex && !f.venture) { f.cash -= p.capex; f.venture = { name: CAPKO[a.cap] + " 역량 프로그램", cap: a.cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} }; pushLog(state, f.name + " 투자 착수: " + p.h); } break; }
    case "operate": {
      const v = f.venture; if (!v || !canOperate(state, fi, a.action)) break;
      if (a.action === "accel") { if (f.cash >= 10) { f.cash -= 10; v.progress = Math.min(100, v.progress + 14); setCooldown(state, fi, "accel", 2); } }
      else if (a.action === "risk") { if (v.risk > 0) { v.risk--; setCooldown(state, fi, "risk", 2); } }
      else if (a.action === "pivot") { const ks: Cap[] = ["tech", "brand", "scale", "global"]; v.cap = ks[(ks.indexOf(v.cap) + 1) % 4]; v.name = CAPKO[v.cap] + " 역량 프로그램"; setCooldown(state, fi, "pivot", 3); }
      else if (a.action === "cancel") { f.cash += 15; f.venture = null; }
      break;
    }
    case "acquire": { const t = acquireTargets(state, fi).find(x => x.key === a.rivalKey); if (t && f.cash >= t.price) { f.cash -= t.price; doAcquire(state, fi, a.rivalKey); } break; }
    case "raiseDebt": { const amt = Math.min(40, Math.floor(borrowRoom(state, fi))); if (amt >= 5) raiseDebt(state, fi, amt); break; }
    case "lobby": { if (!canAct(state, fi, "lobby:" + a.market)) break; const c = lobbyCost(state, a.market); if (f.cash >= c) { f.cash -= c; doLobby(state, fi, a.market); setActCooldown(state, fi, "lobby:" + a.market, 5); recomputeLeaders(state); } break; }
    case "research": { const n = TECH_NODES.find(x => x.key === a.key); if (n && !f.tech.includes(a.key) && f.cash >= n.cost) { f.cash -= n.cost; doResearch(state, fi, a.key); } break; }
    case "enter": { const c = entryCost(state, a.market); if (f.cash >= c) { f.cash -= c; doEnter(state, fi, a.market); } break; }
    case "campaign": { const c = campaignCost(state, a.market); if (f.cash >= c) { f.cash -= c; doCampaign(state, fi, a.market); recomputeLeaders(state); } break; }
  }
}

function loop(room: Room) {
  if (room.timer) clearTimeout(room.timer);
  const ms = STEP_MS(room.state.speed);
  if (ms <= 0 || room.state.ui.over) return;
  room.timer = setTimeout(() => { tick(room.state); broadcast(room, { type: "world", world: world(room.state) }); loop(room); }, ms);
}
function claimFirm(room: Room, ws: WebSocket, name: string) {
  const taken = new Set([...room.players.values()].map(p => p.key));
  const free = room.state.firms.find(f => f.auto && !taken.has(f.key));
  if (free) { free.auto = false; room.players.set(ws, { key: free.key, name: name || free.name }); }
  return free ? room.state.firms.findIndex(f => f.key === free.key) : -1;
}

// ---- HTTP(정적) + WebSocket(/ws) ----
const http = createServer((req, res) => {
  let p = (req.url || "/").split("?")[0]; if (p === "/") p = "/index.html";
  const file = join(DIST, p);
  if (existsSync(file) && file.startsWith(DIST)) { res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" }); res.end(readFileSync(file)); }
  else if (existsSync(join(DIST, "index.html"))) { res.writeHead(200, { "Content-Type": "text/html" }); res.end(readFileSync(join(DIST, "index.html"))); }   // SPA fallback
  else { res.writeHead(200, { "Content-Type": "text/plain" }); res.end("Industry Hegemon server. Build the client (npm run build) to serve it here. WebSocket on /ws"); }
});
const wss = new WebSocketServer({ server: http, path: "/ws" });
wss.on("connection", (ws) => {
  ws.on("message", (buf) => {
    let msg: any; try { msg = JSON.parse(String(buf)); } catch { return; }
    if (msg.type === "create" || msg.type === "join") {
      let room = msg.type === "create" ? newRoom() : rooms.get(String(msg.room || "").toUpperCase());
      if (!room) { send(ws, { type: "error", msg: "방을 찾을 수 없습니다: " + msg.room }); return; }
      room.clients.add(ws); roomOf.set(ws, room);
      const youIdx = claimFirm(room, ws, String(msg.name || ""));
      send(ws, { type: "welcome", room: room.code, youIdx, role: youIdx >= 0 ? "player" : "spectator", world: world(room.state), roster: roster(room) });
      broadcast(room, { type: "roster", roster: roster(room) });
      broadcast(room, { type: "world", world: world(room.state) });
      return;
    }
    const room = roomOf.get(ws); if (!room) return;
    if (msg.type === "action" && msg.action && !room.state.ui.over) {
      const fi = msg.action.kind === "speed" ? 0 : fiOf(room, ws);
      if (msg.action.kind === "speed" || fi >= 0) { applyAction(room.state, fi, msg.action); broadcast(room, { type: "world", world: world(room.state) }); loop(room); }
    }
  });
  ws.on("close", () => {
    const room = roomOf.get(ws); roomOf.delete(ws); if (!room) return;
    room.clients.delete(ws);
    const p = room.players.get(ws); if (p) { room.players.delete(ws); const f = room.state.firms.find(x => x.key === p.key); if (f) f.auto = true; }
    if (room.clients.size === 0) { if (room.timer) clearTimeout(room.timer); rooms.delete(room.code); }   // 빈 방 정리
    else { broadcast(room, { type: "roster", roster: roster(room) }); broadcast(room, { type: "world", world: world(room.state) }); }
  });
});

http.listen(PORT, () => console.log("Industry Hegemon server on http://localhost:" + PORT + "  (WebSocket: /ws)" + (existsSync(DIST) ? "  [serving dist/]" : "  [dev: client on vite]")));
