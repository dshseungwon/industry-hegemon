export type Cap = "tech" | "brand" | "scale" | "global";
export const CAPS: Cap[] = ["tech", "brand", "scale", "global"];
export const CAPKO: Record<Cap, string> = { tech: "기술", brand: "브랜드", scale: "가성비", global: "글로벌" };
export const WANTIC: Record<Cap, string> = { tech: "🧠", brand: "✨", scale: "🏭", global: "🌐" };

export interface Firm {
  key: string; name: string; col: string; caps: Record<Cap, number>; ai: string;
  // 플레이어별 경제(멀티: 각 firm이 자기 회사를 독립적으로 운영)
  cash: number; debt: number; distress: number;
  equityRaises: number;             // 유상증자 누적 횟수 — 증자할수록 금액 체감 + 신용 부담↑
  ventures: Venture[];              // 동시 진행 내부개발(역량별 최대 1개)
  cooldowns: Record<string, number>; tech: string[];
  home: string;                     // 본진(HQ) 시장명 — 자원 전송의 출발지
  alloc: Record<string, number>;    // 시장명 -> 자원 할당 목표(0~ALLOC_MAX). 0이면 철수(영향력 0으로 감소).
  effort: Record<string, number>;   // 시장명 -> 현재 배치된 영향력. 매월 alloc 쪽으로 램프(전개 지연).
  capacity: number;          // 본국(home) 생산능력($B-output). 실현 점유율을 게이트(생산 못 하면 점유 못 함) + 고정비 driver.
  capacityTarget: number;    // 증설 주문분. 매월 capacity가 target으로 램프(증설 지연).
  // 지분구조(cap table): 합=1. ownership(창업자) + float(분산 FI/공모, 수동) + Σblocs(집중 SI). 경영권=ownership≥ΣSI & ≥FOUNDER_FLOOR.
  ownership: number;         // 창업자(나) 지분(0~1, 시작 1.0).
  float: number;             // 분산 재무적투자자(FI)·공모 지분 — 수동(공동행동 안 함). 시작 0.
  blocs: { name: string; stake: number }[];  // 집중 전략적투자자(SI) 블록들. 시작 [].
  auto: boolean;             // true = AI가 운영, false = 사람(플레이어/원격)이 조종
}
export interface Market { name: string; ko: string; pref: Record<Cap, number>; size: number; leader: string; }

// 한 산업의 게임 시나리오 — 파이프라인(daily-industry-report 확장) 출력 계약.
// 지금은 scenario.ts가 섹터 프리셋으로 생성(임시 브리지). 나중에 리포트 JSON에서 직접 구성.
export interface MarketDef { name: string; ko: string; pref: Partial<Record<Cap, number>>; size: number; }
export interface FirmDef { key: string; name: string; col: string; caps: Record<Cap, number>; ai: string; }
export interface IndustryScenario {
  key: string; name: string; ko: string; sector: string;
  headline: string; reportUrl: string;
  preset: boolean;                 // true = 섹터 프리셋(임시), false = 손튜닝/실데이터
  real?: boolean;                  // true = The Industry Brief 실데이터(KSF·경쟁사) 사용
  markets: MarketDef[];
  firms: FirmDef[];                // [0]은 기본 플레이어 후보(보통 한국 1위)
  growth?: number;                 // 시장 월 성장률(실 CAGR 우선, 없으면 섹터 근사). tick에서 매월 적용.
  sizeFactor?: number;             // 실제 시장규모(trillion_usd) 기반 파이 스케일(프론티어에도 적용).
}
export interface Venture {
  name: string; cap: Cap; payoff: number; progress: number; risk: number;
  cooldown: Record<string, number>; // action -> date it becomes available again
}
export interface Trend { bias: Cap | null; until: number; headline: string; note: string; }
export interface GameEvent { title: string; note: string; id: number; icon: string; }
export interface ScenarioMeta { key: string; name: string; ko: string; sector: string; headline: string; reportUrl: string; preset: boolean; real?: boolean; growth?: number; }
export interface GameState {
  date: number;              // months since start
  speed: 0 | 1 | 2 | 3;      // 0 = paused
  scenario: ScenarioMeta;    // 선택한 산업(브리프) 정보
  firms: Firm[];
  youIdx: number;
  markets: Record<string, Market>;
  marketOrder: string[];
  trend: Trend;
  event: GameEvent;          // 최신 세계 흐름 이벤트(트렌드·규제 변화) — id가 바뀌면 큰 토스트
  log: string[];
  fx: string[];              // 이번 tick에 발생한 연출/효과음 이벤트(main이 비움)
  ui: { panel: string; leftPanel: string; country: string | null; confirm: ConfirmSpec | null; over: GameOver | null };
}
export interface GameOver { won: boolean; msg: string; winnerKey?: string; }
export interface ConfirmSpec { title: string; lines: string[]; okLabel: string; onOk: () => void; cancelLabel?: string; onCancel?: () => void; }

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

