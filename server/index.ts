// 권위서버(authoritative) — 실시간 멀티플레이 (M1 골격 + M2 플레이어별 경제).
// 엔진을 서버에서 돌려 공유 월드를 소유. 각 접속자는 빈 firm 하나를 차지해 "자기 회사"를 운영한다.
// AI(auto=true) firm은 엔진이 자동 운영. 사람이 차지하면 auto=false.
//   실행: npm run server   (tsx server/index.ts)
import { WebSocketServer, WebSocket } from "ws";
import { GameState, newGame, CAPKO, Cap } from "../src/state";
import {
  tick, recomputeLeaders, strategyProjects, pushLog, canOperate, setCooldown,
  acquireTargets, doAcquire, raiseDebt, borrowRoom, lobbyCost, doLobby, canAct, setActCooldown,
  TECH_NODES, doResearch, entryCost, doEnter,
} from "../src/engine";

const PORT = Number(process.env.PORT || 8787);
const STEP_MS = (sp: number) => sp === 1 ? 1400 : sp === 2 ? 800 : sp === 3 ? 360 : 0;

type Action =
  | { kind: "speed"; n: 0 | 1 | 2 | 3 }
  | { kind: "invest"; cap: Cap }
  | { kind: "operate"; action: string }
  | { kind: "acquire"; rivalKey: string }
  | { kind: "raiseDebt" }
  | { kind: "lobby"; market: string }
  | { kind: "research"; key: string }
  | { kind: "enter"; market: string };

// 한 게임 방
const state: GameState = newGame();
for (const f of state.firms) f.auto = true;   // 사람이 차지하기 전엔 전부 AI
recomputeLeaders(state);
const players = new Map<WebSocket, string>();  // ws -> 차지한 firm key
const clients = new Set<WebSocket>();

function world() { const { ui, fx, ...rest } = state; void fx; return { ...rest, over: ui.over }; }
function send(ws: WebSocket, msg: unknown) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); }
function broadcast(msg: unknown) { const str = JSON.stringify(msg); for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(str); }
const fiOf = (ws: WebSocket) => { const k = players.get(ws); return k ? state.firms.findIndex(f => f.key === k) : -1; };

// 서버 권위 액션 — 행위자 firm fi에 적용
function applyAction(fi: number, a: Action) {
  const f = state.firms[fi]; if (!f) return;
  switch (a.kind) {
    case "speed": state.speed = a.n; break;
    case "invest": {
      const p = strategyProjects(state, fi).find(x => x.cap === a.cap);
      if (p && f.cash >= p.capex && !f.venture) { f.cash -= p.capex; f.venture = { name: CAPKO[a.cap] + " 역량 프로그램", cap: a.cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} }; pushLog(state, f.name + " 투자 착수: " + p.h); }
      break;
    }
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
  }
}

// 실시간 클럭
let timer: NodeJS.Timeout | undefined;
function loop() {
  if (timer) clearTimeout(timer);
  const ms = STEP_MS(state.speed);
  if (ms <= 0 || state.ui.over) return;
  timer = setTimeout(() => { tick(state); broadcast({ type: "world", world: world() }); loop(); }, ms);
}

const wss = new WebSocketServer({ port: PORT });
wss.on("connection", (ws) => {
  clients.add(ws);
  // 빈(AI) firm 하나를 차지 → 사람이 운영
  const free = state.firms.find(f => f.auto && !Array.from(players.values()).includes(f.key));
  if (free) { free.auto = false; players.set(ws, free.key); }
  const youIdx = free ? state.firms.findIndex(f => f.key === free.key) : -1;
  send(ws, { type: "welcome", youIdx, role: free ? "player" : "spectator", players: clients.size, world: world() });
  broadcast({ type: "world", world: world() });

  ws.on("message", (buf) => {
    let msg: { type?: string; action?: Action };
    try { msg = JSON.parse(String(buf)); } catch { return; }
    if (msg.type === "action" && msg.action && !state.ui.over) {
      const fi = msg.action.kind === "speed" ? 0 : fiOf(ws);   // 속도는 누구나(공유 클럭), 그 외엔 자기 firm
      if (msg.action.kind === "speed" || fi >= 0) { applyAction(fi, msg.action); broadcast({ type: "world", world: world() }); loop(); }
    }
  });
  ws.on("close", () => {
    clients.delete(ws);
    const key = players.get(ws);
    if (key) { players.delete(ws); const f = state.firms.find(x => x.key === key); if (f) f.auto = true; }  // AI가 인계
    broadcast({ type: "world", world: world() });
  });
});

console.log("Industry Hegemon authoritative server on ws://localhost:" + PORT);
loop();
