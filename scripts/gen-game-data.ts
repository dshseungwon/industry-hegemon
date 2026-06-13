// 자매 레포(daily-industry-report)의 클린 game_data.json을 기존 src/game.data.ts에 병합해
// 내장 스냅샷을 갱신한다(런타임 fetch와 별개 — 오프라인 기본값을 최신화·커밋용).
// - 클린 데이터가 있는 산업: global_firms(실 점유율·정제 이름) 교체 + korea_firms 추가.
// - ksf_weights: 기존 값 유지(회귀 방지). 기존에 없던 신규 산업만 클린 ksf 사용.
// 데이터 출처: 로컬 ../daily-industry-report/game_data.json 우선, 없으면 발행 URL fetch.
// 실행: npm run gen:data
import { GAME_DATA } from "../src/game.data";
import { readFileSync, writeFileSync, existsSync } from "fs";

const LOCAL = "../daily-industry-report/game_data.json";
const URL = "https://dshseungwon.github.io/daily-industry-report/game_data.json";
let sister: Record<string, any>;
if (existsSync(LOCAL)) { sister = JSON.parse(readFileSync(LOCAL, "utf8")); console.log("출처: 로컬", LOCAL); }
else {
  const r = await fetch(URL, { cache: "no-cache" });
  if (!r.ok) { console.error("발행본 fetch 실패:", r.status); process.exit(1); }
  sister = await r.json(); console.log("출처: 발행 URL", URL);
}

const merged: Record<string, any> = {};
for (const [g, b] of Object.entries(GAME_DATA as Record<string, any>)) merged[g] = { ...b };

let enriched = 0;
for (const [g, e] of Object.entries(sister)) {
  const base = merged[g] || {};
  merged[g] = {
    gics: g,
    industry_en: e.industry_en || base.industry_en || "",
    industry_ko: e.industry_ko || base.industry_ko || "",
    sector: e.sector || base.sector || "",
    ksf_weights: base.ksf_weights || e.ksf_weights,   // 기존 유지(회귀 방지), 없으면 클린
    global_company: e.global_company || base.global_company || "",
    korea_company: e.korea_company || base.korea_company || "",
    global_firms: e.global_firms || base.global_firms || [],   // 클린(실 점유율)으로 교체
    korea_firms: e.korea_firms || undefined,
    market: e.market || undefined,
    cagr: e.cagr || undefined,
  };
  enriched++;
}

// gics 정렬 후 직렬화
const ordered: Record<string, any> = {};
for (const g of Object.keys(merged).sort()) {
  const v = merged[g];
  const clean: any = {};
  for (const k of ["gics", "industry_en", "industry_ko", "sector", "ksf_weights", "global_company", "korea_company", "global_firms", "korea_firms", "market", "cagr"])
    if (v[k] !== undefined) clean[k] = v[k];
  ordered[g] = clean;
}

const header = `// 자동 생성 스냅샷 — The Industry Brief 실데이터(KSF + 실제 글로벌/한국 점유율 + 시장규모).
// 출처: daily-industry-report/game_data.json (build/game_data.py가 리포트 D딕트에서 추출).
// 재생성: 자매 레포에서 game_data.py 실행 후 \`npm run gen:data\`.
import { Cap } from "./state";
export interface GameFirm { name: string; ko?: string; share: number; }
export interface GameData {
  gics: string; industry_en: string; industry_ko: string; sector: string;
  ksf_weights: Record<Cap, number>;
  global_company: string; korea_company: string;
  global_firms: GameFirm[];
  korea_firms?: GameFirm[];                 // 실제 한국 시장 점유율(있으면)
  market?: { label: string; trillion_usd: number; year: string };
  cagr?: string;
}
export const GAME_DATA: Record<string, GameData> = `;

writeFileSync("src/game.data.ts", header + JSON.stringify(ordered, null, 2) + ";\n");
console.log(`game.data.ts 생성: 총 ${Object.keys(ordered).length}개 산업, 클린 병합 ${enriched}개`);
