// 헤드리스 검증 — 권위서버에 접속해 실시간 tick과 액션 적용을 확인.
import WebSocket from "ws";
const ws = new WebSocket("ws://localhost:8787");
let last = null, invested = false, dates = [];

ws.on("open", () => console.log("connected"));
ws.on("message", (buf) => {
  const m = JSON.parse(String(buf));
  if (m.type === "welcome") {
    console.log(`welcome: role=${m.role} youIdx=${m.youIdx} players=${m.players} date=${m.world.date} cash=${Math.round(m.world.cash)} speed=${m.world.speed}`);
    ws.send(JSON.stringify({ type: "action", action: { kind: "speed", n: 3 } }));   // 빠르게 진행
  } else if (m.type === "world") {
    last = m.world; dates.push(m.world.date);
    if (m.world.date >= 2 && !invested) {
      invested = true;
      console.log(`tick ok: date advanced to ${m.world.date}, cash=${Math.round(m.world.cash)}`);
      ws.send(JSON.stringify({ type: "action", action: { kind: "invest", cap: "brand" } }));
    } else if (invested && m.world.venture) {
      console.log(`invest ok: venture=${m.world.venture.name} progress=${m.world.venture.progress} cash=${Math.round(m.world.cash)}`);
      ws.send(JSON.stringify({ type: "action", action: { kind: "speed", n: 0 } }));
      console.log("RESULT: PASS — authoritative tick + action applied");
      ws.close(); process.exit(0);
    }
  }
});
ws.on("error", (e) => { console.log("ERROR", e.message); process.exit(1); });
setTimeout(() => { console.log("RESULT: TIMEOUT", { lastDate: last?.date, dates: dates.slice(0, 8) }); process.exit(1); }, 8000);
