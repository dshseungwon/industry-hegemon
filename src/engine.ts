import { GameState, Cap, CAPS, CAPKO, Firm, Market } from "./state";

export function gcap(c: number) { return Math.pow(Math.max(0, Math.min(100, c)) / 100, 0.7) * 100; }
export function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function ri(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)); }

// ---- balance constants (튜닝 손잡이) ----
export const SHARE_BETA = 6;   // 점유율 민감도: 적합도^β. 높을수록 승자독식, 낮을수록 균등.
export const END_MONTHS = 120; // 게임 horizon(10년). 이 시점에 점유율 1위면 승리.
const DOM_SHARE = 0.58;        // 완전 장악: 전 시장 1위 + 가중 점유율 이 값 이상(결정적 우위). 대부분 게임은 마감까지 감.
const MARGIN = 0.012;          // 점령 규모 1단위당 월 현금($B)
const OVERHEAD = 3;            // 월 고정비($B) 기본값(섹터 미상 시) — 점유율이 낮으면 적자
// 산업(섹터) 자본집약도별 base 고정비 — 자본집약 산업(소재·에너지·유틸)은 높고 자산경량(금융)은 낮다.
// 중심 3.0, IT=3.0으로 빌트인(소비자전자=IT) 회귀 0. capacity 비용은 allocUpkeep이 별도 담당.
const SECTOR_OVERHEAD: Record<string, number> = {
  "Information Technology": 3.0, "Communication Services": 3.5, "Consumer Discretionary": 3.0,
  "Consumer Staples": 2.5, "Health Care": 3.0, "Financials": 2.0, "Industrials": 3.5,
  "Materials": 4.5, "Energy": 4.5, "Utilities": 4.5, "Real Estate": 3.0,
};
export function sectorOverhead(s: GameState): number { return SECTOR_OVERHEAD[s.scenario.sector] ?? OVERHEAD; }
// AI 경쟁사 튜닝 손잡이(밸런스). 사람 플레이어 벤처 payoff=14, 가속·M&A·테크 사용 → 사람의 우위는 '잘 읽고 적극 운영'.
// 스윕 결과: passive 0% / casual 69% / optimal 89%, 게임 ~84-117개월(완전장악은 achievement).
export const BALANCE = {
  aiInvestChance: 0.20,   // AI가 idle일 때 매월 신규 R&D 착수 기본 확률(과거 0.12 — 너무 느려 코스팅 리더가 무압박이었음)
  aiPayoff: 9,            // AI 벤처 1회 역량 증가(사람 14보다 낮음)
  aiAccelChance: 0.16,    // AI가 진행 중 가속할 기본 확률(현금 여유 시)
  aiCampaignChance: 0.15, // AI가 매월 자원 할당 조정/신규 진출할 확률(경쟁사도 영향력을 키움)
  aiCatchup: 0.4,         // 1위와 점유율 격차×이 값을 R&D/가속 확률에 가산(뒤처질수록 적극 추격·약체 역전 경로)
  aiVentureCost: 25,      // AI R&D 착수 비용(사람 strategyProjects capex=45와 분리 — 약체도 개발 가능)
  upkeepRate: 0.002,      // 할당 월 유지비 계수(Σ (할당-1)×시장규모×rate)
};

