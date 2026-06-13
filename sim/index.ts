// 밸런스 리포트 CLI — 표준 배터리를 돌려 승률·종료시점·추월시점을 출력한다.
// 실행:
//   npm run sim                         # 기본 배터리(각 기업 무행동/적극 + 강자 추월)
//   npm run sim -- --games=80           # 판수 변경
//   npm run sim -- --you=1 --policy=focused --games=60   # 단일 커스텀 런
import { runMany, policies, crossoverMonth, median, firmNames, GameResult } from "./harness";

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith("--")).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? "true"]; })
);
const GAMES = Number(args.games ?? 40);
const names = firmNames();
const wins = (rs: GameResult[]) => rs.filter(r => r.won).length;
const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);

if (args.you !== undefined || args.policy !== undefined) {
  // 단일 커스텀 런
  const youIdx = Number(args.you ?? 0);
  const policy = policies[String(args.policy ?? "passive")] ?? policies.passive;
  const rs = runMany(GAMES, { youIdx, policy });
  const me = median(rs.map(r => r.youShare)) * 100, rv = median(rs.map(r => r.bestRivalShare)) * 100;
  console.log(`\n${names[youIdx]} · ${args.policy ?? "passive"} · ${GAMES}판`);
  console.log(`  승 ${wins(rs)}/${GAMES}  ·  중앙 종료 ${median(rs.map(r => r.months))}개월  ·  최종 점유율 중앙 ${me.toFixed(1)}% (최강 경쟁사 ${rv.toFixed(1)}%)`);
  process.exit(0);
}

console.log(`\n=== Industry Hegemon 밸런스 리포트 (${GAMES}판/항목) ===`);

console.log(`\n[무행동] 각 기업을 가만히 두면 (승 / 중앙종료 / 최종점유율中):`);
for (let i = 0; i < names.length; i++) {
  const rs = runMany(GAMES, { youIdx: i, policy: policies.passive });
  console.log(`  ${pad(names[i], 9)} 승 ${pad(wins(rs) + "/" + GAMES, 7)} ${pad(median(rs.map(r => r.months)) + "개월", 7)} ${(median(rs.map(r => r.youShare)) * 100).toFixed(0)}%`);
}

console.log(`\n[적극] 각 기업을 focused로 플레이하면:`);
for (let i = 0; i < names.length; i++) {
  const rs = runMany(GAMES, { youIdx: i, policy: policies.focused });
  console.log(`  ${pad(names[i], 9)} 승 ${pad(wins(rs) + "/" + GAMES, 7)} ${pad(median(rs.map(r => r.months)) + "개월", 7)} ${(median(rs.map(r => r.youShare)) * 100).toFixed(0)}%`);
}

console.log(`\n[강자 코스팅] 각 기업을 무행동으로 둘 때 추월당하는 시점(중앙, null=끝까지 1위):`);
for (let i = 0; i < names.length; i++) {
  const xs: number[] = [];
  for (let g = 0; g < GAMES; g++) { const m = crossoverMonth(i); if (m !== null) xs.push(m); }
  console.log(`  ${pad(names[i], 9)} ${xs.length ? median(xs) + "개월 (" + xs.length + "/" + GAMES + "판에서 추월됨)" : "끝까지 1위 유지"}`);
}
console.log("");
