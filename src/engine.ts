import { GameState, Cap, CAPS, CAPKO, Firm, Market, Candle, CB } from "./state";

export function gcap(c: number) { return Math.pow(Math.max(0, Math.min(100, c)) / 100, 0.7) * 100; }
export function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function ri(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)); }

// ---- balance constants (튜닝 손잡이) ----
export const SHARE_BETA = 6;   // 점유율 민감도: 적합도^β. 높을수록 승자독식, 낮을수록 균등.
export const END_MONTHS = 120; // (구) 개월 horizon — 종료엔 더 이상 안 씀(잔존 상수).
export const DAYS_PER_MONTH = 30;          // 경제 cadence: 30일 주기로 환경/AI/운영 정산(월간 튜닝값 보존). 표시 날짜는 실제 달력(dateLabel).
const START_MS = Date.UTC(2026, 0, 1);     // 게임 시작일 2026-01-01 (s.date=0일)
export const END_DAYS = Math.round((Date.UTC(2040, 2, 31) - START_MS) / 86400000);   // 종료 2040-03-31 (실제 경과일 ≈ 5203)
const DOM_SHARE = 0.58;        // 완전 장악: 전 시장 1위 + 가중 점유율 이 값 이상(결정적 우위). 대부분 게임은 마감까지 감.
const MARGIN = 0.012;          // 점령 규모 1단위당 월 현금($B)
// 산업(섹터) 자본집약도 — 생산능력(공장) 1단위당 고정비·증설비 배수. 자본집약(반도체·유틸·에너지·소재) 高 / 자산경량(금융·SW·서비스) 低.
const CAP_INTENSITY: Record<string, number> = {
  "Information Technology": 0.8, "Communication Services": 1.2, "Consumer Discretionary": 0.9,
  "Consumer Staples": 0.7, "Health Care": 0.9, "Financials": 0.5, "Industrials": 1.1,
  "Materials": 1.4, "Energy": 1.5, "Utilities": 1.6, "Real Estate": 1.0,
};
export function capIntensity(s: GameState): number { return CAP_INTENSITY[s.scenario.sector] ?? 1.0; }
const FIX_BASE = 0.3;          // 소액 고정 base($B/월)
const FIX_RATE = 0.005;        // 생산능력 1단위당 월 고정비(감가상각·유지). < MARGIN이라 규모비례 흑자.
const CAPEX_RATE = 0.6;        // 생산능력 1단위 증설 CAPEX($B) = amount × capIntensity × CAPEX_RATE.
const CAP_RAMP = 0.25;         // 매월 capacity가 target으로 다가가는 비율(증설 지연).
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
export function leaderOf(s: GameState, m: Market): Firm { let best = s.firms[0], bv = -1; for (const f of s.firms) { const v = weightOf(f, m, f.caps) * utilizationOf(s, f.key); if (v > bv) { bv = v; best = f; } } return best; }
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
export function firmByKey(s: GameState, key: string): Firm | undefined { return s.firms.find(f => f.key === key); }
// 자연 점령규모(경쟁력=fit×effort 기반, 생산능력 게이트 전).
export function naturalCaptured(s: GameState, firmKey: string, capsOverride?: Record<Cap, number>) {
  let sz = 0; for (const n of s.marketOrder) { const m = s.markets[n]; sz += m.size * shareOf(s, m, firmKey, capsOverride); } return sz;
}
// 가동률 = min(1, 생산능력 ÷ 자연수요). 생산능력 0이면 0(생산 못 함 → 점유 못 함).
export function utilizationOf(s: GameState, firmKey: string): number {
  const f = firmByKey(s, firmKey); if (!f) return 1;
  const nat = naturalCaptured(s, firmKey);
  if (nat <= 0) return f.capacity > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, f.capacity) / nat);
}
// firm이 실제로 점령(생산·공급)한 규모 = min(자연수요, 생산능력). 재무·점유율 모두 이 값 사용.
export function capturedSize(s: GameState, firmKey: string, capsOverride?: Record<Cap, number>) {
  const f = firmByKey(s, firmKey); const nat = naturalCaptured(s, firmKey, capsOverride);
  return f ? Math.min(nat, Math.max(0, f.capacity)) : nat;
}
// 실현 시장 점유율(생산능력 게이트 적용) — 리더 판정·UI에 사용.
export function realizedShareOf(s: GameState, m: Market, firmKey: string) { return shareOf(s, m, firmKey) * utilizationOf(s, firmKey); }
export function myShare(s: GameState, fi: number = s.youIdx) { let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size; return tot > 0 ? capturedSize(s, s.firms[fi].key) / tot : 0; }
// ---- 월간 손익(회계 구조) ----
// 공헌이익(≈매출총이익): 점령규모 × 마진. 변동원가는 마진에 반영됨.
export function grossMargin(s: GameState, fi: number = s.youIdx) { const m = techMods(s, fi); return capturedSize(s, s.firms[fi].key) * (MARGIN + m.marginAdd); }
// 고정비(생산능력 유지비): base + 생산능력 × 자본집약도 × 비율 − 테크 절감. 작은 회사=작은 고정비(규모비례).
export function fixedCost(s: GameState, fi: number = s.youIdx) {
  const f = s.firms[fi]; return Math.max(0, FIX_BASE + Math.max(0, f.capacity) * capIntensity(s) * FIX_RATE - techMods(s, fi).overheadCut);
}
// 증설 비용(CAPEX, 선지급) — 산업 자본집약도에 비례.
export function capacityCapex(s: GameState, amount: number): number { return Math.round(amount * capIntensity(s) * CAPEX_RATE); }
// 공장 증설: CAPEX 선지급 → capacityTarget↑(이후 tick에서 램프). cash 체크는 호출부.
export function buildCapacity(s: GameState, fi: number, amount: number) {
  const f = s.firms[fi]; if (amount <= 0) return; f.capacityTarget = Math.max(0, (f.capacityTarget || 0) + amount);
  pushLog(s, "🏭 " + f.name + " 생산능력 증설 +" + Math.round(amount) + " (가동까지 수개월)");
}
// 월 영업현금(공헌이익 − 고정비). ⚠️ 할당 유지비는 별도 차감(operatingIncome 참고).
export function monthlyCashflow(s: GameState, fi: number = s.youIdx) { return grossMargin(s, fi) - fixedCost(s, fi); }
// 영업이익(EBITDA, 감가상각 없음): 공헌이익 − 고정비 − 할당 유지비(판관비). 차입여력·신용의 기준.
export function operatingIncome(s: GameState, fi: number = s.youIdx) { return monthlyCashflow(s, fi) - allocUpkeep(s, fi); }
// 월 이자비용(영업외/금융원가): 부채 × 월이자율.
export function monthlyInterest(s: GameState, fi: number = s.youIdx) { const f = s.firms[fi]; return f.debt > 0 ? f.debt * (debtRate(s, fi) / 12) : 0; }
// 보유 지분 배당 수익(상호출자): 내가 보유한 다른 회사 블록에서 들어오는 월 현금흐름.
export function dividendIncome(s: GameState, fi: number = s.youIdx): number {
  const my = s.firms[fi].key; let inc = 0;
  for (let i = 0; i < s.firms.length; i++) {
    const f = s.firms[i]; if (i === fi) continue;
    const div = (f.divRate || 0) * Math.max(0, operatingIncome(s, i) - monthlyInterest(s, i)); if (div <= 0) continue;
    for (const b of f.blocs) if (b.owner === my) inc += div * b.stake;
  }
  return inc;
}
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
// 전환사채(CB): 저금리 부채 + 전환가. 원금은 일반 부채와 같은 차입한도를 공유.
const CB_RATE = 0.02;          // CB 연 금리(일반 대출 4~20%보다 저율 — 전환권이 sweetener)
const CB_PREMIUM = 1.3;        // 전환가 = 발행시 주가 × 1.3
const CB_CD = 3;               // 발행 쿨다운(개월)
export function cbPrincipal(s: GameState, fi: number = s.youIdx) { return (s.firms[fi].cbs || []).reduce((a, c) => a + c.principal, 0); }
export function cbInterestMonthly(s: GameState, fi: number = s.youIdx) { return cbPrincipal(s, fi) * CB_RATE / 12; }
export function leverage(s: GameState, fi: number = s.youIdx) { const e = annualEbitda(s, fi), d = s.firms[fi].debt + cbPrincipal(s, fi) + creditDrag(s, fi); return e > 0 ? d / e : (d > 0 ? 99 : 0); }
export function debtCapacity(s: GameState, fi: number = s.youIdx) { return LEV_MAX * annualEbitda(s, fi); }
export function borrowRoom(s: GameState, fi: number = s.youIdx) { return Math.max(0, debtCapacity(s, fi) - s.firms[fi].debt - cbPrincipal(s, fi) - creditDrag(s, fi)); }
export function creditRating(s: GameState, fi: number = s.youIdx) { const l = leverage(s, fi); return l <= 1 ? "AAA" : l <= 2 ? "AA" : l <= 3 ? "A" : l <= 4 ? "BBB" : l <= 5 ? "BB" : l <= 6 ? "B" : l <= 8 ? "CCC" : "D"; }
export function debtRate(s: GameState, fi: number = s.youIdx) { return 0.04 + Math.min(0.16, leverage(s, fi) * 0.025); }   // 레버리지↑ → 이자↑
export function waccOf(s: GameState, fi: number = s.youIdx) { return 0.08 + Math.min(0.08, leverage(s, fi) * 0.012); }
// 펀더멘털(내재가치) = EV − 순부채. EV = 연EBITDA × 배수(성장 산업일수록↑), 적자기업은 자산바닥(점령규모×0.2, M&A가격과 정합)으로 폴백.
const VAL_BASE_MULT = 8;
export function intrinsicValue(s: GameState, fi: number = s.youIdx) {
  const f = s.firms[fi];
  const annualG = (s.scenario.growth || 0) * 12;                // 섹터 성장률(연환산) — 성장 프리미엄
  const mult = VAL_BASE_MULT * (1 + annualG * 4);
  const ev = Math.max(annualEbitda(s, fi) * mult, capturedSize(s, f.key) * 0.2);
  return Math.round(ev + f.cash - f.debt - cbPrincipal(s, fi));   // 지분가치 = EV + 현금 − 부채 − 전환사채
}
// 주식시장: 주가가 1차 상태변수, 시총 = 주가 × 발행주식수(shares 단위=10억 주). 첫 사용 시 lazy-init(price=100 기준).
function ensureShares(s: GameState, fi: number) {
  const f = s.firms[fi];
  if (!f.shares || f.shares <= 0) {
    const iv = Math.max(1, intrinsicValue(s, fi));
    const p0 = Math.round(30 + Math.random() * Math.random() * 570);   // 기업별 초기 주가 차등(~$30~600, 저가 치우침)
    f.price = p0; f.shares = Math.max(0.001, iv / p0);    // 시총($B)=주가×shares (=내재가치, 경제 영향 0). 주당 가격만 차등.
    // 시작 전(시간 미진행)에도 차트가 보이도록 과거 ~40일 일봉을 가볍게 시드(마지막 종가=현재가 p0).
    const cs: Candle[] = []; let prev = p0;
    for (let d = 0; d < 40; d++) {
      const c = d === 39 ? p0 : Math.max(1, prev * (1 + (Math.random() - 0.5) * 0.02));
      const h = Math.max(prev, c) * (1 + Math.random() * 0.006), l = Math.min(prev, c) * (1 - Math.random() * 0.006);
      cs.push({ o: r2(prev), h: r2(h), l: r2(l), c: r2(c) }); prev = c;
    }
    f.candles = cs; f.priceHist = cs.map(c => Math.round(c.c * 10) / 10);
  }
}
// 시가총액(지분가치) = 주가 × 발행주식수. 모든 거래가격(증자 조달액·지분매입·M&A)이 주가에 반응.
export function marketCap(s: GameState, fi: number = s.youIdx) {
  ensureShares(s, fi); const f = s.firms[fi];
  return Math.max(1, Math.round(f.price * f.shares));
}
// ---- 주식시장: 평상시(약한 평균회귀 + 소음) + 이벤트 충격(급등/급락). 핵심: 호재 급등 타이밍에 고가 증자 ----
const PRICE_MEAN_REV = 0.05;            // 매일 펀더멘털(내재가)로 되돌리는 강도(일 단위)
const PRICE_VOL = 0.012;                // 일중 소음 폭
const PRICE_WICK = 0.006;               // 일봉 꼬리(고가/저가) 폭
const PRICE_SHOCK = 0.8;                // 이벤트 충격 계수(정합도 ±1일 때 ±80% 급등/급락)
const PRICE_LO = 0.3, PRICE_HI = 5;     // 내재가 대비 주가 허용 밴드(급등 허용 + 0/무한 방지)
function intrinsicPrice(s: GameState, fi: number) { return Math.max(0.01, intrinsicValue(s, fi) / Math.max(1, s.firms[fi].shares)); }
function bandClamp(s: GameState, fi: number, price: number) { const ip = intrinsicPrice(s, fi); return clamp(price, ip * PRICE_LO, ip * PRICE_HI); }
const CANDLE_CAP = 120;         // 보관 일봉 수(~4개월)
const r2 = (x: number) => Math.round(x * 100) / 100;
// 매일 주가 갱신: 약한 평균회귀 + 일중 소음으로 하루치 일봉(OHLC) 1개 생성. 이벤트 충격은 그날 큰 캔들로 나타남.
export function updatePrices(s: GameState) {
  for (let fi = 0; fi < s.firms.length; fi++) {
    ensureShares(s, fi); const f = s.firms[fi];
    const open = f.candles.length ? f.candles[f.candles.length - 1].c : f.price;   // 전일 종가 = 당일 시가
    const rev = PRICE_MEAN_REV * Math.log(intrinsicPrice(s, fi) / f.price);
    const noise = (Math.random() - 0.5) * PRICE_VOL;
    f.price = bandClamp(s, fi, f.price * (1 + rev + noise));                       // 당일 종가(이벤트 충격 반영됨)
    const h = Math.max(open, f.price) * (1 + Math.random() * PRICE_WICK);
    const l = Math.min(open, f.price) * (1 - Math.random() * PRICE_WICK);
    f.candles.push({ o: r2(open), h: r2(h), l: r2(l), c: r2(f.price) });
    if (f.candles.length > CANDLE_CAP) f.candles.shift();
    f.priceHist.push(Math.round(f.price * 10) / 10);
    if (f.priceHist.length > 120) f.priceHist.shift();
  }
}
// 이벤트 충격: 정합도(−1~1)에 비례해 주가에 큰 배수 충격. bias=트렌드 방향 / market=규제·개방 시장. 반환=내 주가 변동률(시그널용).
export function shockPrices(s: GameState, opt: { bias?: Cap | null; market?: string }): number {
  // 시장 이벤트는 동종업계 상대 적합도로 정합도 산정(matchScore는 절대 스케일이라 평균 대비로 정규화).
  let mean = 0;
  if (opt.market && s.markets[opt.market]) { for (const g of s.firms) mean += matchScore(g, s.markets[opt.market]); mean = mean / Math.max(1, s.firms.length) || 1; }
  let youDelta = 0;
  for (let fi = 0; fi < s.firms.length; fi++) {
    ensureShares(s, fi); const f = s.firms[fi];
    let align = 0;
    if (opt.bias) align = (f.caps[opt.bias] - 50) / 50;
    else if (opt.market && s.markets[opt.market]) { const m = s.markets[opt.market]; align = m.leader === f.key ? 1 : (matchScore(f, m) - mean) / mean; }
    align = clamp(align, -1, 1);
    if (Math.abs(align) < 0.05) continue;
    const before = f.price;
    f.price = bandClamp(s, fi, f.price * (1 + PRICE_SHOCK * align));
    if (fi === s.youIdx) youDelta = (f.price - before) / Math.max(0.01, before);
  }
  return youDelta;
}
// 내 주가가 이벤트로 크게 급등하면 한 줄 시그널(타이밍 인지용 — 버튼 없음).
function surgeSignal(s: GameState, youDelta: number, cause: string) {
  if (youDelta > 0.2) { pushLog(s, "📈 " + cause + " — 우리 주가 급등 +" + Math.round(youDelta * 100) + "% · 유상증자 적기"); s.fx.push("surge"); }
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

// ---- 전략: M&A(인수) / 지분 매입 / 재무(자금조달) ----
export interface MnaTarget { key: string; name: string; col: string; price: number; share: number; myStake: number; founder: number; controlled: boolean; }
// 내가 보유한 라이벌 지분(blocs 중 owner==나).
export function myStakeIn(s: GameState, fi: number, rivalKey: string): number {
  const r = firmByKey(s, rivalKey), my = s.firms[fi].key; if (!r) return 0;
  return r.blocs.reduce((a, b) => a + (b.owner === my ? b.stake : 0), 0);
}
// 인수 후보: 잔여 인수가(이미 보유한 지분만큼 저렴) + 내 지분·라이벌 경영권 상태.
export function acquireTargets(s: GameState, fi: number = s.youIdx): MnaTarget[] {
  const you = s.firms[fi];
  let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size;
  return s.firms.filter(f => f.key !== you.key).map(f => {
    const idx = s.firms.indexOf(f), my = myStakeIn(s, fi, f.key);
    return {
      key: f.key, name: f.name, col: f.col,
      price: Math.max(20, Math.round((1 - my) * marketCap(s, idx) * 1.3)),   // 잔여 지분 인수가(경영권 프리미엄)
      share: tot > 0 ? capturedSize(s, f.key) / tot : 0, myStake: my, founder: f.ownership, controlled: hasControl(s, idx),
    };
  });
}
// 지분 매입: 라이벌 공모주(float)에서 frac(절대비율 0~1) 매입 → 내 블록↑·라이벌 float↓. 비용=frac×시가총액×프리미엄.
export function stakeBuyCost(s: GameState, fi: number, rivalKey: string, frac: number): number {
  const r = firmByKey(s, rivalKey); if (!r) return 0; const idx = s.firms.findIndex(f => f.key === rivalKey);
  return Math.round(Math.min(frac, r.float) * marketCap(s, idx) * 1.1);
}
export function buyStake(s: GameState, fi: number, rivalKey: string, frac: number) {
  const you = s.firms[fi], r = firmByKey(s, rivalKey); if (!r) return;
  const buy = Math.min(Math.max(0, frac), r.float); if (buy < 0.005) return;
  const cost = stakeBuyCost(s, fi, rivalKey, buy); if (you.cash < cost) return;
  you.cash -= cost; r.float -= buy;
  const mine = r.blocs.find(b => b.owner === you.key);
  if (mine) mine.stake += buy; else r.blocs.push({ name: you.name, stake: buy, owner: you.key });
  recomputeLeaders(s);
  pushLog(s, "📈 " + you.name + " " + r.name + " 지분 " + Math.round(buy * 100) + "% 매입 (보유 " + Math.round(myStakeIn(s, fi, rivalKey) * 100) + "%)" + (!hasControl(s, s.firms.indexOf(r)) ? " ⚠️ " + r.name + " 경영권 흔들림" : ""));
}
// 인수 실행: 경쟁자만 제거(점유율 분모 축소 → 그 시장 점유율이 남은 기업에 재분배).
// 역량은 흡수하지 않음 — 그래야 강자가 약체를 사서 약점 역량까지 메워 전 시장을 석권하는 조기 완전장악 허점이 사라짐.
export function doAcquire(s: GameState, fi: number, rivalKey: string) {
  const you = s.firms[fi];
  const idx = s.firms.findIndex(f => f.key === rivalKey);
  if (idx < 0 || s.firms[idx].key === you.key) return;
  const rival = s.firms[idx];
  you.capacity += rival.capacity; you.capacityTarget += rival.capacityTarget;   // 합병: 생산능력(공장) 흡수
  s.firms.splice(idx, 1);                 // 경쟁자 제거 — 호출측이 각자 youIdx를 키로 재해결해야 함
  recomputeLeaders(s);
  pushLog(s, "🤝 " + rival.name + " 인수 완료 — 생산능력 흡수·점유율 재분배(역량은 통합 리스크로 미흡수)");
}
// 부채 조달: 차입여력(4×EBITDA) 내에서만. 즉시 현금, 부채 증가(이자·WACC 상승).
export function raiseDebt(s: GameState, fi: number, amount: number) { const f = s.firms[fi]; const a = Math.min(amount, borrowRoom(s, fi)); if (a <= 0) return; f.cash += a; f.debt += a; pushLog(s, "💵 " + f.name + " 부채 조달 +$" + Math.round(a) + "B"); }
// 전환사채 발행: 저금리 현금 조달(차입한도 공유). 전환가 = 현재 주가 × 1.3.
export function cbMaxIssue(s: GameState, fi: number = s.youIdx) { return Math.floor(borrowRoom(s, fi)); }
export function cbCooldownLeft(s: GameState, fi: number = s.youIdx) { return Math.max(0, (s.firms[fi].cooldowns["cb"] || 0) - s.date); }
export function canIssueCB(s: GameState, fi: number = s.youIdx) { return cbCooldownLeft(s, fi) <= 0 && cbMaxIssue(s, fi) >= 1; }
export function issueCB(s: GameState, fi: number, amount: number) {
  const f = s.firms[fi]; ensureShares(s, fi);
  if (cbCooldownLeft(s, fi) > 0) return;
  const a = Math.min(Math.round(amount), cbMaxIssue(s, fi)); if (a < 1) return;
  f.cbs.push({ principal: a, convPrice: Math.round(f.price * CB_PREMIUM * 10) / 10 });
  f.cash += a; setActCooldown(s, fi, "cb", CB_CD);
  pushLog(s, "🧬 " + f.name + " 전환사채 발행 +$" + a + "B (전환가 $" + (f.price * CB_PREMIUM).toFixed(0) + ", 금리 " + (CB_RATE * 100).toFixed(0) + "%)");
}
// 전환사채 전환(월 경계): 주가가 전환가를 넘은 트랜치는 신주로 전환 → 부채 소멸 + 희석.
function convertCBs(s: GameState) {
  for (let fi = 0; fi < s.firms.length; fi++) {
    const f = s.firms[fi]; if (!f.cbs || !f.cbs.length) continue; ensureShares(s, fi);
    const keep: CB[] = [];
    for (const cb of f.cbs) {
      if (f.price < cb.convPrice) { keep.push(cb); continue; }
      const newShares = cb.principal / cb.convPrice;            // 신주(10억 주 단위) = 원금 / 전환가
      const total = f.shares + newShares, k = f.shares / total, phi = newShares / total;
      f.ownership *= k; for (const b of f.blocs) b.stake *= k; f.float = f.float * k + phi;   // 전환 신주는 공모(float)로
      f.shares = total;
      pushLog(s, "🧬 " + f.name + " 전환사채 $" + Math.round(cb.principal) + "B 전환 — 부채 소멸·지분 " + (phi * 100).toFixed(0) + "% 희석" + (fi === s.youIdx && !hasControl(s, fi) ? " ⚠️경영권 상실" : ""));
      if (fi === s.youIdx) s.fx.push("trend");
    }
    f.cbs = keep;
  }
}

// ===== 비상 경영(현금<0): 유동성 위기 회생 수단 =====
const BANKRUPT_MONTHS = 12;        // 현금 음수가 이만큼 지속되면 파산
const EQUITY_CD = 3;               // FI 증자 쿨다운(개월) — 짧게(경영권 하한이 진짜 한도)
const SI_CD = 18;                  // SI 유치 쿨다운(드묾)
const EQUITY_CREDIT_DRAG = 0;      // 증자 비용은 '지분 희석'이 담당(신용 드래그 제거)
const FOUNDER_FLOOR = 0.20;        // 창업자 최저 경영권선(분산주주도 못 버티는 하한)
const FI_PHI = 0.15;               // FI 증자 1회: 증자후 회사의 이 비율을 분산 FI에 매각(희석 ×(1-φ))
const SI_PHI = 0.25;               // SI 유치 1회: 이 비율을 집중 전략투자자(블록)에 매각 — 큰 자금이나 경영권 위협
const AUSTERITY_KEEP = 4;          // 비상 긴축 시 유지할 강세 시장 수
const RESCUE_BUFFER = 12;          // 비상 회생(증자·긴급대출)은 '적자 메우기 + 이 소액 버퍼'까지만 — windfall 방지
export function insolvent(s: GameState, fi: number = s.youIdx) { return s.firms[fi].cash < 0; }
export function bankruptcyIn(s: GameState, fi: number = s.youIdx) { return Math.max(0, BANKRUPT_MONTHS - (s.firms[fi].distress || 0)); }
// 회생에 필요한 현금(적자 + 소액 버퍼). 증자·긴급대출은 이만큼만 — 일부러 적자 내 큰 현금 빼먹는 악용 차단.
export function rescueNeed(s: GameState, fi: number = s.youIdx) { return Math.max(0, Math.ceil(-s.firms[fi].cash) + RESCUE_BUFFER); }

// ===== 지분구조·지배구조 =====
export const FOUNDER_MIN = FOUNDER_FLOOR;
// 최악의 공동행동(acting in concert) = 집중 SI 블록 합. 분산 FI(float)는 제외(수동).
export function controllingThreat(s: GameState, fi: number = s.youIdx) { return s.firms[fi].blocs.reduce((a, b) => a + b.stake, 0); }
// 경영권: 창업자 지분 ≥ 최대 적대 블록(ΣSI) AND ≥ 분산주주 하한(FOUNDER_FLOOR).
export function hasControl(s: GameState, fi: number = s.youIdx) {
  const f = s.firms[fi]; return f.ownership >= controllingThreat(s, fi) - 1e-9 && f.ownership >= FOUNDER_FLOOR - 1e-9;
}
const preOf = (s: GameState, fi: number) => Math.max(1, marketCap(s, fi));
// FI 증자 비율 φ: 흑자=경영권 유지 한도 내 FI_PHI / 적자=회생액 충당(경영권 깨도 허용).
function fiPhi(s: GameState, fi: number): number {
  const f = s.firms[fi];
  if (insolvent(s, fi)) { const pre = preOf(s, fi), need = rescueNeed(s, fi); return Math.min(0.9, need / (pre + need)); }
  const floorT = Math.max(FOUNDER_FLOOR, controllingThreat(s, fi));
  return Math.min(FI_PHI, Math.max(0, 1 - floorT / f.ownership));   // ownership×(1-φ) ≥ floorT
}
// SI 유치 비율 φ: 경영권을 깨지 않을 때만(자발적). 깨지면 0(차단).
function siPhi(s: GameState, fi: number): number {
  const f = s.firms[fi]; if (insolvent(s, fi)) return 0;
  const φ = SI_PHI, own2 = f.ownership * (1 - φ), si2 = controllingThreat(s, fi) * (1 - φ) + φ;
  return own2 >= Math.max(FOUNDER_FLOOR, si2) - 1e-9 ? φ : 0;
}
const phiToAmt = (pre: number, φ: number) => (φ > 1e-3 ? Math.round(pre * φ / (1 - φ)) : 0);
// 증자 적용: φ만큼 신주 발행(증자후 회사의 φ). 기존 지분 ×(1-φ), FI→float / SI→새 블록. cash 조달.
function applyRaise(s: GameState, fi: number, φ: number, asSI: boolean): number {
  const f = s.firms[fi]; ensureShares(s, fi); const amt = phiToAmt(preOf(s, fi), φ); if (amt <= 0) return 0;
  const keep = 1 - φ; f.ownership *= keep; f.float *= keep; for (const b of f.blocs) b.stake *= keep;
  if (asSI) f.blocs.push({ name: "전략투자자 " + (f.blocs.length + 1), stake: φ }); else f.float += φ;
  f.shares /= keep;                          // 신주 발행(주가 연속 유지, 시총 = post-money = pre + amt)
  f.cash += amt; f.equityRaises++; return amt;
}
export function fiRaiseAmount(s: GameState, fi: number = s.youIdx) { return phiToAmt(preOf(s, fi), fiPhi(s, fi)); }
export function siRaiseAmount(s: GameState, fi: number = s.youIdx) { return phiToAmt(preOf(s, fi), siPhi(s, fi)); }
export function fiOwnershipAfter(s: GameState, fi: number = s.youIdx) { return s.firms[fi].ownership * (1 - fiPhi(s, fi)); }
export function siOwnershipAfter(s: GameState, fi: number = s.youIdx) { return s.firms[fi].ownership * (1 - siPhi(s, fi)); }
// 슬라이더 최대 조달액: 경영권(과 20% 하한) 유지 한도. FI=분산(ΣSI 불변) / SI=집중 블록(ΣSI↑).
export function equityMaxRaise(s: GameState, fi: number = s.youIdx, asSI = false): number {
  const f = s.firms[fi], pre = preOf(s, fi), si = controllingThreat(s, fi);
  if (!asSI) { const T = Math.max(FOUNDER_FLOOR, si); if (f.ownership <= T) return 0; return Math.floor(pre * (f.ownership / T - 1)); }
  if (f.ownership - si <= 1e-6) return 0;
  const kMin = Math.max(1 / (1 + f.ownership - si), FOUNDER_FLOOR / f.ownership);
  const phiMax = Math.max(0, 1 - kMin); if (phiMax <= 1e-3) return 0;
  return Math.floor(pre * phiMax / (1 - phiMax));
}
// 플레이어가 슬라이더로 고른 금액만큼 증자(경영권 한도로 클램프).
export function equityRaiseBy(s: GameState, fi: number, amount: number, asSI: boolean) {
  if (!canAct(s, fi, asSI ? "si" : "equity")) return;
  const pre = preOf(s, fi); const amt = Math.min(Math.max(0, Math.round(amount)), equityMaxRaise(s, fi, asSI)); if (amt <= 0) return;
  const got = applyRaise(s, fi, amt / (pre + amt), asSI);
  setActCooldown(s, fi, asSI ? "si" : "equity", asSI ? SI_CD : EQUITY_CD);
  pushLog(s, (asSI ? "🤝 " : "🏦 ") + s.firms[fi].name + (asSI ? " 전략적 투자자 유상증자 +$" : " 재무적 투자자 유상증자 +$") + got + "B · 내 지분 " + (s.firms[fi].ownership * 100).toFixed(0) + "%" + (!hasControl(s, fi) ? " ⚠️경영권 상실" : ""));
}
export function canRaiseFI(s: GameState, fi: number = s.youIdx) { return canAct(s, fi, "equity") && equityMaxRaise(s, fi, false) > 0; }
export function canRaiseSI(s: GameState, fi: number = s.youIdx) { return canAct(s, fi, "si") && equityMaxRaise(s, fi, true) > 0; }
export function raiseFI(s: GameState, fi: number = s.youIdx) {
  if (!canAct(s, fi, "equity")) return; const amt = applyRaise(s, fi, fiPhi(s, fi), false); if (amt <= 0) return;
  setActCooldown(s, fi, "equity", EQUITY_CD);
  pushLog(s, "🏦 " + s.firms[fi].name + " FI 증자 +$" + amt + "B · 내 지분 " + (s.firms[fi].ownership * 100).toFixed(0) + "%" + (!hasControl(s, fi) ? " ⚠️경영권 상실" : ""));
}
export function raiseSI(s: GameState, fi: number = s.youIdx) {
  if (!canAct(s, fi, "si")) return; const amt = applyRaise(s, fi, siPhi(s, fi), true); if (amt <= 0) return;
  setActCooldown(s, fi, "si", SI_CD);
  pushLog(s, "🤝 " + s.firms[fi].name + " SI 유치 +$" + amt + "B · 내 지분 " + (s.firms[fi].ownership * 100).toFixed(0) + "% · 전략투자자 블록↑");
}
// 하위호환(비상 회생 등): raiseEquity = FI 증자.
export function raiseEquity(s: GameState, fi: number = s.youIdx) { raiseFI(s, fi); }
export function canRaiseEquity(s: GameState, fi: number = s.youIdx) { return canRaiseFI(s, fi); }
export function equityRaiseAmount(s: GameState, fi: number = s.youIdx) { return fiRaiseAmount(s, fi); }
export function equityDilutionPreview(s: GameState, fi: number = s.youIdx) { return fiOwnershipAfter(s, fi); }
export function equityCooldownLeft(s: GameState, fi: number = s.youIdx) { return Math.max(0, (s.firms[fi].cooldowns["equity"] || 0) - s.date); }
export function siCooldownLeft(s: GameState, fi: number = s.youIdx) { return Math.max(0, (s.firms[fi].cooldowns["si"] || 0) - s.date); }
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
export function setActCooldown(s: GameState, fi: number, key: string, months: number) { s.firms[fi].cooldowns[key] = s.date + months * DAYS_PER_MONTH; }

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
  s.date++;                                   // s.date: '일' 단위
  const D = DAYS_PER_MONTH;
  const monthEnd = s.date % D === 0;          // 한 달 경계 — 환경/AI/운영 등 이산(discrete) 로직은 여기서만(월간 튜닝 보존)
  const youKey = s.firms[s.youIdx].key;
  // 시장 성장 — 매일 1/D씩(월 누적 ≈ 기존 월 성장률).
  const grow = s.scenario.growth || 0;
  if (grow) for (const n in s.markets) s.markets[n].size *= (1 + grow / D);
  // ── 월 경계: 환경 이벤트(트렌드·규제·테마·소비자 드리프트) ──
  if (monthEnd) {
    if (s.date >= s.trend.until) {
      const t = pickTrend(s); const head = "「" + s.scenario.ko + "」 " + t.headline;
      s.trend = { bias: t.bias, until: s.date + ri(6, 11) * D, headline: head, note: t.note }; pushLog(s, "📰 " + head);
      s.event = { title: head, note: t.note, id: s.event.id + 1, icon: "📰" }; s.fx.push("trend");
      surgeSignal(s, shockPrices(s, { bias: t.bias }), head);   // 트렌드 정합도에 비례한 주가 급등/급락
    }
    if (s.date > D && Math.random() < 0.11) {
      const m = s.markets[s.marketOrder[ri(0, s.marketOrder.length - 1)]]; const ind = s.scenario.ko;
      if (Math.random() < 0.5) { m.size = Math.max(20, m.size * 0.88); m.pref.global += 0.15; renorm(m); pushLog(s, "⚖️ " + m.ko + " · " + ind + " 규제 강화"); s.event = { title: m.ko + " " + ind + " 규제 강화", note: "현지 시장 위축 · 현지대응/컴플라이언스가 중요해집니다.", id: s.event.id + 1, icon: "⚖️" }; }
      else { m.size = m.size * 1.12; const k: Cap = Math.random() < 0.5 ? "tech" : "scale"; m.pref[k] += 0.12; renorm(m); pushLog(s, "🟢 " + m.ko + " · " + ind + " 시장 개방/부양"); s.event = { title: m.ko + " " + ind + " 시장 개방·부양", note: "시장 규모 확대 · " + CAPKO[k] + " 수요가 늘어납니다.", id: s.event.id + 1, icon: "🟢" }; }
      s.fx.push("trend");
      surgeSignal(s, shockPrices(s, { market: m.name }), m.ko + " 환경 변화");   // 그 시장 적합도에 비례한 주가 충격
    }
    if (s.date > D && Math.random() < 0.04) {
      const k = CAPS[ri(0, 3)]; const d = shockPrices(s, { bias: k });
      pushLog(s, "💸 시장에 「" + CAPKO[k] + "」 테마 부각 — 관련주 출렁"); surgeSignal(s, d, CAPKO[k] + " 테마");
    }
    for (const n of s.marketOrder) {
      if (Math.random() < 0.18) {
        const m = s.markets[n]; const k: Cap = (s.trend.bias && Math.random() < 0.75) ? s.trend.bias : CAPS[ri(0, 3)];
        m.pref[k] = (m.pref[k] || 0) + 0.05; let tot = 0; for (const p of CAPS) tot += m.pref[p]; for (const p of CAPS) m.pref[p] /= tot;
      }
    }
    // ── 월 경계: AI 정책·영향력/생산능력 램프·벤처 진행(이산, 월간 그대로) ──
    for (let fi = 0; fi < s.firms.length; fi++) {
      const f = s.firms[fi];
      if (f.auto) aiPolicy(s, fi);
      rampEffort(s, fi);
      if (f.capacityTarget !== f.capacity) {
        const next = f.capacity + (f.capacityTarget - f.capacity) * CAP_RAMP;
        f.capacity = Math.abs(next - f.capacityTarget) < 0.5 ? f.capacityTarget : next;
      }
      progressVenture(s, fi);
    }
  }
  // ── 매일: 재무 흐름(현금흐름·유지비·이자) 1/D씩 ──
  for (let fi = 0; fi < s.firms.length; fi++) {
    const f = s.firms[fi];
    f.cash += monthlyCashflow(s, fi) / D;
    f.cash -= allocUpkeep(s, fi) / D;
    f.cash -= monthlyInterest(s, fi) / D;
    f.cash -= cbInterestMonthly(s, fi) / D;        // 전환사채 저금리 이자
  }
  // ── 매일: 배당(순이익×divRate를 1/D씩 지분 비례 지급). 다른 회사 보유 블록 몫 → 그 회사 현금(상호출자). ──
  for (let i = 0; i < s.firms.length; i++) {
    const f = s.firms[i]; const net = operatingIncome(s, i) - monthlyInterest(s, i);
    const div = (f.divRate || 0) * Math.max(0, net) / D; if (div <= 0) continue;
    f.cash -= div; f.wealth = (f.wealth || 0) + div * f.ownership;
    for (const b of f.blocs) if (b.owner) { const o = firmByKey(s, b.owner); if (o) o.cash += div * b.stake; }
  }
  // ── 월 경계: 전환사채 전환 체크 + 채무 위험 카운터(개월 단위 유지) ──
  if (monthEnd) {
    convertCBs(s);
    for (let fi = 0; fi < s.firms.length; fi++) {
      const f = s.firms[fi];
      if (f.cash < 0) { f.distress++; if (f.distress === 6 && f.key === youKey) pushLog(s, "⚠️ 채무 위험 — 현금 고갈. 할당 축소·점유율 회복 필요"); }
      else f.distress = 0;
    }
  }
  recomputeLeaders(s);
  updatePrices(s);            // 매일 주가 갱신(일봉 1개) — 평균회귀+소음, 이벤트 충격 반영

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

  // 승리: 완전 장악(전 시장 1위 + 결정적 점유율) / 마감 시 1위 — 단, 경영권(과반 지분) 보유가 필수.
  const firstLeader = s.markets[s.marketOrder[0]].leader;
  const leadAll = s.marketOrder.every(n => s.markets[n].leader === firstLeader);
  const domIdx = leadAll ? s.firms.findIndex(x => x.key === firstLeader) : -1;
  if (leadAll && myShare(s, domIdx) >= DOM_SHARE && hasControl(s, domIdx)) {   // 전 시장 1위 + 결정적 점유율 + 경영권
    const w = s.firms[domIdx];
    s.ui.over = { winnerKey: firstLeader, won: firstLeader === youKey, msg: w.name + " — 시장 완전 장악!" }; s.speed = 0; s.fx.push(firstLeader === youKey ? "win" : "lose");
  } else if (s.date >= END_DAYS) {
    // 마감 승자 = 실현 점령규모 1위(연결은 '흡수(인수)'로만 — passive 지분 보유는 배당만, 자동승리 아님).
    const ranked = rankByCaptured(s);
    const top = ranked[0].firm; const ti = s.firms.findIndex(x => x.key === top.key);
    const sh = (myShare(s, ti) * 100).toFixed(0);
    const youAreTop = top.key === youKey;
    const youKeepControl = hasControl(s, s.youIdx);   // 내 회사 경영권(과반 지분) 사수 여부
    const won = youAreTop && youKeepControl;
    const msg = (youAreTop && !youKeepControl)
      ? "마감 — 경영권 상실로 패배 (점유 1위였으나 과반 지분 상실)"
      : "마감 — 최종 1위 " + top.name + " (" + sh + "%)";
    s.ui.over = { winnerKey: top.key, won, msg }; s.speed = 0; s.fx.push(won ? "win" : "lose");
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
  // 생산능력 증설: 수요(자연점령)가 생산능력을 넘으면(가동률 한계) 여유자금/차입으로 증설.
  const nat = naturalCaptured(s, f.key);
  if (f.cash >= 0 && nat > f.capacityTarget * 1.03) {
    const amt = (nat - f.capacityTarget) * 0.6;
    const px = capacityCapex(s, amt);
    if (px > 0 && f.cash + borrowRoom(s, fi) >= px) { if (f.cash < px) raiseDebt(s, fi, px - f.cash); f.cash -= px; buildCapacity(s, fi, amt); }
  }
}
// 한 firm이 지금 점유율을 가장 키울 수 있는 역량(시장을 읽음).
function bestRivalCap(s: GameState, f: Firm): Cap | null {
  const base = capturedSize(s, f.key); let best: Cap | null = null, bd = 0;
  for (const k of CAPS) { const nc = { ...f.caps }; nc[k] = clamp(nc[k] + 14, 0, 100); const d = capturedSize(s, f.key, nc) - base; if (d > bd) { bd = d; best = k; } }
  return best;
}
export function pushLog(s: GameState, m: string) { s.log.unshift("[" + dateLabel(s.date) + "] " + m); if (s.log.length > 40) s.log.pop(); }
// s.date는 '일' 단위. 2026-01-01 기준 실제 달력으로 연.월.일 표기.
export function dateLabel(days: number) {
  const d = new Date(START_MS + days * 86400000); const p = (n: number) => (n < 10 ? "0" + n : "" + n);
  return d.getUTCFullYear() + "." + p(d.getUTCMonth() + 1) + "." + p(d.getUTCDate());
}

// operate gating helpers (firm별 벤처 쿨다운)
export function ventureOf(f: Firm, cap: Cap) { return f.ventures.find(v => v.cap === cap); }
export function canOperate(s: GameState, fi: number, cap: Cap, action: string) { const v = ventureOf(s.firms[fi], cap); return !v || (v.cooldown[action] || 0) <= s.date; }
export function setCooldown(s: GameState, fi: number, cap: Cap, action: string, months: number) { const v = ventureOf(s.firms[fi], cap); if (v) v.cooldown[action] = s.date + months * DAYS_PER_MONTH; }