export const ALLOC_MAX = 8;    // 시장당 자원 할당 절대 상한
const ALLOC_BASE = 2;          // 기본 할당 상한(테크로 지역별 확장)
// 시장 → 지역
const REGION: Record<string, string> = {
  "United States of America": "북미", "Canada": "북미", "Mexico": "북미",
  "China": "아시아", "India": "아시아", "Japan": "아시아", "South Korea": "아시아", "Indonesia": "아시아", "Vietnam": "아시아",
  "Germany": "유럽", "United Kingdom": "유럽", "France": "유럽", "Russia": "유럽", "Turkey": "유럽",
  "Brazil": "신흥", "Saudi Arabia": "신흥", "Nigeria": "신흥", "Australia": "신흥",
};
export function regionOf(name: string) { return REGION[name] || "신흥"; }
// 테크트리가 올려주는 할당 상한(지역별 또는 전 지역)
const ALLOC_TECH: Record<string, { region: string; amt: number }> = {
  rnd: { region: "all", amt: 1 }, ai: { region: "북미", amt: 1 }, globalscm: { region: "아시아", amt: 1 },
  automation: { region: "유럽", amt: 1 }, brandlab: { region: "신흥", amt: 1 }, smartfactory: { region: "북미", amt: 1 },
  ecosystem: { region: "all", amt: 2 },
};
// 한 시장의 할당 상한 = 기본 + 그 지역에 적용되는 테크 보너스 합
export function maxAllocFor(s: GameState, fi: number, name: string) {
  const region = regionOf(name); let b = ALLOC_BASE;
  for (const k of s.firms[fi].tech) { const a = ALLOC_TECH[k]; if (a && (a.region === "all" || a.region === region)) b += a.amt; }
  // 본진은 상한을 넘는 단계로 시작(특별 허용). 현재 할당을 바닥으로 깔아 상한을 정확히 표시(예: 6으로 시작 → 상한 6).
  return Math.max(Math.min(ALLOC_MAX, b), s.firms[fi].alloc[name] || 0);
}
const ALLOC_RAMP = 0.2;        // 매월 현재 영향력이 할당 목표로 다가가는 비율(전개 지연 ≈ 5개월)
const OPEN_THRESH = 0.08;      // 프론티어가 이 영향력을 넘으면 시장 개방(진출 완료)
function scoreWith(caps: Record<Cap, number>, m: Market) { let s = 0; for (const k of CAPS) s += (m.pref[k] || 0) * gcap(caps[k]); return s; }
export function matchScore(f: Firm, m: Market) { return scoreWith(f.caps, m); }
// 한 시장 가중치 = 적합도^β × 배치 영향력. 영향력 0 = 미진출. 영향력 = 할당 × R&D(역량) × KSF 적합도.
// (본진 이점 multiplier는 큰 자국시장 기업을 과하게 키워 밸런스를 깨서 제외 — 실 점유율은 인텔 패널로 노출.)
function weightOf(f: Firm, m: Market, caps: Record<Cap, number>) { return Math.pow(scoreWith(caps, m), SHARE_BETA) * (f.effort[m.name] || 0); }
export function allocUsed(f: Firm) { let t = 0; for (const k in f.alloc) t += f.alloc[k]; return t; }
// 한 시장 할당의 월 유지비(1단계=진출 유지는 무료, 그 이상 집중에 비용). BALANCE.upkeepRate로 튜닝.
export function allocUpkeepAt(s: GameState, name: string, level: number) { const m = s.markets[name]; return m ? Math.max(0, level - 1) * m.size * BALANCE.upkeepRate : 0; }
export function allocUpkeep(s: GameState, fi: number) { const f = s.firms[fi]; let t = 0; for (const n in f.alloc) t += allocUpkeepAt(s, n, f.alloc[n]); return t; }
// 자원 할당 조절: 시장 m에 delta(+/-). 단계 제한(0..MAX). 비용은 월 유지비로 부과. 0이면 철수.
export function setAlloc(s: GameState, fi: number, name: string, delta: number) {
  const f = s.firms[fi]; if (!s.markets[name]) return;
  const next = Math.max(0, Math.min(maxAllocFor(s, fi, name), (f.alloc[name] || 0) + delta));
  if (next === 0) delete f.alloc[name]; else f.alloc[name] = next;
}
export function leaderOf(s: GameState, m: Market): Firm { let best = s.firms[0], bv = -1; for (const f of s.firms) { const v = weightOf(f, m, f.caps); if (v > bv) { bv = v; best = f; } } return best; }
export function recomputeLeaders(s: GameState) { for (const n of s.marketOrder) s.markets[n].leader = leaderOf(s, s.markets[n]).key; }

// 한 시장 점유율 = 가중치 / Σ 가중치(적합도 + 공략 투입). capsOverride로 "이 투자를 하면?" 평가.
export function shareOf(s: GameState, m: Market, firmKey: string, capsOverride?: Record<Cap, number>) {
  let tot = 0, mine = 0;
  for (const f of s.firms) {
    const caps = capsOverride && f.key === firmKey ? capsOverride : f.caps;
    const v = weightOf(f, m, caps);
    tot += v; if (f.key === firmKey) mine = v;
  }
  return tot > 0 ? mine / tot : 0;
}
// 예측용: firm fi의 영향력을 effort로 바꿨을 때(타사 현 영향력 고정)의 점유율(steady-state). 할당 미리보기에 사용.
export function projectShare(s: GameState, m: Market, fi: number, effort: number) {
  let tot = 0, mine = 0;
  for (let i = 0; i < s.firms.length; i++) {
    const f = s.firms[i]; const e = i === fi ? effort : (f.effort[m.name] || 0);
    const v = Math.pow(scoreWith(f.caps, m), SHARE_BETA) * e;
    tot += v; if (i === fi) mine = v;
  }
  return tot > 0 ? mine / tot : 0;
}
// 영향력 램프 + 프론티어 개방 처리(매 tick, firm별). 영향력이 할당 목표로 다가감.
function rampEffort(s: GameState, fi: number) {
  const f = s.firms[fi];
  const keys = new Set([...Object.keys(f.alloc), ...Object.keys(f.effort)]);
  for (const n of keys) {
    const target = f.alloc[n] || 0;
    const cur = f.effort[n] || 0;
    const next = cur + (target - cur) * ALLOC_RAMP;
    if (next < 0.02 && target === 0) { delete f.effort[n]; continue; }
    f.effort[n] = next;
    if (next > OPEN_THRESH && !s.marketOrder.includes(n)) {   // 프론티어 개방(개척 완료)
      s.marketOrder.push(n);
      pushLog(s, "🚩 " + f.name + " " + s.markets[n].ko + " 진출 완료");
      if (f.key === s.firms[s.youIdx].key) s.fx.push("conquer");
    }
  }
}
// firm이 전 세계에서 점령한 규모(가중) 단위
export function capturedSize(s: GameState, firmKey: string, capsOverride?: Record<Cap, number>) {
  let sz = 0; for (const n of s.marketOrder) { const m = s.markets[n]; sz += m.size * shareOf(s, m, firmKey, capsOverride); } return sz;
}
export function myShare(s: GameState, fi: number = s.youIdx) { let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size; return tot > 0 ? capturedSize(s, s.firms[fi].key) / tot : 0; }
// ---- 월간 손익(회계 구조) ----
// 공헌이익(≈매출총이익): 점령규모 × 마진. 변동원가는 마진에 반영됨.
export function grossMargin(s: GameState, fi: number = s.youIdx) { const m = techMods(s, fi); return capturedSize(s, s.firms[fi].key) * (MARGIN + m.marginAdd); }
// 고정비(판관비 중 고정): 산업 자본집약도별 base − 테크 절감.
export function fixedCost(s: GameState, fi: number = s.youIdx) { return Math.max(0, sectorOverhead(s) - techMods(s, fi).overheadCut); }
// 월 영업현금(공헌이익 − 고정비). ⚠️ 할당 유지비는 별도 차감(operatingIncome 참고).
export function monthlyCashflow(s: GameState, fi: number = s.youIdx) { return grossMargin(s, fi) - fixedCost(s, fi); }
// 영업이익(EBITDA, 감가상각 없음): 공헌이익 − 고정비 − 할당 유지비(판관비). 차입여력·신용의 기준.
export function operatingIncome(s: GameState, fi: number = s.youIdx) { return monthlyCashflow(s, fi) - allocUpkeep(s, fi); }
// 월 이자비용(영업외/금융원가): 부채 × 월이자율.
export function monthlyInterest(s: GameState, fi: number = s.youIdx) { const f = s.firms[fi]; return f.debt > 0 ? f.debt * (debtRate(s, fi) / 12) : 0; }
// 시간 종료 판정: 점령 규모 기준 전 기업 순위(내림차순). [0]이 1위.
export function rankByCaptured(s: GameState) { return s.firms.map(f => ({ firm: f, size: capturedSize(s, f.key) })).sort((a, b) => b.size - a.size); }

