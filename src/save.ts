// 저장/불러오기 — 정적 호스팅(서버·DB 없음)이라 브라우저 localStorage에 단일 슬롯으로 저장.
// 기기·브라우저별 저장(동기화 X). 클라우드 세이브는 추후 Steam(Tauri) 연동.
import { GameState } from "./state";
import { VERSION } from "./version";
import { dateLabel } from "./engine";

const LS = "ih_save";
interface SaveBlob { v: string; label: string; savedReal: number; state: GameState; }

function read(): SaveBlob | null {
  try { const raw = localStorage.getItem(LS); if (!raw) return null; const b = JSON.parse(raw); return b && b.state ? b as SaveBlob : null; } catch { return null; }
}

export function saveGame(s: GameState): boolean {
  // ui.confirm은 함수(onOk)를 담아 직렬화 불가 → 제거. speed는 0으로(불러오면 일시정지).
  const state = { ...s, speed: 0 as const, ui: { ...s.ui, confirm: null } };
  const blob: SaveBlob = { v: VERSION, label: dateLabel(s.date), savedReal: Date.now(), state };
  try { localStorage.setItem(LS, JSON.stringify(blob)); return true; } catch { return false; }
}

// 불러오기: 버전이 다르면 거부(개발 중 깨진 세이브 방지). 성공 시 GameState 반환.
export function loadGameRaw(): GameState | null {
  const b = read(); if (!b) return null;
  if (b.v !== VERSION) return null;
  return b.state;
}

export function hasSave(): boolean { const b = read(); return !!b && b.v === VERSION; }
export function savedLabel(): string { const b = read(); return b ? b.label : ""; }
export function clearSave() { try { localStorage.removeItem(LS); } catch { /* noop */ } }
