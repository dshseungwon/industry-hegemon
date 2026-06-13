import { GameState, Cap, CAPS, CAPKO, Firm, Market } from "./state";

export function gcap(c: number) { return Math.pow(Math.max(0, Math.min(100, c)) / 100, 0.7) * 100; }
export function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function ri(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)); }

// ---- balance constants (튜닝 손잡이) ----
export const SHARE_BETA = 6;   // 점유율 민감도: 적합도^β. 높을수록 승자독식, 낮을수록 균등.
export const END_MONTHS = 120; // 게임 horizon(10년). 이 시점에 점유율 1위면 승리.
const MARGIN = 0.012;          // 점령 규모 1단위당 월 현금($B)
const OVERHEAD = 3;            // 월 고정비($B) — 점유율이 낮으면 적자
const RIVAL_CHANCE = 0.10;     // 경쟁사가 매월 투자할 확률(시장을 읽고 최선 역량에)
const RIVAL_SIZE = 6;          // 경쟁사 1회 투자 역량 증가폭

function scoreWith(caps: Record<Cap, number>, m: Market) { let s = 0; for (const k of CAPS) s += (m.pref[k] || 0) * gcap(caps[k]); return s; }
export function matchScore(f: Firm, m: Market) { return scoreWith(f.caps, m); }
export function leaderOf(s: GameState, m: Market): Firm { let best = s.firms[0], bv = -1; for (const f of s.firms) { const v = matchScore(f, m); if (v > bv) { bv = v; best = f; } } return best; }
export function recomputeLeaders(s: GameState) { for (const n of s.marketOrder) s.markets[n].leader = leaderOf(s, s.markets[n]).key; }

// 한 시장에서 firm의 점유율 = 적합도^β / Σ 적합도^β. capsOverride로 "이 투자를 하면?" 평가.
export function shareOf(s: GameState, m: Market, firmKey: string, capsOverride?: Record<Cap, number>) {
  let tot = 0, mine = 0;
  for (const f of s.firms) {
    const caps = capsOverride && f.key === firmKey ? capsOverride : f.caps;
    const v = Math.pow(scoreWith(caps, m), SHARE_BETA);
    tot += v; if (f.key === firmKey) mine = v;
  }
  return tot > 0 ? mine / tot : 0;
}
// firm이 전 세계에서 점령한 규모(가중) 단위
export function capturedSize(s: GameState, firmKey: string, capsOverride?: Record<Cap, number>) {
  let sz = 0; for (const n of s.marketOrder) { const m = s.markets[n]; sz += m.size * shareOf(s, m, firmKey, capsOverride); } return sz;
}
export function myShare(s: GameState, fi: number = s.youIdx) { let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size; return tot > 0 ? capturedSize(s, s.firms[fi].key) / tot : 0; }
export function monthlyCashflow(s: GameState, fi: number = s.youIdx) { const m = techMods(s, fi); return capturedSize(s, s.firms[fi].key) * (MARGIN + m.marginAdd) - Math.max(0, OVERHEAD - m.overheadCut); }
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
export function annualEbitda(s: GameState, fi: number = s.youIdx) { return Math.max(0, monthlyCashflow(s, fi) * 12); }
export function leverage(s: GameState, fi: number = s.youIdx) { const e = annualEbitda(s, fi), d = s.firms[fi].debt; return e > 0 ? d / e : (d > 0 ? 99 : 0); }
export function debtCapacity(s: GameState, fi: number = s.youIdx) { return LEV_MAX * annualEbitda(s, fi); }
export function borrowRoom(s: GameState, fi: number = s.youIdx) { return Math.max(0, debtCapacity(s, fi) - s.firms[fi].debt); }
export function creditRating(s: GameState, fi: number = s.youIdx) { const l = leverage(s, fi); return l <= 1 ? "AAA" : l <= 2 ? "AA" : l <= 3 ? "A" : l <= 4 ? "BBB" : l <= 5 ? "BB" : l <= 6 ? "B" : l <= 8 ? "CCC" : "D"; }
export function debtRate(s: GameState, fi: number = s.youIdx) { return 0.04 + Math.min(0.16, leverage(s, fi) * 0.025); }   // 레버리지↑ → 이자↑
export function waccOf(s: GameState, fi: number = s.youIdx) { return 0.08 + Math.min(0.08, leverage(s, fi) * 0.012); }

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
    const capex = 24; const cf = [-capex]; for (let t = 1; t <= 5; t++) cf.push(annual * Math.pow(1.03, t - 1));
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
// 인수 실행: 각 역량을 더 높은 값으로 흡수하고, 경쟁자를 제거(점유율 분모 축소 → 내 점유율 급등).
export function doAcquire(s: GameState, fi: number, rivalKey: string) {
  const you = s.firms[fi];
  const idx = s.firms.findIndex(f => f.key === rivalKey);
  if (idx < 0 || s.firms[idx].key === you.key) return;
  const rival = s.firms[idx];
  for (const k of CAPS) you.caps[k] = clamp(Math.max(you.caps[k], rival.caps[k]), 0, 100);
  s.firms.splice(idx, 1);                 // 경쟁자 제거 — 호출측이 각자 youIdx를 키로 재해결해야 함
  recomputeLeaders(s);
  pushLog(s, "🤝 " + rival.name + " 인수 완료 — 역량 흡수·경쟁자 제거");
}
// 부채 조달: 차입여력(4×EBITDA) 내에서만. 즉시 현금, 부채 증가(이자·WACC 상승).
export function raiseDebt(s: GameState, fi: number, amount: number) { const f = s.firms[fi]; const a = Math.min(amount, borrowRoom(s, fi)); if (a <= 0) return; f.cash += a; f.debt += a; pushLog(s, "💵 " + f.name + " 부채 조달 +$" + Math.round(a) + "B"); }