// ---- finance ----
export function npv(r: number, cf: number[]) { let s = 0; for (let t = 0; t < cf.length; t++) s += cf[t] / Math.pow(1 + r, t); return s; }
export function irr(cf: number[]): number | null {
  let lo = -0.95, hi = 2, flo = npv(lo, cf); if (flo * npv(hi, cf) > 0) { hi = 8; if (flo * npv(hi, cf) > 0) return null; }
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, fm = npv(m, cf); if (Math.abs(fm) < 1e-6) return m; if (flo * fm < 0) hi = m; else { lo = m; flo = fm; } }
  return (lo + hi) / 2;
}
// ---- 재무: 차입여력은 벌이(EBITDA)에 비례. 순부채/EBITDA로 신용등급·이자율 결정 ----
const LEV_MAX = 4;        // 대출 한도 = 4 × 연 EBITDA (Net Debt/EBITDA ≤ 4)
export function annualEbitda(s: GameState, fi: number = s.youIdx) { return Math.max(0, operatingIncome(s, fi) * 12); }   // 회계대로: 할당 유지비까지 차감한 영업이익 기준
// 증자 신용 드래그: 유상증자 횟수×계수만큼 '유령 부채'로 신용에 부담(leverage·차입여력에 반영).
export function creditDrag(s: GameState, fi: number = s.youIdx) { return s.firms[fi].equityRaises * EQUITY_CREDIT_DRAG; }
export function leverage(s: GameState, fi: number = s.youIdx) { const e = annualEbitda(s, fi), d = s.firms[fi].debt + creditDrag(s, fi); return e > 0 ? d / e : (d > 0 ? 99 : 0); }
export function debtCapacity(s: GameState, fi: number = s.youIdx) { return LEV_MAX * annualEbitda(s, fi); }
export function borrowRoom(s: GameState, fi: number = s.youIdx) { return Math.max(0, debtCapacity(s, fi) - s.firms[fi].debt - creditDrag(s, fi)); }
export function creditRating(s: GameState, fi: number = s.youIdx) { const l = leverage(s, fi); return l <= 1 ? "AAA" : l <= 2 ? "AA" : l <= 3 ? "A" : l <= 4 ? "BBB" : l <= 5 ? "BB" : l <= 6 ? "B" : l <= 8 ? "CCC" : "D"; }
export function debtRate(s: GameState, fi: number = s.youIdx) { return 0.04 + Math.min(0.16, leverage(s, fi) * 0.025); }   // 레버리지↑ → 이자↑
export function waccOf(s: GameState, fi: number = s.youIdx) { return 0.08 + Math.min(0.08, leverage(s, fi) * 0.012); }
// 시가총액(지분가치) = EV − 순부채. EV = 연EBITDA × 배수(성장 산업일수록↑), 적자기업은 자산바닥(점령규모×0.2, M&A가격과 정합)으로 폴백.
const VAL_BASE_MULT = 8;
export function marketCap(s: GameState, fi: number = s.youIdx) {
  const f = s.firms[fi];
  const annualG = (s.scenario.growth || 0) * 12;                // 섹터 성장률(연환산) — 성장 프리미엄
  const mult = VAL_BASE_MULT * (1 + annualG * 4);
  const ev = Math.max(annualEbitda(s, fi) * mult, capturedSize(s, f.key) * 0.2);
  return Math.round(ev + f.cash - f.debt);                     // 지분가치 = EV − (부채−현금)
}

