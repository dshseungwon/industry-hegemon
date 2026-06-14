// 첫 경영 가이드 — 진행에 따라 자동 체크되는 단계 체크리스트(코어 루프를 '하면서' 익힘).
// 완료한 단계는 '래칭'(한 번 되면 유지) — 국가 창을 닫거나 상태가 바뀌어도 체크 풀리지 않음.
// 상태는 클라이언트 로컬(싱글). 1회 노출(localStorage), 가이드 패널에서 다시 보기 가능.
import { GameState } from "./state";
import { allocUsed } from "./engine";

const LS = "ih_tutorial_done";
const LABELS = [
  "🗺️ 국가를 클릭해 시장·적합도 진단 보기",
  "🎯 자원 할당을 +1 올려 영향력 키우기",
  "🔬 연구개발에서 약한 역량에 투자(개발 착수)",
  "▶ 상단에서 시간을 진행하기",
];
let active = false;
let baseAlloc = 0;                 // 튜토리얼 시작 시 총 할당(이보다 늘면 '할당' 단계 완료)
let done = [false, false, false, false];

export function tutorialSeen(): boolean { try { return localStorage.getItem(LS) === "1"; } catch { return false; } }
export function tutorialActive(): boolean { return active; }
export function startTutorial(s: GameState) { active = true; baseAlloc = allocUsed(s.firms[s.youIdx]); done = [false, false, false, false]; }
export function endTutorial() { active = false; try { localStorage.setItem(LS, "1"); } catch { /* noop */ } }

// 현재 충족 조건(즉시 반영: ▶는 speed>0이면 바로, 달 변화 기다리지 않음)
function conds(s: GameState): boolean[] {
  const me = s.firms[s.youIdx];
  return [s.ui.country !== null, allocUsed(me) > baseAlloc, me.ventures.length > 0, s.speed > 0 || s.date > 0];
}

export interface TutStep { label: string; done: boolean; }
// 읽을 때마다 래칭(한 번 true면 계속 true). render가 매 행동마다 호출 → 행동 시 체크되고 안 풀림.
export function tutorialSteps(s: GameState): TutStep[] {
  if (active) { const c = conds(s); for (let i = 0; i < done.length; i++) done[i] = done[i] || c[i]; }
  return LABELS.map((label, i) => ({ label, done: done[i] }));
}
export function tutorialAllDone(s: GameState): boolean { return tutorialSteps(s).every(x => x.done); }