function renorm(m: Market) { let t = 0; for (const p of CAPS) t += m.pref[p]; if (t > 0) for (const p of CAPS) m.pref[p] /= t; }

// ---- 해외진출: 닫힌 프론티어 시장을 진입장벽을 뚫고 개척(시장 확대 + 선점 우위) ----
export function isOpen(s: GameState, name: string) { return s.marketOrder.includes(name); }
export function frontierMarkets(s: GameState): Market[] { return Object.values(s.markets).filter(m => !s.marketOrder.includes(m.name)); }
export function entryCost(s: GameState, name: string) { const m = s.markets[name]; return m ? Math.max(15, Math.round(m.size * 0.4)) : 0; }
export function doEnter(s: GameState, fi: number, name: string) {
  if (s.marketOrder.includes(name)) return;
  const m = s.markets[name]; if (!m) return;
  const you = s.firms[fi];
  let best: Cap = "tech"; for (const k of CAPS) if (you.caps[k] > you.caps[best]) best = k;
  // 진출 시장을 우리 강점으로 형성 → 선점 우위
  for (const k of CAPS) m.pref[k] = 0.2; m.pref[best] += 0.25; renorm(m);
  s.marketOrder.push(name); recomputeLeaders(s);
  pushLog(s, "🌏 " + m.ko + " 해외진출 — 신규 시장 개척");
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
export const TECH_NODES: TechNode[] = [
  { key: "rnd",          name: "R&D 센터",      desc: "기술 +8 · 벤처 진행 +1.5/월", cost: 28,  req: [],                  caps: { tech: 8 } },
  { key: "automation",   name: "생산 자동화",    desc: "가성비 +8 · 월 고정비 -1",     cost: 28,  req: [],                  caps: { scale: 8 } },
  { key: "ai",           name: "AI 플랫폼",      desc: "기술 +10 · 마진↑",            cost: 50,  req: ["rnd"],             caps: { tech: 10 } },
  { key: "brandlab",     name: "브랜드 랩",      desc: "브랜드 +10",                  cost: 48,  req: ["rnd"],             caps: { brand: 10 } },
  { key: "smartfactory", name: "스마트 팩토리",  desc: "가성비 +10 · 고정비 -2",       cost: 50,  req: ["automation"],      caps: { scale: 10 } },
  { key: "globalscm",    name: "글로벌 SCM",     desc: "글로벌 +10 · 마진↑",          cost: 54,  req: ["automation"],      caps: { global: 10 } },
  { key: "ecosystem",    name: "플랫폼 생태계",  desc: "전 역량 +6 · 마진↑↑",         cost: 110, req: ["ai", "brandlab"],  caps: { tech: 6, brand: 6, scale: 6, global: 6 } },
];
export function researchOptions(s: GameState, fi: number = s.youIdx) {
  const have = new Set(s.firms[fi].tech);
  return TECH_NODES.map(n => ({ node: n, unlocked: have.has(n.key), available: !have.has(n.key) && n.req.every(r => have.has(r)) }));
}
export function doResearch(s: GameState, fi: number, key: string) {
  const you = s.firms[fi];
  if (you.tech.includes(key)) return;
  const n = TECH_NODES.find(x => x.key === key); if (!n || !n.req.every(r => you.tech.includes(r))) return;
  if (n.caps) for (const k of CAPS) if (n.caps[k]) you.caps[k] = clamp(you.caps[k] + n.caps[k]!, 0, 100);
  you.tech.push(key); recomputeLeaders(s);
  pushLog(s, "🔬 " + you.name + " " + n.name + " 개발 완료");
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
export function tick(s: GameState) {
  if (s.ui.over) return;
  s.fx = [];
  s.date++;
  // trend cycle
  if (s.date >= s.trend.until) { const t = TRENDS[ri(0, TRENDS.length - 1)]; s.trend = { bias: t.bias, until: s.date + ri(6, 11), headline: t.headline, note: t.note }; pushLog(s, "📰 " + t.headline); s.fx.push("trend"); }
  // 정책/규제 이벤트 — 한 시장의 환경(규모·KSF)을 바꿈(법률·정치 흐름). 진단해서 대응해야 함.
  if (s.date > 1 && Math.random() < 0.11) {
    const m = s.markets[s.marketOrder[ri(0, s.marketOrder.length - 1)]];
    if (Math.random() < 0.5) { m.size = Math.max(20, Math.round(m.size * 0.88)); m.pref.global += 0.15; renorm(m); pushLog(s, "⚖️ " + m.ko + " 규제 강화 — 시장 위축·현지대응/컴플라이언스 중요"); }
    else { m.size = Math.round(m.size * 1.12); const k: Cap = Math.random() < 0.5 ? "tech" : "scale"; m.pref[k] += 0.12; renorm(m); pushLog(s, "🟢 " + m.ko + " 시장 개방/부양 — 규모 확대, " + CAPKO[k] + " 수요↑"); }
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
    progressVenture(s, fi);
    f.cash += monthlyCashflow(s, fi);
    if (f.debt > 0) f.cash -= f.debt * (debtRate(s, fi) / 12);
    if (f.cash < 0) { f.distress++; if (f.distress === 6 && f.key === youKey) pushLog(s, "⚠️ 채무 위험 — 현금 고갈. 점유율 회복·자산매각 필요"); }
    else f.distress = 0;
  }
  recomputeLeaders(s);

  // 파산: 채무 불이행 12개월 지속 → 퇴출(AI) / 패배(플레이어)
  const playerBankrupt = (s.firms[s.youIdx]?.distress || 0) >= 12;
  for (const f of [...s.firms]) {
    if (f.distress >= 12 && f.key !== youKey && s.firms.length > 1) {
      s.firms = s.firms.filter(x => x.key !== f.key);
      pushLog(s, "💸 " + f.name + " 파산 — 시장에서 퇴출");
    }
  }
  s.youIdx = Math.max(0, s.firms.findIndex(x => x.key === youKey));
  recomputeLeaders(s);
  if (playerBankrupt) { s.ui.over = { won: false, msg: "💸 파산 — 채무 불이행으로 경영권 상실" }; s.speed = 0; s.fx.push("lose"); return; }

  // 승리: 완전 장악(한 firm이 전 시장 1위) / 마감 시 1위
  const firstLeader = s.markets[s.marketOrder[0]].leader;
  const dominated = s.marketOrder.every(n => s.markets[n].leader === firstLeader);
  if (dominated) {
    const w = s.firms.find(x => x.key === firstLeader)!;
    s.ui.over = { winnerKey: firstLeader, won: firstLeader === youKey, msg: w.name + " — 시장 완전 장악!" }; s.speed = 0; s.fx.push(firstLeader === youKey ? "win" : "lose");
  } else if (s.date >= END_MONTHS) {
    const top = rankByCaptured(s)[0].firm; const sh = (myShare(s, s.firms.findIndex(x => x.key === top.key)) * 100).toFixed(0);
    s.ui.over = { winnerKey: top.key, won: top.key === youKey, msg: "마감 — 최종 1위 " + top.name + " (" + sh + "%)" }; s.speed = 0; s.fx.push(top.key === youKey ? "win" : "lose");
  }
}
// 한 firm의 벤처 진행 + 완성 처리
function progressVenture(s: GameState, fi: number) {
  const f = s.firms[fi]; const v = f.venture; if (!v) return;
  if (Math.random() < 0.09) v.risk++;
  const rate = 7 + techMods(s, fi).ventureAdd - v.risk * 1.3; v.progress = Math.min(100, v.progress + Math.max(2, rate));
  if (v.progress >= 100) {
    f.caps[v.cap] = clamp(f.caps[v.cap] + v.payoff, 0, 100); f.venture = null;
    if (f.key === s.firms[s.youIdx].key) { pushLog(s, "🚀 " + CAPKO[v.cap] + " 프로그램 완성! 시장 점령 확대"); s.fx.push("complete"); }
  }
}
// AI 정책: 시장을 읽어 최선 역량에 완만히 투자(내부개발). 구 밸런스 페이싱 유지(가속 안 함, M&A/재무는 추후).
function aiPolicy(s: GameState, fi: number) {
  const f = s.firms[fi];
  if (!f.venture && f.cash >= 24 && Math.random() < RIVAL_CHANCE) {   // ~월 0.10 확률로 신규 투자
    const best = bestRivalCap(s, f);
    if (best) { f.cash -= 24; f.venture = { name: CAPKO[best] + " 역량 프로그램", cap: best, payoff: RIVAL_SIZE, progress: 6, risk: 0, cooldown: {} }; }
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
export function canOperate(s: GameState, fi: number, action: string) { const v = s.firms[fi].venture; return !v || (v.cooldown[action] || 0) <= s.date; }
export function setCooldown(s: GameState, fi: number, action: string, months: number) { const v = s.firms[fi].venture; if (v) v.cooldown[action] = s.date + months; }