export interface Project { cap: Cap; h: string; e: string; capex: number; P: number; npv: number; irr: number | null; gain: number; dShare: number; }
export function strategyProjects(s: GameState, fi: number = s.youIdx): Project[] {
  const you = s.firms[fi]; const wacc = waccOf(s, fi); const list: Project[] = [];
  let totSize = 0; for (const n of s.marketOrder) totSize += s.markets[n].size;
  const base = capturedSize(s, you.key);
  for (const k of CAPS) {
    const gain = 14; const nc = { ...you.caps }; nc[k] = clamp(nc[k] + gain, 0, 100);
    // 플립이 아니라 연속 점유율 증가분 — gcap 체감수익이 그대로 반영돼 정직함.
    const dSize = Math.max(0, capturedSize(s, you.key, nc) - base);
    const dShare = totSize > 0 ? dSize / totSize : 0;           // 전 세계 점유율 증가 비율
    const annual = dSize * MARGIN * 12;                          // 연 증분 현금흐름
    const capex = 45; const cf = [-capex]; for (let t = 1; t <= 5; t++) cf.push(annual * Math.pow(1.03, t - 1));
    list.push({ cap: k, h: CAPKO[k] + " 역량 개발 프로그램", e: CAPKO[k] + "를 +" + gain + " — 그 역량을 원하는 시장에서 점유율 확대", capex, P: annual, gain, dShare, npv: npv(wacc, cf), irr: irr(cf) });
  }
  return list;
}

// ---- 전략: M&A(인수) / 재무(자금조달) ----
export interface MnaTarget { key: string; name: string; col: string; price: number; share: number; }
// 인수 후보: 경쟁사별 인수가(현재 점령 규모 가치 기준)와 점유율.
export function acquireTargets(s: GameState, fi: number = s.youIdx): MnaTarget[] {
  const you = s.firms[fi];
  let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size;
  return s.firms.filter(f => f.key !== you.key).map(f => ({
    key: f.key, name: f.name, col: f.col,
    price: Math.max(20, Math.round(capturedSize(s, f.key) * 0.2)),
    share: tot > 0 ? capturedSize(s, f.key) / tot : 0,
  }));
}
// 인수 실행: 경쟁자만 제거(점유율 분모 축소 → 그 시장 점유율이 남은 기업에 재분배).
// 역량은 흡수하지 않음 — 그래야 강자가 약체를 사서 약점 역량까지 메워 전 시장을 석권하는 조기 완전장악 허점이 사라짐.
export function doAcquire(s: GameState, fi: number, rivalKey: string) {
  const you = s.firms[fi];
  const idx = s.firms.findIndex(f => f.key === rivalKey);
  if (idx < 0 || s.firms[idx].key === you.key) return;
  const rival = s.firms[idx];
  s.firms.splice(idx, 1);                 // 경쟁자 제거 — 호출측이 각자 youIdx를 키로 재해결해야 함
  recomputeLeaders(s);
  pushLog(s, "🤝 " + rival.name + " 인수 완료 — 경쟁자 제거(점유율 흡수, 역량은 합쳐지지 않음)");
}
// 부채 조달: 차입여력(4×EBITDA) 내에서만. 즉시 현금, 부채 증가(이자·WACC 상승).
export function raiseDebt(s: GameState, fi: number, amount: number) { const f = s.firms[fi]; const a = Math.min(amount, borrowRoom(s, fi)); if (a <= 0) return; f.cash += a; f.debt += a; pushLog(s, "💵 " + f.name + " 부채 조달 +$" + Math.round(a) + "B"); }

// ===== 비상 경영(현금<0): 유동성 위기 회생 수단 =====
const BANKRUPT_MONTHS = 12;        // 현금 음수가 이만큼 지속되면 파산
const EQUITY_CD = 18;              // 유상증자 쿨다운(개월) — 남발 방지
const EQUITY_DECAY = 0.65;         // 증자 1회당 기준액 ×0.65 체감(투자자 경계)
const EQUITY_CREDIT_DRAG = 25;     // 증자 1회당 유령부채(신용 부담) — 등급↓·이자/WACC↑·차입여력↓
const AUSTERITY_KEEP = 4;          // 비상 긴축 시 유지할 강세 시장 수
const RESCUE_BUFFER = 12;          // 비상 회생(증자·긴급대출)은 '적자 메우기 + 이 소액 버퍼'까지만 — windfall 방지
export function insolvent(s: GameState, fi: number = s.youIdx) { return s.firms[fi].cash < 0; }
export function bankruptcyIn(s: GameState, fi: number = s.youIdx) { return Math.max(0, BANKRUPT_MONTHS - (s.firms[fi].distress || 0)); }
// 회생에 필요한 현금(적자 + 소액 버퍼). 증자·긴급대출은 이만큼만 — 일부러 적자 내 큰 현금 빼먹는 악용 차단.
export function rescueNeed(s: GameState, fi: number = s.youIdx) { return Math.max(0, Math.ceil(-s.firms[fi].cash) + RESCUE_BUFFER); }

