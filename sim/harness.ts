// 헤드리스 밸런스 시뮬레이션 하네스 — 엔진을 직접 구동해 승률·궤적 등 지표를 산출한다.
// UI/네트워크 없이 src/engine의 순수 로직만 사용(서버와 동일 방식). 밸런스 변경 전후 A/B에 쓴다.
// 실행: npm run sim   (옵션은 sim/index.ts 참고)
import { newGame, GameState, IndustryScenario, Cap, CAPS } from "../src/state";
import * as E from "../src/engine";

// 플레이어 정책 — 매 틱 호출. fi는 (기업 제거로 바뀔 수 있어) 그 틱의 내 firm 인덱스.
export type Policy = (s: GameState, fi: number) => void;

export const policies: Record<string, Policy> = {
  // 무행동 — "가만히 둬도 이기나?"
  passive: () => { },
  // 적극(집중) — 약한 역량부터 개발·가속, 테크로 상한↑, 적합도 높은 시장에 집중·약한 시장 철수
  focused: (s, fi) => {
    const f = s.firms[fi]; if (!f) return;
    if (f.cash < 40 && E.canRaiseEquity(s, fi)) E.raiseEquity(s, fi);   // 성장 자금: 경영권 한도 내 증자
    const weak = [...CAPS].sort((a, b) => f.caps[a] - f.caps[b]).slice(0, 2);
    for (const cap of weak) {
      if (f.cash >= 48 && !f.ventures.some(v => v.cap === cap)) {
        const p = E.strategyProjects(s, fi).find(x => x.cap === cap);
        if (p && f.cash >= p.capex) { f.cash -= p.capex; f.ventures.push({ name: "개발", cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} }); }
      }
    }
    for (const v of f.ventures) if (f.cash >= 12 && E.canOperate(s, fi, v.cap, "accel")) { f.cash -= 10; v.progress = Math.min(100, v.progress + 14); E.setCooldown(s, fi, v.cap, "accel", 2); }
    for (const n of E.TECH_NODES) if (!f.tech.includes(n.key) && f.cash >= n.cost + 25) { f.cash -= n.cost; E.doResearch(s, fi, n.key); break; }
    const ranked = [...s.marketOrder].sort((a, b) => E.matchScore(f, s.markets[b]) - E.matchScore(f, s.markets[a]));
    ranked.forEach((nm, i) => {
      if (i < 8 && f.cash > 30 && (f.alloc[nm] || 0) < E.maxAllocFor(s, fi, nm)) E.setAlloc(s, fi, nm, 1);
      else if (i >= 10 && (f.alloc[nm] || 0) > 1) E.setAlloc(s, fi, nm, -1);
    });
    buildIfConstrained(s, fi, 1.0, false);   // 수요>생산능력이면 증설(현금 범위)
  },
  // 공격적(부채·증자 풀활용) — 차입으로 밑천을 끌어 역량·테크·할당을 최대치로 밀어붙이고, 적자는 증자/긴급대출로 버팀.
  aggressive: aggressivePolicy(99),       // 전 시장 광역 확장
  aggressiveCore: aggressivePolicy(6),    // 상위 6개 시장 집중
};

// topN = 적합도 상위 몇 개 시장까지 할당을 max로 밀지(광역 vs 집중 변형).
// ⚠️ 실게임(main.ts) UI 규칙을 충실히 준수: ①적자(cash<0)면 할당 못 올림(main.ts:290) →
// 비상수단(긴축·증자·긴급대출)으로 흑자 전환 우선. ②차입은 $40/클릭(main.ts:224). ③돈 없으면 못 씀.
function aggressivePolicy(topN: number): Policy {
  return (s, fi) => {
    const f = s.firms[fi]; if (!f) return;
    // [적자 모드] 회생 우선 — 긴축으로 유지비↓ + 증자·긴급대출로 적자 메움. 확장(할당↑) 금지.
    if (E.insolvent(s, fi)) {
      E.emergencyAusterity(s, fi);
      if (E.canRaiseEquity(s, fi)) E.raiseEquity(s, fi);
      E.emergencyLoan(s, fi);
      return;
    }
    // [흑자 모드] 차입은 $40 단위 버튼 반복(쿨다운 없음)으로 현금 버퍼 확보(차입여력 내).
    let guard = 0;
    while (f.cash < 80 && E.borrowRoom(s, fi) >= 5 && guard++ < 40) E.raiseDebt(s, fi, 40);
    if (f.cash < 50 && E.canRaiseEquity(s, fi)) E.raiseEquity(s, fi);   // 성장 자금: 차입여력 소진 시 경영권 한도 내 증자

    // 테크(비용 차감) — 선행조건·현금 충족분
    for (const n of E.TECH_NODES) if (!f.tech.includes(n.key) && n.req.every(r => f.tech.includes(r)) && f.cash >= n.cost) { f.cash -= n.cost; E.doResearch(s, fi, n.key); }
    // 벤처 3개 상시 — 약한 캡부터
    const weak = [...CAPS].sort((a, b) => f.caps[a] - f.caps[b]);
    for (const cap of weak) {
      if (f.ventures.length >= 3) break;
      if (!f.ventures.some(v => v.cap === cap)) {
        const p = E.strategyProjects(s, fi).find(x => x.cap === cap);
        if (p && f.cash >= p.capex) { f.cash -= p.capex; f.ventures.push({ name: "개발", cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} }); }
      }
    }
    // 벤처 가속
    for (const v of f.ventures) if (f.cash >= 12 && E.canOperate(s, fi, v.cap, "accel")) { f.cash -= 10; v.progress = Math.min(100, v.progress + 14); E.setCooldown(s, fi, v.cap, "accel", 2); }
    // 할당↑ — 흑자이고 현금 버퍼($30+) 있을 때만(유지비 충격 대비). 적자면 위에서 이미 return.
    if (f.cash > 30) {
      const ranked = [...s.marketOrder].sort((a, b) => E.matchScore(f, s.markets[b]) - E.matchScore(f, s.markets[a]));
      ranked.forEach((nm, i) => { if (i < topN && (f.alloc[nm] || 0) < E.maxAllocFor(s, fi, nm)) E.setAlloc(s, fi, nm, 1); });
    }
    buildIfConstrained(s, fi, 0.9, true);   // 수요>생산능력이면 차입으로 증설(공장 고정비가 무한확장 제동)
  };
}

