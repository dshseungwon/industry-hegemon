export type Cap = "tech" | "brand" | "scale" | "global";
export const CAPS: Cap[] = ["tech", "brand", "scale", "global"];
export const CAPKO: Record<Cap, string> = { tech: "기술", brand: "브랜드", scale: "가성비", global: "글로벌" };
export const WANTIC: Record<Cap, string> = { tech: "🧠", brand: "✨", scale: "🏭", global: "🌐" };

export interface Firm { key: string; name: string; col: string; caps: Record<Cap, number>; ai: string; }
export interface Market { name: string; ko: string; pref: Record<Cap, number>; size: number; leader: string; }
export interface Venture {
  name: string; cap: Cap; payoff: number; progress: number; risk: number;
  cooldown: Record<string, number>; // action -> date it becomes available again
}
export interface Trend { bias: Cap | null; until: number; headline: string; note: string; }
export interface GameState {
  date: number;              // months since start
  speed: 0 | 1 | 2 | 3;      // 0 = paused
  firms: Firm[];
  youIdx: number;
  markets: Record<string, Market>;
  marketOrder: string[];
  cash: number;
  debt: number;
  venture: Venture | null;
  trend: Trend;
  log: string[];
  ui: { panel: string; country: string | null; confirm: ConfirmSpec | null; over: { won: boolean; msg: string } | null };
}
export interface ConfirmSpec { title: string; lines: string[]; okLabel: string; onOk: () => void; }

function full(p: Partial<Record<Cap, number>>): Record<Cap, number> {
  return { tech: p.tech || 0, brand: p.brand || 0, scale: p.scale || 0, global: p.global || 0 };
}

const MARKET_DEFS: { name: string; ko: string; pref: Partial<Record<Cap, number>>; size: number }[] = [
  { name: "United States of America", ko: "미국", pref: { brand: .4, tech: .3, scale: .1, global: .2 }, size: 300 },
  { name: "China", ko: "중국", pref: { scale: .45, tech: .25, brand: .15, global: .15 }, size: 330 },
  { name: "India", ko: "인도", pref: { scale: .55, brand: .15, tech: .15, global: .15 }, size: 170 },
  { name: "Japan", ko: "일본", pref: { brand: .35, tech: .35, scale: .15, global: .15 }, size: 90 },
  { name: "Germany", ko: "독일", pref: { tech: .35, brand: .3, scale: .15, global: .2 }, size: 80 },
  { name: "South Korea", ko: "한국", pref: { tech: .4, brand: .25, scale: .2, global: .15 }, size: 70 },
  { name: "Brazil", ko: "브라질", pref: { scale: .5, brand: .2, tech: .1, global: .2 }, size: 80 },
  { name: "United Kingdom", ko: "영국", pref: { brand: .4, global: .25, tech: .2, scale: .15 }, size: 70 },
  { name: "France", ko: "프랑스", pref: { brand: .4, tech: .2, global: .25, scale: .15 }, size: 65 },
  { name: "Indonesia", ko: "인도네시아", pref: { scale: .55, global: .2, brand: .15, tech: .1 }, size: 75 },
  { name: "Mexico", ko: "멕시코", pref: { scale: .5, global: .2, brand: .2, tech: .1 }, size: 60 },
  { name: "Russia", ko: "러시아", pref: { scale: .4, tech: .2, brand: .2, global: .2 }, size: 60 },
];

const FIRM_DEFS: Firm[] = [
  { key: "you", name: "Samsung", col: "#ffb81c", caps: { tech: 80, brand: 64, scale: 90, global: 70 }, ai: "balanced" },
  { key: "apple", name: "Apple", col: "#5aa9e6", caps: { tech: 82, brand: 95, scale: 70, global: 82 }, ai: "brand" },
  { key: "xiaomi", name: "Xiaomi", col: "#36c98e", caps: { tech: 60, brand: 50, scale: 80, global: 55 }, ai: "scale" },
];

export const CODEX = [
  { t: "NPV", en: "순현재가치", d: "미래 현금흐름을 할인율로 현재가치화해 합산하고 초기 투자를 뺀 값. 0보다 크면 가치를 창출하는 투자입니다." },
  { t: "IRR", en: "내부수익률", d: "NPV를 0으로 만드는 할인율. 자본비용(WACC)보다 높으면 투자할 만합니다." },
  { t: "WACC", en: "가중평균자본비용", d: "부채·자기자본 조달비용의 가중평균. 금리·부채가 오르면 투자의 문턱(할인율)이 높아집니다." },
  { t: "KSF", en: "핵심성공요인", d: "그 시장·시기에 이기기 위해 갖춰야 하는 역량. 나라마다, 시기마다 달라집니다." },
  { t: "가치사슬", en: "Value Chain", d: "부품→제조→유통→고객으로 이어지는 가치 단계. 어디를 장악할지가 전략입니다." },
  { t: "시장점유율", en: "Market Share", d: "전체 시장에서 우리가 차지하는 비중. 승리 기준입니다." },
  { t: "M&A", en: "인수합병", d: "경쟁사를 사들여 역량·점유율을 흡수·제거하는 전략. 비싸고 통합 리스크가 있습니다." },
];

export function newGame(youIdx = 0): GameState {
  const firms = FIRM_DEFS.map(f => ({ ...f, caps: { ...f.caps } }));
  const markets: Record<string, Market> = {};
  const order: string[] = [];
  for (const m of MARKET_DEFS) { markets[m.name] = { name: m.name, ko: m.ko, pref: full(m.pref), size: m.size, leader: "you" }; order.push(m.name); }
  return {
    date: 0, speed: 2, firms, youIdx, markets, marketOrder: order,
    cash: 60, debt: 0, venture: null,
    trend: { bias: null, until: 6, headline: "안정적 시장", note: "수요가 고르게 분포합니다." },
    log: [], ui: { panel: "none", country: null, confirm: null, over: null },
  };
}
