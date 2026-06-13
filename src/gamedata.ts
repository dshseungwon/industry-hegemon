// 산업 실데이터 접근 — 내장 스냅샷(game.data.ts, 오프라인) 위에 런타임 갱신분을 덮어쓴다.
// 자매 레포(daily-industry-report)가 매일 발행하는 game_data.json을 부팅 시 받아와 최신화하되,
// 실패(오프라인 등)하면 내장 스냅샷을 그대로 쓴다 → 오프라인 우선 + 온라인 시 자동 최신.
import { GAME_DATA, GameData } from "./game.data";

const PUBLISHED_URL = "https://dshseungwon.github.io/daily-industry-report/game_data.json";

let runtime: Record<string, GameData> = {};

export function gameData(gics: string): GameData | undefined { return runtime[gics] || GAME_DATA[gics]; }
export function allGameData(): Record<string, GameData> { return { ...GAME_DATA, ...runtime }; }
export function setRuntimeData(d: Record<string, GameData> | null | undefined) { runtime = (d && typeof d === "object") ? d : {}; }

// 부팅 시 1회 호출. 발행본을 받아 덮어쓰고, 갱신되면 onUpdate()로 화면 갱신을 알린다.
export async function refreshGameData(onUpdate?: () => void): Promise<void> {
  try {
    const r = await fetch(PUBLISHED_URL, { cache: "no-cache" });
    if (!r.ok) return;
    const d = await r.json();
    if (d && typeof d === "object" && Object.keys(d).length) { setRuntimeData(d); onUpdate?.(); }
  } catch { /* 오프라인/CORS 실패 — 내장 스냅샷 유지 */ }
}