// 유상증자: 규모비례 한도 안에서 '적자 메우기'까지만(windfall 없음). 부채 아님, 쿨다운+체감+신용드래그가 비용.
export function equityRaiseAmount(s: GameState, fi: number = s.youIdx) {
  const base = clamp(Math.round(capturedSize(s, s.firms[fi].key) * 0.3 * Math.pow(EQUITY_DECAY, s.firms[fi].equityRaises)), 15, 200);
  return Math.max(0, Math.min(base, rescueNeed(s, fi)));   // 적자+버퍼 한도로 캡
}
export function canRaiseEquity(s: GameState, fi: number = s.youIdx) { return canAct(s, fi, "equity"); }
export function equityCooldownLeft(s: GameState, fi: number = s.youIdx) { return Math.max(0, (s.firms[fi].cooldowns["equity"] || 0) - s.date); }
export function raiseEquity(s: GameState, fi: number = s.youIdx) {
  if (!canRaiseEquity(s, fi)) return;
  const f = s.firms[fi]; const amt = equityRaiseAmount(s, fi); if (amt <= 0) return;
  f.cash += amt; f.equityRaises++; setActCooldown(s, fi, "equity", EQUITY_CD);
  pushLog(s, "🏦 " + f.name + " 유상증자 +$" + amt + "B (지분 희석·신용 부담↑, " + f.equityRaises + "회차)");
}
// 긴급 대출: 차입여력 내에서 '적자 메우기'까지만 조달(부채·이자). 풀로 빼서 투자 밑천 삼는 악용 차단.
export function emergencyLoanAmount(s: GameState, fi: number = s.youIdx) { return Math.min(Math.floor(borrowRoom(s, fi)), rescueNeed(s, fi)); }
export function emergencyLoan(s: GameState, fi: number = s.youIdx) { const a = emergencyLoanAmount(s, fi); if (a > 0) raiseDebt(s, fi, a); }
// 비상 긴축: 적합도 상위 강세 시장만 남기고 나머지 할당을 1로 → 월 유지비 급감(점유율 일부 희생).
function nonCoreMarkets(s: GameState, fi: number) {
  const f = s.firms[fi];
  const ranked = Object.keys(f.alloc).filter(n => s.marketOrder.includes(n)).sort((a, b) => matchScore(f, s.markets[b]) - matchScore(f, s.markets[a]));
  const keep = new Set(ranked.slice(0, AUSTERITY_KEEP));
  return ranked.filter(n => !keep.has(n) && (f.alloc[n] || 0) > 1);
}
export function austeritySavings(s: GameState, fi: number = s.youIdx) {
  let save = 0; for (const n of nonCoreMarkets(s, fi)) save += allocUpkeepAt(s, n, s.firms[fi].alloc[n]) - allocUpkeepAt(s, n, 1);
  return save;
}
export function emergencyAusterity(s: GameState, fi: number = s.youIdx) {
  const cut = nonCoreMarkets(s, fi); if (!cut.length) return;
  for (const n of cut) s.firms[fi].alloc[n] = 1;
  recomputeLeaders(s);
  pushLog(s, "✂️ " + s.firms[fi].name + " 비상 긴축 — 비핵심 " + cut.length + "개 시장 철수로 유지비 절감");
}
// 개발 중단: 진행 벤처 전부 정리, 1개당 현금 회수($15, operate cancel과 동일).
export function liquidateValue(s: GameState, fi: number = s.youIdx) { return s.firms[fi].ventures.length * 15; }
export function liquidateVentures(s: GameState, fi: number = s.youIdx) {
  const f = s.firms[fi]; const n = f.ventures.length; if (!n) return;
  f.cash += n * 15; f.ventures = [];
  pushLog(s, "🛑 " + f.name + " 개발 중단 — 진행 벤처 정리로 현금 +$" + (n * 15) + "B");
}

function renorm(m: Market) { let t = 0; for (const p of CAPS) t += m.pref[p]; if (t > 0) for (const p of CAPS) m.pref[p] /= t; }

// ---- 프론티어(미진출 시장) ----
export function isOpen(s: GameState, name: string) { return s.marketOrder.includes(name); }
export function frontierMarkets(s: GameState): Market[] { return Object.values(s.markets).filter(m => !s.marketOrder.includes(m.name)); }
// 진입장벽 돌파 비용 — 신규 시장 개척에 드는 목돈(시장 규모 비례). 월 유지비와 별개의 일시금.
export function entryCost(s: GameState, name: string): number { const m = s.markets[name]; return m ? Math.max(25, Math.round(m.size * 0.6)) : 30; }
// 개척 = 진입장벽 돌파(목돈) + 프론티어에 자원 할당 시작. 영향력이 램프돼 도착하면 시장 개방·100% 진입(혼자이므로).
// 이미 진출(alloc>0)했거나 현금이 부족하면 false(호출부가 안내). 첫 진출에만 목돈 차감.
export function doEnter(s: GameState, fi: number, name: string): boolean {
  if (s.marketOrder.includes(name)) return false;
  const f = s.firms[fi];
  if ((f.alloc[name] || 0) > 0) return false;            // 이미 전개 중 — 중복 과금 방지
  const cost = entryCost(s, name);
  if (f.cash < cost) return false;
  f.cash -= cost;
  setAlloc(s, fi, name, 1);
  pushLog(s, "🚩 " + f.name + " " + s.markets[name].ko + " 진입장벽 돌파 -$" + cost + "B — 자원 전개 중");
  return true;
}

// ---- 로비: 선택 시장의 KSF를 우리 강점 쪽으로 유도(환경에 개입) ----
export function lobbyCost(s: GameState, marketName: string) { const m = s.markets[marketName]; return m ? Math.max(8, Math.round(m.size * 0.08)) : 0; }
export function doLobby(s: GameState, fi: number, marketName: string) {
  const you = s.firms[fi]; const m = s.markets[marketName]; if (!m) return;
  let best: Cap = "tech"; for (const k of CAPS) if (you.caps[k] > you.caps[best]) best = k;
  m.pref[best] = (m.pref[best] || 0) + 0.12; renorm(m);
  pushLog(s, "🏛️ " + you.name + " " + m.ko + " 로비 — KSF를 " + CAPKO[best] + " 쪽으로");
}
// 벤처 외 행동 쿨다운(firm별)
export function canAct(s: GameState, fi: number, key: string) { return (s.firms[fi].cooldowns[key] || 0) <= s.date; }
export function setActCooldown(s: GameState, fi: number, key: string, months: number) { s.firms[fi].cooldowns[key] = s.date + months; }

