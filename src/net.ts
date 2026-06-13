// 온라인(권위서버) 클라이언트 — 서버 월드를 받고 액션을 보냄. (Milestone 3)
import { Cap } from "./state";

export type NetAction =
  | { kind: "speed"; n: 0 | 1 | 2 | 3 }
  | { kind: "invest"; cap: Cap }
  | { kind: "operate"; action: string }
  | { kind: "acquire"; rivalKey: string }
  | { kind: "raiseDebt" }
  | { kind: "lobby"; market: string }
  | { kind: "research"; key: string }
  | { kind: "enter"; market: string };

export interface NetHandlers {
  onWelcome(m: { youIdx: number; role: string; players: number; world: any }): void;
  onWorld(world: any): void;
  onRole?(m: { youIdx: number; role: string }): void;
  onClose?(): void;
  onError?(): void;
}
export interface NetClient { send(a: NetAction): void; close(): void; }

export function defaultUrl() { return "ws://" + (location.hostname || "localhost") + ":8787"; }

export function connect(url: string, h: NetHandlers): NetClient {
  const ws = new WebSocket(url);
  ws.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === "welcome") h.onWelcome(m);
    else if (m.type === "world") h.onWorld(m.world);
    else if (m.type === "role" && h.onRole) h.onRole(m);
  };
  ws.onclose = () => h.onClose && h.onClose();
  ws.onerror = () => h.onError && h.onError();
  return {
    send: (a) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "action", action: a })); },
    close: () => ws.close(),
  };
}
