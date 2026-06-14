// 메타데이터 → 게임 시나리오 생성 (임시 브리지).
// ⚠️ 섹터 프리셋은 실제 KSF가 아니라 GICS 섹터별 근사치입니다.
//   다음 단계(daily-industry-report 파이프라인 확장)에서 구조화 KSF/밸류체인/규제 JSON이 나오면
//   buildScenario를 "리포트 JSON → IndustryScenario"로 교체하면 됩니다(나머지 게임은 그대로).
import { Cap, CAPS, IndustryScenario, MarketDef, FirmDef, WORLD_MARKETS, BUILTIN_SCENARIO } from "./state";
import { BriefMeta, reportUrl } from "./reports.data";
import { gameData } from "./gamedata";

// GICS 섹터별 KSF 프리셋(tech/brand/scale/global). 합은 normalize로 맞춤.
const SECTOR_PRESET: Record<string, Partial<Record<Cap, number>>> = {
  "Information Technology":   { tech: .42, brand: .20, scale: .20, global: .18 },
  "Communication Services":   { tech: .30, brand: .26, scale: .22, global: .22 },
  "Consumer Discretionary":   { brand: .40, tech: .20, scale: .20, global: .20 },
  "Consumer Staples":         { brand: .34, scale: .34, global: .22, tech: .10 },
  "Health Care":              { tech: .44, brand: .24, global: .22, scale: .10 },
  "Financials":               { brand: .30, scale: .28, global: .26, tech: .16 },
  "Industrials":              { scale: .38, tech: .30, global: .22, brand: .10 },
  "Materials":                { scale: .48, global: .26, tech: .16, brand: .10 },
  "Energy":                   { scale: .44, global: .26, tech: .20, brand: .10 },
  "Utilities":                { scale: .48, global: .22, tech: .20, brand: .10 },
  "Real Estate":              { scale: .34, brand: .30, global: .22, tech: .14 },
};
const DEFAULT_PRESET: Partial<Record<Cap, number>> = { tech: .25, brand: .25, scale: .25, global: .25 };

// GICS 섹터별 시장 연 성장률(근사) — 산업마다 파이가 자라는 속도가 달라 '템포'가 갈림.
// IT/헬스케어는 빠르게, 유틸리티/에너지/소재는 느리게. tick에서 월율로 환산해 매월 적용.
const SECTOR_GROWTH: Record<string, number> = {
  "Information Technology": .09, "Communication Services": .05, "Consumer Discretionary": .05,
  "Consumer Staples": .03, "Health Care": .07, "Financials": .04, "Industrials": .04,
  "Materials": .03, "Energy": .02, "Utilities": .02, "Real Estate": .03,
};
const DEFAULT_GROWTH = .04;
const monthlyGrowth = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

// 국가별 성향(약한 tilt) — 산업이 같아도 나라마다 KSF가 조금씩 달라 "어디가 약한지" 읽는 재미 유지.
const COUNTRY_TILT: Record<string, Cap> = {
  "United States of America": "brand", "China": "scale", "India": "scale", "Japan": "tech",
  "Germany": "tech", "South Korea": "tech", "Brazil": "scale", "United Kingdom": "global",
  "France": "brand", "Indonesia": "scale", "Mexico": "scale", "Russia": "scale",
};

// 잘 알려진 기업 CI 색(캡 색과 비충돌·지도에서 잘 보이는 밝기). 모르면 역할 팔레트로.
const CI: [string, string][] = [
  ["apple", "#c9ced6"], ["samsung", "#2d6fe0"], ["xiaomi", "#ff6900"], ["lg", "#a50034"],
  ["sk ", "#e2231a"], ["hynix", "#e2231a"], ["hyundai", "#0b65c2"], ["naver", "#03c75a"],
  ["google", "#4285f4"], ["alphabet", "#4285f4"], ["meta", "#0866ff"], ["amazon", "#ff9900"],
  ["netflix", "#e50914"], ["nvidia", "#76b900"], ["intel", "#0071c5"], ["microsoft", "#5db64f"],
  ["toyota", "#eb0a1e"], ["sony", "#c9ced6"], ["disney", "#1f6fed"], ["tesla", "#e82127"],
  ["bhp", "#e35205"], ["pfizer", "#0093d0"], ["jpmorgan", "#0b6fd0"], ["nike", "#cfd4da"],
];
function ciColor(name: string, fallback: string): string {
  const n = (name || "").toLowerCase();
  for (const [k, c] of CI) if (n.includes(k)) return c;
  return fallback;
}
// 한 시나리오 내 세 기업 색이 겹치지 않게 보정(겹치면 역할 팔레트로 교체).
function ensureDistinct(firms: FirmDef[]) {
  const palette = ["#2d8cff", "#ff5a5f", "#ff8a3d", "#c9ced6"];
  const used = new Set<string>();
  for (const f of firms) {
    if (used.has(f.col)) { const alt = palette.find(p => !used.has(p)) || f.col; f.col = alt; }
    used.add(f.col);
  }
}