const FIRM_DEFS: FirmDef[] = [
  // 기업 색은 CI 참고(캡 색과 비충돌): Samsung 블루 / Apple 실버 / Xiaomi 오렌지
  { key: "you", name: "Samsung", col: "#2d6fe0", caps: { tech: 80, brand: 64, scale: 90, global: 70 }, ai: "balanced" },
  { key: "apple", name: "Apple", col: "#c9ced6", caps: { tech: 82, brand: 95, scale: 70, global: 82 }, ai: "brand" },
  { key: "xiaomi", name: "Xiaomi", col: "#ff6900", caps: { tech: 60, brand: 50, scale: 80, global: 55 }, ai: "scale" },
];

// 공유 지리(세계지도). 산업마다 동일 국가·규모, KSF(pref)만 산업별로 달라짐. scenario.ts가 사용.
export const WORLD_MARKETS: { name: string; ko: string; size: number }[] =
  MARKET_DEFS.map(m => ({ name: m.name, ko: m.ko, size: m.size }));

// 프론티어(미진출) 시장 — 닫힌 채 시작, 해외진출로 개척. 모든 시나리오 공통.
export const FRONTIER_GEO: { name: string; ko: string; size: number }[] = [
  { name: "Canada", ko: "캐나다", size: 55 },
  { name: "Australia", ko: "호주", size: 50 },
  { name: "Saudi Arabia", ko: "사우디", size: 60 },
  { name: "Vietnam", ko: "베트남", size: 55 },
  { name: "Nigeria", ko: "나이지리아", size: 45 },
  { name: "Turkey", ko: "튀르키예", size: 45 },
];

// 빌트인 기준 시나리오 — 손수 밸런스 튜닝된 "소비자 전자/스마트폰"(로드맵 #1 검증 완료). preset=false.
export const BUILTIN_SCENARIO: IndustryScenario = {
  key: "consumer-electronics", name: "Consumer Electronics", ko: "소비자 전자·스마트폰",
  sector: "Information Technology",
  headline: "프리미엄·가성비·기술이 맞붙는 글로벌 스마트폰 패권전.",
  reportUrl: "https://dshseungwon.github.io/daily-industry-report/",
  preset: false, markets: MARKET_DEFS, firms: FIRM_DEFS, growth: 0.0072,   // IT ≈ 연 9% → 월 0.72%
};

export const CODEX = [
  { t: "NPV", en: "순현재가치", d: "미래 현금흐름을 할인율로 현재가치화해 합산하고 초기 투자를 뺀 값. 0보다 크면 가치를 창출하는 투자입니다." },
  { t: "IRR", en: "내부수익률", d: "NPV를 0으로 만드는 할인율. 자본비용(WACC)보다 높으면 투자할 만합니다." },
  { t: "WACC", en: "가중평균자본비용", d: "부채·자기자본 조달비용의 가중평균. 금리·부채가 오르면 투자의 문턱(할인율)이 높아집니다." },
  { t: "KSF", en: "핵심성공요인", d: "그 시장·시기에 이기기 위해 갖춰야 하는 역량. 나라마다, 시기마다 달라집니다." },
  { t: "가치사슬", en: "Value Chain", d: "부품→제조→유통→고객으로 이어지는 가치 단계. 어디를 장악할지가 전략입니다." },
  { t: "시장점유율", en: "Market Share", d: "전체 시장에서 우리가 차지하는 비중. 승리 기준입니다." },
  { t: "M&A", en: "인수합병", d: "경쟁사를 사들여 시장에서 제거하는 전략. 그 점유율이 남은 기업에 재분배됩니다. 역량은 합쳐지지 않고(통합 리스크), 비쌉니다." },
];

// 시작 기반 영향력 시딩용 적합도(engine.gcap/matchScore와 동일식; 순환 import 방지 위해 로컬 복제).
const _gcap = (c: number) => Math.pow(Math.max(0, Math.min(100, c)) / 100, 0.7) * 100;
const _fit = (caps: Record<Cap, number>, pref: Record<Cap, number>) => { let s = 0; for (const k of CAPS) s += (pref[k] || 0) * _gcap(caps[k]); return s; };
const INCUMBENCY = 1.0;   // 적합도 1위 기업이 받는 추가 기반 영향력(단계). 0이면 모두 균일하게 1단계로 시작.
                          // 1.0이면 시장별 최강 기업이 영향력 2.0, 최약 1.0으로 시작(점유율↑=기반 영향력↑).

