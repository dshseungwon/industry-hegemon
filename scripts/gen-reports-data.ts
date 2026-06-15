// 자매 레포(daily-industry-report)의 reports.json → src/reports.data.ts(BRIEFS) 재생성.
// gics별 최신 리포트만 유지, gics 오름차순(=섹터 그룹) 정렬. 산업 선택 메뉴가 이 BRIEFS로 채워진다.
// 데이터 출처: 로컬 ../daily-industry-report/reports.json 우선, 없으면 raw URL fetch.
// 실행: npm run gen:reports
import { readFileSync, writeFileSync, existsSync } from "fs";

const LOCAL = "../daily-industry-report/reports.json";
const URL = "https://raw.githubusercontent.com/dshseungwon/daily-industry-report/main/reports.json";
let reports: any[];
if (existsSync(LOCAL)) { reports = JSON.parse(readFileSync(LOCAL, "utf8")); console.log("출처: 로컬", LOCAL); }
else {
  const r = await fetch(URL, { cache: "no-cache" });
  if (!r.ok) { console.error("reports.json fetch 실패:", r.status); process.exit(1); }
  reports = await r.json(); console.log("출처: URL", URL);
}

const latest: Record<string, any> = {};
for (const e of reports) if (!latest[e.gics] || e.date > latest[e.gics].date) latest[e.gics] = e;

const briefs = Object.values(latest)
  .sort((a: any, b: any) => (a.gics < b.gics ? -1 : a.gics > b.gics ? 1 : 0))
  .map((e: any) => ({
    industry_en: e.industry_en || "", industry_ko: e.industry_ko || "", sector: e.sector || "",
    gics: e.gics, global_company: e.global_company || "", korea_company: e.korea_company || "",
    headline_ko: e.headline_ko || "", file: e.file || "",
  }));

const header = `// 자동 생성 스냅샷 — The Industry Brief 메타데이터 (dshseungwon/daily-industry-report).
// 출처: https://raw.githubusercontent.com/dshseungwon/daily-industry-report/main/reports.json
// gics별 최신 리포트만 유지(gics 오름차순). 갱신: \`npm run gen:reports\`.
export interface BriefMeta {
  industry_en: string; industry_ko: string; sector: string; gics: string;
  global_company: string; korea_company: string; headline_ko: string; file: string;
}
export const REPORT_BASE = "https://dshseungwon.github.io/daily-industry-report/";
export const reportUrl = (m: BriefMeta) => REPORT_BASE + m.file;
export const BRIEFS: BriefMeta[] = `;

writeFileSync("src/reports.data.ts", header + JSON.stringify(briefs, null, 2) + ";\n");
console.log(`reports.data.ts 생성: ${briefs.length}개 산업(메뉴)`);
