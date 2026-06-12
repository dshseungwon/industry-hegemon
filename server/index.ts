// 권위서버(authoritative) — 멀티플레이 골격 (Milestone 1).
// 엔진(engine.ts)을 그대로 서버에서 돌려 공유 월드 상태를 소유하고, 실시간 tick을 진행한다.
// 클라이언트는 접속해 월드를 받고(렌더 전용) 액션을 보낸다. 서버가 검증·적용·브로드캐스트.
//   실행: npm run server   (tsx server/index.ts)
// M1 범위: 한 방, 첫 접속자가 컨트롤러(firm 0), 나머지는 관전. 경제는 아직 단일(플레이어별 분리는 M2).
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
recomputeLeaders(state);
const clients = new Set<WebSocket>();
let controller: WebSocket | null = null;

// 공유 월드 = 상태에서 클라이언트 로컬 UI(ui)·연출 큐(fx)를 제외한 부분
function world() { const { ui, fx, ...rest } = state; void ui; void fx; return rest; }
function send(ws: WebSocket, msg: unknown) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); }
function broadcast(msg: unknown) { const s = JSON.stringify(msg); for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(s); }

// 서버 권위 액션 적용(클라이언트의 confirm/연출 없이 순수 상태 변경)
function applyAction(a: Action) {
  switch (a.kind) {
    case "speed": state.speed = a.n; break;
    case "invest": {
      const p = strategyProjects(state).find(x => x.cap === a.cap);
      if (p && state.cash >= p.capex && !state.venture) {
        state.cash -= p.capex;
        state.venture = { name: CAPKO[a.cap] + " 역량 프로그램", cap: a.cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} };
        pushLog(state, "투자 착수: " + p.h);
      }
      break;
    }
    case "operate": {
      const v = state.venture; if (!v || !canOperate(state, a.action)) break;
      if (a.action === "accel") { if (state.cash >= 10) { state.cash -= 10; v.progress = Math.min(100, v.progress + 14); setCooldown(state, "accel", 2); } }
      else if (a.action === "risk") { if (v.risk > 0) { v.risk--; setCooldown(state, "risk", 2); } }
      else if (a.action === "pivot") { const ks: Cap[] = ["tech", "brand", "scale", "global"]; v.cap = ks[(ks.indexOf(v.cap) + 1) % 4]; v.name = CAPKO[v.cap] + " 역량 프로그램"; setCooldown(state, "pivot", 3); }
      else if (a.action === "cancel") { state.cash += 15; state.venture = null; }
      break;
    }
    case "acquire": { const t = acquireTargets(state).find(x => x.key === a.rivalKey); if (t && state.cash >= t.price) { state.cash -= t.price; doAcquire(state, a.rivalKey); } break; }
    case "raiseDebt": { const amt = Math.min(40, Math.floor(borrowRoom(state))); if (amt >= 5) raiseDebt(state, amt); break; }
    case "lobby": { if (!canAct(state, "lobby:" + a.market)) break; const c = lobbyCost(state, a.market); if (state.cash >= c) { state.cash -= c; doLobby(state, a.market); setActCooldown(state, "lobby:" + a.market, 5); recomputeLeaders(state); } break; }
    case "research": { const n = TECH_NODES.find(x => x.key === a.key); if (n && !state.tech.includes(a.key) && state.cash >= n.cost) { state.cash -= n.cost; doResearch(state, a.key); } break; }
    case "enter": { const c = entryCost(state, a.market); if (state.cash >= c) { state.cash -= c; doEnter(state, a.market); } break; }
  }
}

// 실시간 클럭 — 현재 speed를 읽어 재귀 스케줄
let timer: NodeJS.Timeout | undefined;
function loop() {
  if (timer) clearTimeout(timer);
  const ms = STEP_MS(state.speed);
  if (ms <= 0 || state.ui.over) return;        // 일시정지/종료면 멈춤(speed 변경 시 재가동)
  timer = setTimeout(() => { tick(state); broadcast({ type: "world", world: world() }); loop(); }, ms);
}

const wss = new WebSocketServer({ port: PORT });
wss.on("connection", (ws) => {
  clients.add(ws);
  if (!controller) controller = ws;
  const youIdx = ws === controller ? state.youIdx : -1;   // -1 = 관전
  send(ws, { type: "welcome", youIdx, role: youIdx >= 0 ? "controller" : "spectator", players: clients.size, world: world() });

  ws.on("message", (buf) => {
    let msg: { type?: string; action?: Action };
    try { msg = JSON.parse(String(buf)); } catch { return; }
    if (msg.type === "action" && ws === controller && msg.action && !state.ui.over) {
      applyAction(msg.action);
      broadcast({ type: "world", world: world() });
      loop();   // speed 변경 등 즉시 반영
    }
  });
  ws.on("close", () => {
    clients.delete(ws);
    if (ws === controller) { controller = clients.values().next().value || null; if (controller) send(controller, { type: "role", role: "controller", youIdx: state.youIdx }); }
  });
});

console.log("Industry Hegemon authoritative server on ws://localhost:" + PORT);
loop();