const KSF_FLOOR = 0.06;   // 어떤 역량도 영향 0이 되지 않게(표시·게임 공통). 바닥을 깔고 정규화.
function normalize(p: Record<Cap, number>): Record<Cap, number> {
  let t = 0; const f = {} as Record<Cap, number>;
  for (const k of CAPS) { f[k] = Math.max(p[k] || 0, KSF_FLOOR); t += f[k]; }
  const out = {} as Record<Cap, number>; for (const k of CAPS) out[k] = t > 0 ? f[k] / t : 0.25; return out;
}
const full = (p: Partial<Record<Cap, number>>): Record<Cap, number> =>
  ({ tech: p.tech || 0, brand: p.brand || 0, scale: p.scale || 0, global: p.global || 0 });
const clamp = (x: number, a: number, b: number) => x < a ? a : x > b ? b : x;
// gics 문자열에서 결정적(재현 가능) 변주값 0..1
const seedOf = (gics: string, salt: number) => {
  let h = salt * 2654435761 >>> 0; for (let i = 0; i < gics.length; i++) h = (h * 31 + gics.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
};

function marketsFor(preset: Record<Cap, number>): MarketDef[] {
  return WORLD_MARKETS.map(m => {
    const p = { ...preset };
    const tilt = COUNTRY_TILT[m.name]; if (tilt) p[tilt] += 0.15;   // 국가 성향 가미
    return { name: m.name, ko: m.ko, size: m.size, pref: normalize(p) };
  });
}

// 역할별 caps: lean>0 이면 KSF에 강함(리더), lean<0 이면 KSF에 약함(언더독 플레이어 → 투자로 메울 갭).
function capsFor(preset: Record<Cap, number>, base: number, lean: number, gics: string, salt: number): Record<Cap, number> {
  const c = {} as Record<Cap, number>;
  for (let i = 0; i < CAPS.length; i++) {
    const k = CAPS[i];
    const jitter = (seedOf(gics, salt + i) - 0.5) * 8;
    c[k] = Math.round(clamp(base + (preset[k] - 0.25) * lean + jitter, 32, 95));
  }
  return c;
}

export function buildScenario(meta: BriefMeta): IndustryScenario {
  const g = meta.gics;
  const gd = gameData(g);   // The Industry Brief 실데이터(런타임 갱신분 우선, 없으면 내장 스냅샷)
  // KSF: 실데이터 가중치 우선, 없으면 섹터 프리셋(임시 브리지)
  const preset = gd ? normalize(full(gd.ksf_weights)) : normalize(full(SECTOR_PRESET[meta.sector] || DEFAULT_PRESET));
  // 경쟁사 이름: 실데이터의 글로벌 pie(리더/도전자) + 한국 1위(플레이어)
  const leaderName = gd?.global_firms?.[0]?.name || meta.global_company;
  const challengerName = gd?.global_firms?.[1]?.name || gd?.global_firms?.[2]?.name || "글로벌 경쟁사";
  // 3사 구도: 한국 1위(플레이어, KSF 갭) / 글로벌 1위(리더, KSF 강함) / 도전자(가성비).
  // 기업 색: CI 알려진 곳은 CI, 아니면 역할별 구분 팔레트(캡 색과 비충돌).
  const firms: FirmDef[] = [
    { key: "you", name: meta.korea_company, col: ciColor(meta.korea_company, "#2d8cff"), ai: "balanced",
      caps: capsFor(preset, 70, -55, g, 10) },
    { key: "global", name: leaderName, col: ciColor(leaderName, "#ff5a5f"), ai: "leader",
      caps: capsFor(preset, 80, 65, g, 40) },
    { key: "challenger", name: challengerName, col: ciColor(challengerName, "#ff8a3d"), ai: "balanced",
      caps: capsFor(preset, 64, 25, g, 70) },   // 산업 KSF 기반의 신빙성 있는 글로벌 경쟁사
  ];
  ensureDistinct(firms);
  return {
    key: "ind-" + g, name: meta.industry_en, ko: meta.industry_ko, sector: meta.sector,
    headline: meta.headline_ko, reportUrl: reportUrl(meta), preset: !gd, real: !!gd,
    markets: marketsFor(preset), firms,
    growth: monthlyGrowth(SECTOR_GROWTH[meta.sector] ?? DEFAULT_GROWTH),
  };
}

// 산업 선택용: 빌트인 기준 시나리오를 맨 앞에 노출하기 위한 가짜 메타(선택지로 보여줌)
export const BUILTIN_META = {
  industry_en: BUILTIN_SCENARIO.name, industry_ko: BUILTIN_SCENARIO.ko, sector: BUILTIN_SCENARIO.sector,
  gics: "000000", global_company: "Apple", korea_company: "Samsung",
  headline_ko: BUILTIN_SCENARIO.headline, file: "",
} as BriefMeta;
