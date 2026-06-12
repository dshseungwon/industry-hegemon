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
export function myShare(s: GameState) { let tot = 0; for (const n of s.marketOrder) tot += s.markets[n].size; const you = s.firms[s.youIdx].key; return tot > 0 ? capturedSize(s, you) / tot : 0; }
export function monthlyCashflow(s: GameState) { return capturedSize(s, s.firms[s.youIdx].key) * MARGIN - OVERHEAD; }
// 시간 종료 판정: 점령 규모 기준 전 기업 순위(내림차순). [0]이 1위.
export function rankByCaptured(s: GameState) { return s.firms.map(f => ({ firm: f, size: capturedSize(s, f.key) })).sort((a, b) => b.size - a.size); }

// ---- finance ----
export function npv(r: number, cf: number[]) { let s = 0; for (let t = 0; t < cf.length; t++) s += cf[t] / Math.pow(1 + r, t); return s; }
export function irr(cf: number[]): number | null {
  let lo = -0.95, hi = 2, flo = npv(lo, cf); if (flo * npv(hi, cf) > 0) { hi = 8; if (flo * npv(hi, cf) > 0) return null; }
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, fm = npv(m, cf); if (Math.abs(fm) < 1e-6) return m; if (flo * fm < 0) hi = m; else { lo = m; flo = fm; } }
  return (lo + hi) / 2;
}
export function waccOf(s: GameState) { const lev = s.debt / Math.max(80, myShare(s) * 1500); return 0.05 + 0.04 + Math.min(0.08, lev * 0.1); }

export interface Project { cap: Cap; h: string; e: string; capex: number; P: number; npv: number; irr: number | null; gain: number; dShare: number; }
export function strategyProjects(s: GameState): Project[] {
  const you = s.firms[s.youIdx]; const wacc = waccOf(s); const list: Project[] = [];
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
  // consumers drift toward the current trend bias — 자주·작게 움직여 매끄럽고 읽히는 변화(트렌드가 주 신호)
  for (const n of s.marketOrder) {
    if (Math.random() < 0.18) {
      const m = s.markets[n]; const k: Cap = (s.trend.bias && Math.random() < 0.75) ? s.trend.bias : CAPS[ri(0, 3)];
      m.pref[k] = (m.pref[k] || 0) + 0.05; let tot = 0; for (const p of CAPS) tot += m.pref[p]; for (const p of CAPS) m.pref[p] /= tot;
    }
  }
  // rivals also read the market and invest into their best-payoff cap (대칭적 경쟁)
  for (const f of s.firms) {
    if (f.key === s.firms[s.youIdx].key) continue;
    if (Math.random() < RIVAL_CHANCE) { const best = bestRivalCap(s, f); if (best) f.caps[best] = clamp(f.caps[best] + RIVAL_SIZE, 0, 100); }
  }
  // venture progress + risk over time — 완성 ~12개월, 리스크 미해소 시 크게 느려짐
  if (s.venture) {
    const v = s.venture;
    if (Math.random() < 0.09) v.risk++;
    const rate = 7 - v.risk * 1.3; v.progress = Math.min(100, v.progress + Math.max(2, rate));
    if (v.progress >= 100) {
      const you = s.firms[s.youIdx]; you.caps[v.cap] = clamp(you.caps[v.cap] + v.payoff, 0, 100);
      pushLog(s, "🚀 " + CAPKO[v.cap] + " 프로그램 완성! 시장 점령 확대");
      s.venture = null; s.fx.push("complete");
    }
  }
  // monthly finance: 점유율 기반 수입 − 고정비, 이자
  s.cash += monthlyCashflow(s);
  if (s.debt > 0) s.cash -= s.debt * (0.05 / 12);
  recomputeLeaders(s);
  // victory (2조건)
  const youKey = s.firms[s.youIdx].key;
  if (s.marketOrder.every(n => s.markets[n].leader === youKey)) {
    s.ui.over = { won: true, msg: "시장 완전 장악 — 모든 시장 1위!" }; s.speed = 0; s.fx.push("win");
  } else if (s.date >= END_MONTHS) {
    const rank = rankByCaptured(s); const top = rank[0].firm; const won = top.key === youKey;
    const sh = (myShare(s) * 100).toFixed(0);
    s.ui.over = won
      ? { won: true, msg: "🏁 마감 — 점유율 1위로 승리! (" + sh + "%)" }
      : { won: false, msg: "🏁 마감 — 패배. 최종 1위: " + top.name }; s.speed = 0;
    s.fx.push(won ? "win" : "lose");
  }
}
// 경쟁사가 지금 점유율을 가장 키울 수 있는 역량(시장을 읽음). 플레이어 strategyProjects와 동일 논리.
function bestRivalCap(s: GameState, f: Firm): Cap | null {
  const base = capturedSize(s, f.key); let best: Cap | null = null, bd = 0;
  for (const k of CAPS) { const nc = { ...f.caps }; nc[k] = clamp(nc[k] + 14, 0, 100); const d = capturedSize(s, f.key, nc) - base; if (d > bd) { bd = d; best = k; } }
  return best;
}
export function pushLog(s: GameState, m: string) { s.log.unshift("[" + dateLabel(s.date) + "] " + m); if (s.log.length > 40) s.log.pop(); }
export function dateLabel(months: number) { const y = 2026 + Math.floor(months / 12); const mo = (months % 12) + 1; return y + "." + (mo < 10 ? "0" + mo : mo); }

// operate gating helpers
export function canOperate(s: GameState, action: string) { return !s.venture || (s.venture.cooldown[action] || 0) <= s.date; }
export function setCooldown(s: GameState, action: string, months: number) { if (s.venture) s.venture.cooldown[action] = s.date + months; }