export function newGame(scenario: IndustryScenario = BUILTIN_SCENARIO, youIdx = 0): GameState {
  const homePref = ["South Korea", "United States of America", "China", "Japan", "Germany", "India"];
  const mpref: Record<string, Record<Cap, number>> = {};
  for (const m of scenario.markets) mpref[m.name] = full(m.pref);
  const firms: Firm[] = scenario.firms.map((f, i) => {
    const home = scenario.markets.find(m => m.name === homePref[i])?.name || scenario.markets[i % scenario.markets.length].name;
    return { ...f, caps: { ...f.caps }, cash: 60, debt: 0, distress: 0, equityRaises: 0, ventures: [], cooldowns: {}, tech: [], home, alloc: {}, effort: {}, capacity: 0, capacityTarget: 0, ownership: 1, float: 0, blocs: [], auto: i !== youIdx };
  });
  // 기반 영향력: 시장마다 기업 적합도를 구해, 상대 우위(0~1)만큼 시작 할당/영향력을 1→1+INCUMBENCY로.
  // → 적합도가 높아 점유율이 높을 기업은 base 영향력도 더 큰 상태로 시작(약체는 1단계 유지·유지비 0).
  for (const m of scenario.markets) {
    const fits = firms.map(f => _fit(f.caps, mpref[m.name]));
    const mn = Math.min(...fits), mx = Math.max(...fits);
    firms.forEach((f, i) => {
      const r = mx > mn ? (fits[i] - mn) / (mx - mn) : 0;   // 0(최약)~1(최강)
      const lvl = 1 + INCUMBENCY * r;
      f.effort[m.name] = lvl;                       // 시작 영향력 = 강할수록 큼(부드러운 단계, 바에 바로 보임)
      f.alloc[m.name] = Math.max(1, Math.round(lvl)); // 할당(유지비)은 반올림 단계 — 약체는 1(유지비 0)로 부담 없이 시작
    });
  }
  // 본진 시드: 각 기업은 시작부터 자국(home) 시장에서 1위 — 현지 챔피언(예: 한국=KT) 실 점유율 반영.
  // 영구 배수가 아니라 '시작 영향력' 시드라 장기 밸런스 영향은 작다(이후 투자로 지켜야 함).
  const BETA = 6;   // engine SHARE_BETA와 동일(점유율 민감도)
  for (let i = 0; i < firms.length; i++) {
    const f = firms[i], hm = f.home; if (!hm || !mpref[hm]) continue;
    const w6 = (caps: Record<Cap, number>) => Math.pow(_fit(caps, mpref[hm]), BETA);
    let maxRival = 0;
    for (let j = 0; j < firms.length; j++) if (j !== i) maxRival = Math.max(maxRival, w6(firms[j].caps) * (firms[j].effort[hm] || 1));
    const need = Math.min(40, (maxRival * 1.5) / (w6(f.caps) || 1));   // 라이벌 최고치보다 50% 높게(상한 40)
    if ((f.effort[hm] || 0) < need) {
      f.effort[hm] = need;
      f.alloc[hm] = Math.min(6, Math.max(f.alloc[hm] || 1, Math.round(Math.min(need, 6))));   // 유지되도록 alloc도(상한 6)
    }
  }
  const youKey = firms[youIdx].key;
  const markets: Record<string, Market> = {};
  const order: string[] = [];
  for (const m of scenario.markets) { markets[m.name] = { name: m.name, ko: m.ko, pref: mpref[m.name], size: m.size, leader: youKey }; order.push(m.name); }
  // 프론티어 시장: s.markets에는 넣되 marketOrder엔 넣지 않음(닫힘) — 해외진출 시 개방. 산업 규모 factor 동일 적용.
  const sf = scenario.sizeFactor ?? 1;
  for (const f of FRONTIER_GEO) { if (!markets[f.name]) markets[f.name] = { name: f.name, ko: f.ko, pref: full({ tech: .25, brand: .25, scale: .25, global: .25 }), size: Math.round(f.size * sf), leader: youKey }; }
  // 시작 생산능력 = 시작 자연점령규모 × 여유(현실 가동률 ~77%). 초반 투자 점프를 흡수해 강제 증설 압박 완화.
  // engine.capturedSize와 동일식을 로컬 계산(순환 import 방지).
  const CAP_HEADROOM = 1.3;
  for (const fi of firms) {
    let cap = 0;
    for (const n of order) {
      const pr = mpref[n]; let tot = 0, mine = 0;
      for (const o of firms) { const w = Math.pow(_fit(o.caps, pr), BETA) * (o.effort[n] || 0); tot += w; if (o === fi) mine = w; }
      if (tot > 0) cap += markets[n].size * (mine / tot);
    }
    fi.capacity = fi.capacityTarget = Math.round(cap * CAP_HEADROOM);
  }
  return {
    date: 0, speed: 0,    // 일시정지 상태로 시작 — 시장을 살핀 뒤 ▶로 시작
    scenario: { key: scenario.key, name: scenario.name, ko: scenario.ko, sector: scenario.sector, headline: scenario.headline, reportUrl: scenario.reportUrl, preset: scenario.preset, real: scenario.real, growth: scenario.growth },
    firms, youIdx, markets, marketOrder: order,
    trend: { bias: null, until: 6, headline: "안정적 시장", note: "수요가 고르게 분포합니다." },
    event: { title: "", note: "", id: 0, icon: "" },
    log: [], fx: [], ui: { panel: "none", leftPanel: "company", country: null, confirm: null, over: null },
  };
}
