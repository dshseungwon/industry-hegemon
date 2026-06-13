// 산업 인텔 — The Industry Brief 실데이터(KSF·실제 기업·점유율)를 화면에 노출하기 위한 정제·도출 헬퍼.
// + 읽기 보상(코덱스 해금) 상태(localStorage). 게임 경제에는 영향 없음(표시·수집 전용).
import { Cap, CAPS, CAPKO, BUILTIN_SCENARIO } from "./state";
import { gameData } from "./gamedata";
import { BRIEFS } from "./reports.data";

// ---- 기업명 정제: "English한글" 붙은 이름 분리 + 국가명(생산국 표 누출) 감지 ----
const COUNTRY_EN = new Set(["united states", "china", "russia", "saudi arabia", "india", "iran", "iraq", "canada", "brazil", "japan", "germany", "united arab emirates", "kuwait", "norway", "mexico", "qatar", "nigeria", "australia", "south korea", "united kingdom", "france"]);
const COUNTRY_KO = ["미국", "중국", "러시아", "사우디아라비아", "사우디", "인도", "이란", "이라크", "캐나다", "브라질", "일본", "독일", "아랍에미리트", "쿠웨이트", "노르웨이", "멕시코", "카타르", "나이지리아", "호주", "한국", "영국", "프랑스"];
export function cleanFirmName(raw: string): { en: string; ko?: string; isCountry: boolean } {
  const s = (raw || "").trim();
  let en = s, ko: string | undefined;
  const m = s.match(/^([^가-힣]+?)\s*([가-힣].*)$/);   // 라틴 머리 / 한글 꼬리
  if (m) { en = m[1].trim(); ko = m[2].trim(); }
  const low = en.toLowerCase();
  const isCountry = COUNTRY_EN.has(low) || (!!ko && COUNTRY_KO.includes(ko)) || (!en && !!ko && COUNTRY_KO.includes(ko));
  return { en, ko, isCountry };
}

// ---- KSF 정규화/도출 ----
function normalize(p: Record<Cap, number>): Record<Cap, number> {
  let t = 0; for (const k of CAPS) t += p[k] || 0;
  const out = {} as Record<Cap, number>; for (const k of CAPS) out[k] = t > 0 ? (p[k] || 0) / t : 0.25; return out;
}
function isFlat(ksf: Record<Cap, number>): boolean {
  let mn = 1, mx = 0; for (const k of CAPS) { mn = Math.min(mn, ksf[k]); mx = Math.max(mx, ksf[k]); }
  return mx - mn < 0.02;   // 0.25 균등(추출 실패)
}
const WHY: Record<Cap, string> = { tech: "기술 혁신", brand: "브랜드·신뢰", scale: "대량생산 효율(가성비)", global: "글로벌 공급·사업망" };
export function industryWhy(ksf: Record<Cap, number>): string {
  const top = [...CAPS].sort((a, b) => ksf[b] - ksf[a]);
  return CAPKO[top[0]] + "·" + CAPKO[top[1]] + " 중심 — 핵심은 " + WHY[top[0]] + ", " + WHY[top[1]] + ".";
}

export interface TopFirm { en: string; ko?: string; share?: number; }
export interface IndustryIntel {
  gics: string; ko: string; sector: string;
  hasData: boolean;                  // 표시할 만한 KSF가 있나(균등/누락이면 false)
  ksf: Record<Cap, number> | null;
  why: string;
  topFirms: TopFirm[];               // 실제 글로벌 1위 기업(국가·빈 항목 제외, 최대 5)
  koreaFirms: TopFirm[];             // 실제 한국 시장 점유율(있으면)
  market?: { label: string; year: string };
  reportFile?: string;
}

// 빌트인(소비자 전자) KSF = 시장 pref 평균
function builtinKsf(): Record<Cap, number> {
  const sum = { tech: 0, brand: 0, scale: 0, global: 0 } as Record<Cap, number>;
  for (const m of BUILTIN_SCENARIO.markets) for (const k of CAPS) sum[k] += (m.pref[k] || 0);
  return normalize(sum);
}

export function scenarioGics(key: string): string { return key.startsWith("ind-") ? key.slice(4) : "000000"; }

export function industryIntel(gics: string): IndustryIntel {
  if (gics === "000000") {
    const ksf = builtinKsf();
    return {
      gics, ko: BUILTIN_SCENARIO.ko, sector: BUILTIN_SCENARIO.sector, hasData: true, ksf, why: industryWhy(ksf),
      topFirms: BUILTIN_SCENARIO.firms.map(f => ({ en: f.name })), koreaFirms: [], reportFile: "",
    };
  }
  const gd = gameData(gics);
  const meta = BRIEFS.find(b => b.gics === gics);
  const ko = meta?.industry_ko || gd?.industry_ko || gics;
  const sector = meta?.sector || gd?.sector || "";
  if (!gd) return { gics, ko, sector, hasData: false, ksf: null, why: "", topFirms: [], koreaFirms: [], reportFile: meta?.file };
  const ksf = normalize(gd.ksf_weights);
  const flat = isFlat(ksf);
  const toFirms = (arr?: { name: string; ko?: string; share?: number }[]): TopFirm[] => (arr || [])
    .map(f => ({ ...cleanFirmName(f.name), origKo: f.ko, share: f.share }))
    .filter(f => !f.isCountry && f.en)
    .slice(0, 5)
    .map(f => ({ en: f.en, ko: f.ko || f.origKo, share: f.share }));
  return {
    gics, ko, sector, hasData: !flat, ksf: flat ? null : ksf, why: flat ? "" : industryWhy(ksf),
    topFirms: toFirms(gd.global_firms), koreaFirms: toFirms(gd.korea_firms),
    market: gd.market ? { label: gd.market.label, year: gd.market.year } : undefined, reportFile: meta?.file,
  };
}

// ---- 읽기 보상: 해금 상태(localStorage, gics 단위) ----
const LS = "ih_intel";
let cache: Set<string> | null = null;
function load(): Set<string> {
  if (cache) return cache;
  let arr: string[] = [];
  try { arr = JSON.parse(localStorage.getItem(LS) || "[]"); } catch { /* noop */ }
  cache = new Set(Array.isArray(arr) ? arr : []);
  return cache;
}
export function isIntelUnlocked(gics: string): boolean { return load().has(gics); }
export function unlockIntel(gics: string): boolean {   // 신규 해금이면 true
  const s = load(); if (s.has(gics)) return false;
  s.add(gics); try { localStorage.setItem(LS, JSON.stringify([...s])); } catch { /* noop */ }
  return true;
}
export function unlockedGics(): string[] { return [...load()]; }
export function intelTotal(): number { return BRIEFS.length + 1; }   // +1 = 빌트인
