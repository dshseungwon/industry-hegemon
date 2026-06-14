// 첫 경영 가이드 — 진행에 따라 자동 체크되는 단계 체크리스트(코어 루프를 '하면서' 익힘).
// 상태는 클라이언트 로컬(싱글). 1회 노출(localStorage), 가이드 패널에서 다시 보기 가능.
import { GameState } from "./state";
import { allocUsed } from "./engine";

const LS = "ih_tutorial_done";
let active = false;
let baseAlloc = 0;   // 튜토리얼 시작 시 총 할당(이보다 늘면 '할당' 단계 완료)

export function tutorialSeen(): boolean { try { return localStorage.getItem(LS) === "1"; } catch { return false; } }
export function tutorialActive(): boolean { return active; }
export function startTutorial(s: GameState) { active = true; baseAlloc = allocUsed(s.firms[s.youIdx]); }
export function endTutorial() { active = false; try { localStorage.setItem(LS, "1"); } catch { /* noop */ } }

export interface TutStep { label: string; done: boolean; }
export function tutorialSteps(s: GameState): TutStep[] {
  const me = s.firms[s.youIdx];
  return [
    { label: "🗺️ 지도에서 국가를 클릭해 시장 살펴보기", done: s.ui.country !== null },
    { label: "📊 적합도 진단에서 '왜 지는지' 확인하기", done: s.ui.country !== null },
    { label: "🎯 자원 할당을 +1 올려 영향력 키우기", done: allocUsed(me) > baseAlloc },
    { label: "🔬 연구개발에서 약한 역량에 투자(개발 착수)", done: me.ventures.length > 0 },
    { label: "▶ 상단에서 시간을 진행하기", done: s.date > 0 },
  ];
}
export function tutorialAllDone(s: GameState): boolean { return tutorialSteps(s).every(x => x.done); }
