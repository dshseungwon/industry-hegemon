// 업적 — 게임 간 영구(localStorage). 조건은 GameState만 보고 판정(액션 훅 불필요).
// 표시(토스트·배너)는 main이 담당 — 여기서 ui를 import하지 않음(순환 방지).
import { GameState } from "./state";
import { marketCap, myShare, operatingIncome, cbPrincipal } from "./engine";

export interface Achievement { id: string; name: string; desc: string; icon: string; cond: (s: GameState) => boolean; }

const me = (s: GameState) => s.firms[s.youIdx];
const myKey = (s: GameState) => me(s)?.key;
const leadCount = (s: GameState) => s.marketOrder.filter(n => s.markets[n].leader === myKey(s)).length;
const enteredCount = (s: GameState) => { const f = me(s); return f ? s.marketOrder.filter(n => (f.effort[n] || 0) > 0.001 || (f.alloc[n] || 0) > 0).length : 0; };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_lead", name: "첫 깃발", desc: "한 시장에서 1위를 차지하다", icon: "🚩", cond: s => leadCount(s) >= 1 },
  { id: "profit", name: "흑자 전환", desc: "월 영업이익이 플러스가 되다", icon: "💵", cond: s => operatingIncome(s, s.youIdx) > 0 },
  { id: "expand", name: "다국적 기업", desc: "5개 이상의 시장에 진출하다", icon: "🌏", cond: s => enteredCount(s) >= 5 },
  { id: "share30", name: "시장의 강자", desc: "전 세계 점유율 30% 돌파", icon: "📈", cond: s => myShare(s, s.youIdx) >= 0.30 },
  { id: "share50", name: "압도적 우위", desc: "전 세계 점유율 50% 돌파", icon: "🔥", cond: s => myShare(s, s.youIdx) >= 0.50 },
  { id: "trillion", name: "조 단위 클럽", desc: "시가총액 $1,000B(1조) 돌파", icon: "💎", cond: s => marketCap(s, s.youIdx) >= 1000 },
  { id: "activist", name: "주주 행동주의", desc: "경쟁사 지분을 보유하다", icon: "📊", cond: s => s.firms.some(f => f.key !== myKey(s) && (f.blocs || []).some(b => b.owner === myKey(s))) },
  { id: "hybrid", name: "하이브리드 금융가", desc: "전환사채(CB)를 발행하다", icon: "🧬", cond: s => (me(s)?.cbs || []).length > 0 },
  { id: "debtfree", name: "무차입 경영", desc: "무차입(부채·CB 0)으로 점유율 30% 달성", icon: "🏦", cond: s => { const f = me(s); return !!f && f.debt <= 0.01 && cbPrincipal(s, s.youIdx) <= 0.01 && myShare(s, s.youIdx) >= 0.30; } },
  { id: "tycoon", name: "재벌 회장", desc: "창업자 개인 자산 $50B 달성(배당 누적)", icon: "👑", cond: s => (me(s)?.wealth || 0) >= 50 },
  { id: "victory", name: "마감 1위", desc: "마감 시점 점유율 1위로 승리하다", icon: "🏆", cond: s => !!s.ui.over?.won },
  { id: "domination", name: "시장 완전 장악", desc: "전 시장 1위로 세계를 제패하다", icon: "🌐", cond: s => !!s.ui.over?.won && /완전 장악/.test(s.ui.over?.msg || "") },
];

const LS = "ih_achievements";
let cache: Set<string> | null = null;
function load(): Set<string> {
  if (cache) return cache;
  let arr: string[] = [];
  try { arr = JSON.parse(localStorage.getItem(LS) || "[]"); } catch { /* noop */ }
  cache = new Set(Array.isArray(arr) ? arr : []);
  return cache;
}
function persist(set: Set<string>) { try { localStorage.setItem(LS, JSON.stringify([...set])); } catch { /* noop */ } }

export function unlockedIds(): Set<string> { return new Set(load()); }
export function allAchievements(): Achievement[] { return ACHIEVEMENTS; }

// 미해금 중 조건 충족분을 해금·저장하고, 새로 해금된 업적 배열을 반환(표시는 호출측이).
export function checkAchievements(s: GameState): Achievement[] {
  const got = load(); const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (got.has(a.id)) continue;
    let ok = false; try { ok = a.cond(s); } catch { ok = false; }
    if (ok) { got.add(a.id); fresh.push(a); }
  }
  if (fresh.length) persist(got);
  return fresh;
}
