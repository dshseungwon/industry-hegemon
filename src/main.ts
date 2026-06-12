import "./style.css";
import { GameState, newGame, Cap, CAPKO } from "./state";
import { tick, recomputeLeaders, strategyProjects, pushLog, clamp, canOperate, setCooldown, npv, irr, waccOf } from "./engine";
import { mount, render, Actions } from "./ui";

const app = document.getElementById("app")!;
let s: GameState = newGame(0);
recomputeLeaders(s);

const stepMs = (sp: number) => sp === 1 ? 1400 : sp === 2 ? 800 : sp === 3 ? 360 : 0;
let timer: number | undefined;
function schedule() {
  if (timer) clearTimeout(timer);
  if (s.speed === 0 || s.ui.over) return;
  timer = window.setTimeout(() => { tick(s); render(s, A); schedule(); }, stepMs(s.speed));
}

const A: Actions = {
  setSpeed(n) { s.speed = n; render(s, A); schedule(); },
  togglePanel(p) { s.ui.panel = s.ui.panel === p ? "none" : p; render(s, A); },
  selectCountry(n) { s.ui.country = n; render(s, A); },
  startStrategy(cap) {
    const p = strategyProjects(s).find(x => x.cap === cap)!;
    s.ui.confirm = {
      title: "전략 실행 — " + p.h,
      lines: [
        "초기 투자(Capex): <b>$" + Math.round(p.capex) + "B</b>",
        "예상 점유율 효과: <b class='gold'>+" + (p.dShare * 100).toFixed(1) + "%p</b>",
        "NPV: <b class='" + (p.npv > 0 ? "gold" : "red") + "'>$" + Math.round(p.npv) + "B</b> · IRR: <b>" + (p.irr != null ? (p.irr * 100).toFixed(0) + "%" : "-") + "</b>",
        "착수하면 시간이 흐르며 진행됩니다. 정말 진행하시겠습니까?",
      ],
      okLabel: "진행",
      onOk: () => {
        if (s.cash < p.capex) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        s.cash -= p.capex;
        s.venture = { name: CAPKO[cap] + " 역량 프로그램", cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} };
        s.ui.confirm = null; s.ui.panel = "projects";
        pushLog(s, "투자 착수: " + p.h);
        render(s, A);
      },
    };
    render(s, A);
  },
  operate(action) {
    if (!s.venture) return;
    if (!canOperate(s, action)) { flash("아직 쿨다운입니다"); return; }
    const v = s.venture;
    if (action === "accel") { if (s.cash < 10) { flash("현금 부족"); return; } s.cash -= 10; v.progress = Math.min(100, v.progress + 14); setCooldown(s, "accel", 2); flash("가속 +14"); }
    else if (action === "risk") { if (v.risk <= 0) { flash("리스크 없음"); return; } v.risk--; setCooldown(s, "risk", 2); flash("리스크 해소"); }
    else if (action === "pivot") { const ks: Cap[] = ["tech", "brand", "scale", "global"]; v.cap = ks[(ks.indexOf(v.cap) + 1) % 4]; v.name = CAPKO[v.cap] + " 역량 프로그램"; setCooldown(s, "pivot", 3); flash("대상 → " + CAPKO[v.cap]); }
    else if (action === "cancel") { s.cash += 15; s.venture = null; flash("취소 — 자금 회수"); }
    render(s, A);
  },
  confirmOk() { const f = s.ui.confirm?.onOk; if (f) f(); },
  confirmCancel() { s.ui.confirm = null; render(s, A); },
  restart() { s = newGame(0); recomputeLeaders(s); render(s, A); schedule(); },
};

function flash(msg: string) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.className = "show"; clearTimeout((t as any)._t); (t as any)._t = setTimeout(() => { t!.className = ""; }, 1100);
}

mount(app, A);
render(s, A);
schedule();