// ---- 테크트리: 연구 노드를 해금해 영구 역량 + 경제 효과를 얻는 내부개발 심화 ----
export interface TechNode { key: string; name: string; desc: string; cost: number; req: string[]; caps?: Partial<Record<Cap, number>>; }
// 테크트리 = 자원 할당 상한 업그레이드(지역별). 역량은 '내부 개발'로 올림.
export const TECH_NODES: TechNode[] = [
  { key: "rnd",          name: "R&D 센터",      desc: "전 지역 할당 상한 +1 · 개발 속도↑", cost: 30, req: [] },
  { key: "automation",   name: "생산 자동화",    desc: "유럽 할당 상한 +1 · 월 고정비 -1",   cost: 30, req: [] },
  { key: "ai",           name: "AI 플랫폼",      desc: "북미 할당 상한 +1 · 마진↑",          cost: 52, req: ["rnd"] },
  { key: "brandlab",     name: "브랜드 랩",      desc: "신흥시장 할당 상한 +1",              cost: 50, req: ["rnd"] },
  { key: "smartfactory", name: "스마트 팩토리",  desc: "북미 할당 상한 +1 · 고정비 -2",      cost: 52, req: ["automation"] },
  { key: "globalscm",    name: "글로벌 SCM",     desc: "아시아 할당 상한 +1 · 마진↑",        cost: 56, req: ["automation"] },
  { key: "ecosystem",    name: "플랫폼 생태계",  desc: "전 지역 할당 상한 +2 · 마진↑↑",      cost: 120, req: ["ai", "brandlab"] },
];
export function researchOptions(s: GameState, fi: number = s.youIdx) {
  const have = new Set(s.firms[fi].tech);
  return TECH_NODES.map(n => ({ node: n, unlocked: have.has(n.key), available: !have.has(n.key) && n.req.every(r => have.has(r)) }));
}
export function doResearch(s: GameState, fi: number, key: string) {
  const you = s.firms[fi];
  if (you.tech.includes(key)) return;
  const n = TECH_NODES.find(x => x.key === key); if (!n || !n.req.every(r => you.tech.includes(r))) return;
  you.tech.push(key); recomputeLeaders(s);   // 테크는 할당 상한↑(maxAllocFor) — 역량은 안 올림
  pushLog(s, "🔬 " + you.name + " " + n.name + " 완료 — 할당 상한 확장");
}
// 해금 노드들의 지속 효과(마진·고정비·벤처속도) 합산 — firm별
export function techMods(s: GameState, fi: number = s.youIdx) {
  const t = new Set(s.firms[fi].tech);
  let marginAdd = 0, overheadCut = 0, ventureAdd = 0;
  if (t.has("rnd")) ventureAdd += 1.5;
  if (t.has("automation")) overheadCut += 1;
  if (t.has("smartfactory")) overheadCut += 2;
  if (t.has("ai")) marginAdd += 0.002;
  if (t.has("globalscm")) marginAdd += 0.002;
  if (t.has("ecosystem")) marginAdd += 0.003;
  return { marginAdd, overheadCut, ventureAdd };
}