// 수요(자연점령)가 생산능력을 넘으면 증설(공장 시스템). useBorrow면 차입여력으로 충당.
function buildIfConstrained(s: any, fi: number, frac: number, useBorrow: boolean) {
  const f = s.firms[fi]; if (!f) return;
  const nat = E.naturalCaptured(s, f.key);
  if (nat <= (f.capacityTarget || 0) * 1.03) return;
  const amt = (nat - (f.capacityTarget || 0)) * frac;
  const px = E.capacityCapex(s, amt); if (px <= 0) return;
  if (useBorrow && f.cash < px) { const room = E.borrowRoom(s, fi); if (room >= 5) E.raiseDebt(s, fi, Math.min(room, px - f.cash)); }
  if (f.cash >= px) { f.cash -= px; E.buildCapacity(s, fi, amt); }
}

export interface RunOpts {
  youIdx?: number;            // 사람이 조종하는 firm 인덱스(나머지는 AI)
  policy?: Policy;            // 그 firm의 플레이 정책(기본 passive)
  scenario?: IndustryScenario;
  maxMonths?: number;         // 안전 상한(기본 240)
  onTick?: (s: GameState, mo: number) => void;  // 궤적 수집용 훅
}
export interface GameResult {
  winnerKey: string;          // 승리한 firm 키("" = 미결)
  won: boolean;               // 내(youIdx) firm 승리 여부
  months: number;             // 종료까지 개월
  youShare: number;           // 내 최종 글로벌 점유율(0~1)
  bestRivalShare: number;     // 최강 경쟁사 최종 점유율
}

// 한 판 시뮬레이션. youIdx만 사람(정책 적용), 나머지는 AI.
export function runGame(opts: RunOpts = {}): GameResult {
  const youIdx = opts.youIdx ?? 0;
  const policy = opts.policy ?? policies.passive;
  const s = newGame(opts.scenario, youIdx);
  for (let i = 0; i < s.firms.length; i++) s.firms[i].auto = i !== youIdx;
  E.recomputeLeaders(s);
  s.speed = 3;
  const youKey = s.firms[youIdx].key;
  const D = E.DAYS_PER_MONTH;
  const max = (opts.maxMonths ?? 240) * D;   // 일 단위 진행 — 상한도 일로 환산
  let day = 0;
  while (!s.ui.over && day < max) {
    const fi = s.firms.findIndex(f => f.key === youKey);
    if (fi >= 0 && s.date % D === 0) policy(s, fi);   // 의사결정은 월 경계에만(플레이어 cadence)
    E.tick(s); day++;
    if (opts.onTick) opts.onTick(s, Math.floor(s.date / D));
  }
  const yi = s.firms.findIndex(f => f.key === youKey);
  const youShare = yi >= 0 ? E.myShare(s, yi) : 0;
  let bestRivalShare = 0;
  for (let i = 0; i < s.firms.length; i++) if (s.firms[i].key !== youKey) bestRivalShare = Math.max(bestRivalShare, E.myShare(s, i));
  return { winnerKey: s.ui.over?.winnerKey || (s.ui.over?.won ? youKey : ""), won: !!s.ui.over?.won, months: Math.round(s.date / D), youShare, bestRivalShare };
}

export function runMany(n: number, opts: RunOpts = {}): GameResult[] {
  const out: GameResult[] = [];
  for (let g = 0; g < n; g++) out.push(runGame(opts));
  return out;
}

// 무행동 리더가 다른 firm에게 점유율을 추월당하는 시점(개월) — youIdx를 무행동으로 두고 측정.
// 강자를 가만히 뒀을 때 얼마나 빨리 압박받는지(코스팅 응징) 지표. 끝까지 1위면 null.
export function crossoverMonth(youIdx: number, opts: RunOpts = {}): number | null {
  const s = newGame(opts.scenario, youIdx);
  for (let i = 0; i < s.firms.length; i++) s.firms[i].auto = i !== youIdx;
  E.recomputeLeaders(s); s.speed = 3;
  const youKey = s.firms[youIdx].key;
  const D = E.DAYS_PER_MONTH;
  const max = (opts.maxMonths ?? 240) * D;
  for (let day = 1; !s.ui.over && day <= max; day++) {
    E.tick(s);
    const yi = s.firms.findIndex(f => f.key === youKey);
    const mine = yi >= 0 ? E.myShare(s, yi) : 0;
    for (let i = 0; i < s.firms.length; i++) if (s.firms[i].key !== youKey && E.myShare(s, i) > mine) return Math.round(s.date / D);
  }
  return null;
}

export const median = (xs: number[]): number => { if (!xs.length) return NaN; const a = [...xs].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
export const pct = (x: number): string => (x * 100).toFixed(1) + "%";
export const firmNames = (sc?: IndustryScenario): string[] => newGame(sc).firms.map(f => f.name);
export type { Cap };
