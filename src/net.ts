// 온라인(권위서버) 클라이언트 — 방 생성/참가, 월드 수신, 액션 전송. (M3 + M4 방)
import { Cap } from "./state";

export type NetAction =
  | { kind: "speed"; n: 0 | 1 | 2 | 3 } | { kind: "invest"; cap: Cap } | { kind: "operate"; cap: Cap; action: string }
  | { kind: "acquire"; rivalKey: string } | { kind: "raiseDebt" } | { kind: "lobby"; market: string }
  | { kind: "research"; key: string } | { kind: "alloc"; market: string; delta: number }
  | { kind: "raiseEquity" } | { kind: "emergencyLoan" } | { kind: "austerity" } | { kind: "liquidate" } | { kind: "buildCapacity" } | { kind: "raiseFI"; amt: number } | { kind: "raiseSI"; amt: number };

export interface RosterEntry { idx: number; firm: string; key: string; human: boolean; name: string; }
export interface NetHandlers {
  onWelcome(m: { room: string; youIdx: number; role: string; world: any; roster: RosterEntry[] }): void;
  onWorld(world: any): void;
  onRoster?(roster: RosterEntry[]): void;
  onError?(msg: string): void;
  onClose?(): void;
}
export interface NetClient { send(a: NetAction): void; claim(firm: number): void; close(): void; }

// 개발(vite 5173)은 별도 게임서버 8787, 배포는 같은 오리진(/ws). VITE_WS_URL로 강제 가능.
export function defaultUrl() {
  const env = (import.meta as any).env?.VITE_WS_URL;
  if (env) return env;
  const l = location;
  if (l.port === "5173") return "ws://" + l.hostname + ":8787/ws";
  return (l.protocol === "https:" ? "wss:" : "ws:") + "//" + l.host + "/ws";
}

export function connect(url: string, join: { mode: "create" | "join"; room?: string; name?: string; scenario?: any; firm?: number }, h: NetHandlers): NetClient {
  const ws = new WebSocket(url);
  ws.onopen = () => ws.send(JSON.stringify(join.mode === "create" ? { type: "create", name: join.name, scenario: join.scenario, firm: join.firm } : { type: "join", room: join.room, name: join.name }));
  ws.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === "welcome") h.onWelcome(m);
    else if (m.type === "world") h.onWorld(m.world);
    else if (m.type === "roster" && h.onRoster) h.onRoster(m.roster);
    else if (m.type === "error" && h.onError) h.onError(m.msg);
  };
  ws.onclose = () => h.onClose && h.onClose();
  ws.onerror = () => h.onError && h.onError("서버에 연결할 수 없습니다");
  return {
    send: (a) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "action", action: a })); },
    claim: (firm) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "claim", firm, name: join.name })); },
    close: () => ws.close(),
  };
}