// ---- real-time tick (1 month) ----
const TRENDS: { bias: Cap; headline: string; note: string }[] = [
  { bias: "tech", headline: "AI·기술 경쟁 가열", note: "기술을 원하는 시장이 늘어납니다." },
  { bias: "brand", headline: "프리미엄 붐", note: "브랜드·경험 선호가 강해집니다." },
  { bias: "scale", headline: "글로벌 경기 둔화", note: "가성비 수요가 늘어납니다." },
  { bias: "global", headline: "신흥시장 개방", note: "글로벌 접근이 중요해집니다." },
];
// 산업 평균 KSF(전 시장 pref 평균) — 이 산업이 '본질적으로' 무엇을 원하는지. 트렌드 가중·문구에 사용.
function industryKSF(s: GameState): Record<Cap, number> {
  const sum = { tech: 0, brand: 0, scale: 0, global: 0 } as Record<Cap, number>;
  const ns = s.marketOrder; if (!ns.length) return sum;
  for (const n of ns) { const m = s.markets[n]; for (const k of CAPS) sum[k] += m.pref[k] || 0; }
  for (const k of CAPS) sum[k] /= ns.length; return sum;
}
// 산업 KSF로 기울어진 트렌드 추첨 — 그 산업이 중시하는 역량 쪽 트렌드가 더 자주 뜸(균등 랜덤 아님).
function pickTrend(s: GameState): typeof TRENDS[number] {
  const ksf = industryKSF(s);
  const w = TRENDS.map(t => Math.pow((ksf[t.bias] || 0.001) + 0.02, 1.6));   // +0.02: 비주력 KSF도 가끔은 등장
  let tot = 0; for (const x of w) tot += x; let r = Math.random() * tot;
  for (let i = 0; i < TRENDS.length; i++) { r -= w[i]; if (r <= 0) return TRENDS[i]; }
  return TRENDS[TRENDS.length - 1];
}
export function tick(s: GameState) {
  if (s.ui.over) return;
  s.fx = [];
  s.date++;
  // 시장 성장 — 산업(섹터)별 속도로 매월 시장 규모가 커짐. float로 누적(작은 시장도 매끄럽게 성장).
  const grow = s.scenario.growth || 0;
  if (grow) for (const n in s.markets) s.markets[n].size *= (1 + grow);
  // trend cycle — 산업 KSF로 기울어진 추첨 + 산업명 붙인 헤드라인
  if (s.date >= s.trend.until) {
    const t = pickTrend(s); const head = "「" + s.scenario.ko + "」 " + t.headline;
    s.trend = { bias: t.bias, until: s.date + ri(6, 11), headline: head, note: t.note }; pushLog(s, "📰 " + head);
    s.event = { title: head, note: t.note, id: s.event.id + 1, icon: "📰" }; s.fx.push("trend");
  }
  // 정책/규제 이벤트 — 한 시장의 환경(규모·KSF)을 바꿈(법률·정치 흐름). 진단해서 대응해야 함.
  if (s.date > 1 && Math.random() < 0.11) {
    const m = s.markets[s.marketOrder[ri(0, s.marketOrder.length - 1)]]; const ind = s.scenario.ko;
    if (Math.random() < 0.5) { m.size = Math.max(20, m.size * 0.88); m.pref.global += 0.15; renorm(m); pushLog(s, "⚖️ " + m.ko + " · " + ind + " 규제 강화"); s.event = { title: m.ko + " " + ind + " 규제 강화", note: "현지 시장 위축 · 현지대응/컴플라이언스가 중요해집니다.", id: s.event.id + 1, icon: "⚖️" }; }
    else { m.size = m.size * 1.12; const k: Cap = Math.random() < 0.5 ? "tech" : "scale"; m.pref[k] += 0.12; renorm(m); pushLog(s, "🟢 " + m.ko + " · " + ind + " 시장 개방/부양"); s.event = { title: m.ko + " " + ind + " 시장 개방·부양", note: "시장 규모 확대 · " + CAPKO[k] + " 수요가 늘어납니다.", id: s.event.id + 1, icon: "🟢" }; }
    s.fx.push("trend");
  }
  // consumers drift toward the current trend bias — 자주·작게 움직여 매끄럽고 읽히는 변화(트렌드가 주 신호)
  for (const n of s.marketOrder) {
    if (Math.random() < 0.18) {
      const m = s.markets[n]; const k: Cap = (s.trend.bias && Math.random() < 0.75) ? s.trend.bias : CAPS[ri(0, 3)];
      m.pref[k] = (m.pref[k] || 0) + 0.05; let tot = 0; for (const p of CAPS) tot += m.pref[p]; for (const p of CAPS) m.pref[p] /= tot;
    }
  }
  // 각 firm: AI 정책(auto) → 벤처 진행 → 재무(수입·이자) → 채무 카운터
  const youKey = s.firms[s.youIdx].key;
  for (let fi = 0; fi < s.firms.length; fi++) {
    const f = s.firms[fi];
    if (f.auto) aiPolicy(s, fi);
    rampEffort(s, fi);     // 영향력이 할당 목표로 다가감(전개 지연) + 프론티어 개방
    progressVenture(s, fi);
    f.cash += monthlyCashflow(s, fi);
    f.cash -= allocUpkeep(s, fi);                 // 자원 할당 월 유지비
    f.cash -= monthlyInterest(s, fi);             // 이자비용(영업외)
    if (f.cash < 0) { f.distress++; if (f.distress === 6 && f.key === youKey) pushLog(s, "⚠️ 채무 위험 — 현금 고갈. 할당 축소·점유율 회복 필요"); }
    else f.distress = 0;
  }
  recomputeLeaders(s);

  // 파산: 채무 불이행 12개월 지속 → 퇴출(AI) / 패배(플레이어)
  const playerBankrupt = (s.firms[s.youIdx]?.distress || 0) >= BANKRUPT_MONTHS;
  for (const f of [...s.firms]) {
    if (f.distress >= BANKRUPT_MONTHS && f.key !== youKey && s.firms.length > 1) {
      s.firms = s.firms.filter(x => x.key !== f.key);
      pushLog(s, "💸 " + f.name + " 파산 — 시장에서 퇴출");
    }
  }
  s.youIdx = Math.max(0, s.firms.findIndex(x => x.key === youKey));
  recomputeLeaders(s);
  if (playerBankrupt) { s.ui.over = { won: false, msg: "💸 파산 — 채무 불이행으로 경영권 상실" }; s.speed = 0; s.fx.push("lose"); return; }

  // 승리: 완전 장악(한 firm이 전 시장 1위) / 마감 시 1위
  const firstLeader = s.markets[s.marketOrder[0]].leader;
  const leadAll = s.marketOrder.every(n => s.markets[n].leader === firstLeader);
  const domIdx = leadAll ? s.firms.findIndex(x => x.key === firstLeader) : -1;
  if (leadAll && myShare(s, domIdx) >= DOM_SHARE) {   // 전 시장 1위 + 결정적 점유율
    const w = s.firms[domIdx];
    s.ui.over = { winnerKey: firstLeader, won: firstLeader === youKey, msg: w.name + " — 시장 완전 장악!" }; s.speed = 0; s.fx.push(firstLeader === youKey ? "win" : "lose");
  } else if (s.date >= END_MONTHS) {
    const top = rankByCaptured(s)[0].firm; const sh = (myShare(s, s.firms.findIndex(x => x.key === top.key)) * 100).toFixed(0);
    s.ui.over = { winnerKey: top.key, won: top.key === youKey, msg: "마감 — 최종 1위 " + top.name + " (" + sh + "%)" }; s.speed = 0; s.fx.push(top.key === youKey ? "win" : "lose");
  }
}
// 한 firm의 벤처들 진행 + 완성 처리(동시 여러 개)
function progressVenture(s: GameState, fi: number) {
  const f = s.firms[fi];
  for (let i = f.ventures.length - 1; i >= 0; i--) {
    const v = f.ventures[i];
    if (Math.random() < 0.09) v.risk++;
    const rate = 7 + techMods(s, fi).ventureAdd - v.risk * 1.3; v.progress = Math.min(100, v.progress + Math.max(2, rate));
    if (v.progress >= 100) {
      f.caps[v.cap] = clamp(f.caps[v.cap] + v.payoff, 0, 100); f.ventures.splice(i, 1);
      if (f.key === s.firms[s.youIdx].key) { pushLog(s, "🚀 " + CAPKO[v.cap] + " 개발 완성! 역량 강화"); s.fx.push("complete"); }
    }
  }
}
// AI 정책: 최선 역량에 투자(동시 여러 개) + 자원 할당.
function aiPolicy(s: GameState, fi: number) {
  const f = s.firms[fi];
  // 추격 보정: 현재 1위와 점유율 격차가 클수록 R&D·가속을 더 자주(코스팅 리더는 일찍 압박받음). 리더 본인은 gap 0.
  let lead = 0; for (let i = 0; i < s.firms.length; i++) { const sh = myShare(s, i); if (sh > lead) lead = sh; }
  const gap = Math.max(0, lead - myShare(s, fi));
  const invChance = BALANCE.aiInvestChance + gap * BALANCE.aiCatchup;
  const accelChance = BALANCE.aiAccelChance + gap * BALANCE.aiCatchup;
  const cost = BALANCE.aiVentureCost;
  // R&D 착수: 현금이 모자라도 차입여력으로 충당 → 약체도 개발(데스스파이럴 완화).
  if (f.ventures.length < 3 && Math.random() < invChance && f.cash + borrowRoom(s, fi) >= cost) {
    const best = bestRivalCap(s, f);
    if (best && !f.ventures.some(v => v.cap === best)) {
      if (f.cash < cost) raiseDebt(s, fi, cost - f.cash);   // 부족분만 차입
      f.cash -= cost; f.ventures.push({ name: CAPKO[best] + " 역량 개발", cap: best, payoff: BALANCE.aiPayoff, progress: 6, risk: 0, cooldown: {} });
    }
  } else if (f.ventures.length && f.cash >= 10 && Math.random() < accelChance) {
    const v = f.ventures[ri(0, f.ventures.length - 1)];
    if (canOperate(s, fi, v.cap, "accel")) { v.progress = Math.min(100, v.progress + 14); f.cash -= 10; setCooldown(s, fi, v.cap, "accel", 2); }
  }
  // 적자면 할당 축소(유지비 절감) — 가장 적합도 낮은 부스트부터 뺌
  if (f.cash < 0) {
    let worst = "", wf = 1e9;
    for (const n in f.alloc) { if (f.alloc[n] <= 1) continue; const fit = matchScore(f, s.markets[n]); if (fit < wf) { wf = fit; worst = n; } }
    if (worst) setAlloc(s, fi, worst, -1);
  } else if (f.cash > 30 && Math.random() < BALANCE.aiCampaignChance) {
    // 여유 현금이면 가장 적합한 시장에 자원 집중(유지비 감당 범위)
    let best = "", bf = -1;
    for (const n of s.marketOrder) { if ((f.alloc[n] || 0) >= maxAllocFor(s, fi, n)) continue; const fit = matchScore(f, s.markets[n]); if (fit > bf) { bf = fit; best = n; } }
    if (best) setAlloc(s, fi, best, 1);
  }
  // 개척: 가끔 프론티어 진출 — 경쟁사도 신규 국가를 뚫음(진입장벽 목돈 필요)
  if (f.cash > 40 && Math.random() < BALANCE.aiCampaignChance * 0.25) {
    const fr = frontierMarkets(s).filter(m => f.cash >= entryCost(s, m.name)); if (fr.length) doEnter(s, fi, fr[ri(0, fr.length - 1)].name);
  }
}
// 한 firm이 지금 점유율을 가장 키울 수 있는 역량(시장을 읽음).
function bestRivalCap(s: GameState, f: Firm): Cap | null {
  const base = capturedSize(s, f.key); let best: Cap | null = null, bd = 0;
  for (const k of CAPS) { const nc = { ...f.caps }; nc[k] = clamp(nc[k] + 14, 0, 100); const d = capturedSize(s, f.key, nc) - base; if (d > bd) { bd = d; best = k; } }
  return best;
}
export function pushLog(s: GameState, m: string) { s.log.unshift("[" + dateLabel(s.date) + "] " + m); if (s.log.length > 40) s.log.pop(); }
export function dateLabel(months: number) { const y = 2026 + Math.floor(months / 12); const mo = (months % 12) + 1; return y + "." + (mo < 10 ? "0" + mo : mo); }

// operate gating helpers (firm별 벤처 쿨다운)
export function ventureOf(f: Firm, cap: Cap) { return f.ventures.find(v => v.cap === cap); }
export function canOperate(s: GameState, fi: number, cap: Cap, action: string) { const v = ventureOf(s.firms[fi], cap); return !v || (v.cooldown[action] || 0) <= s.date; }
export function setCooldown(s: GameState, fi: number, cap: Cap, action: string, months: number) { const v = ventureOf(s.firms[fi], cap); if (v) v.cooldown[action] = s.date + months; }
