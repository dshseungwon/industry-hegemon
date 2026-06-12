import "./style.css";
import { GameState, newGame, Cap, CAPKO, IndustryScenario, BUILTIN_SCENARIO } from "./state";
import { tick, recomputeLeaders, strategyProjects, pushLog, canOperate, setCooldown } from "./engine";
import { mountGame, render, renderTitle, renderIndustry, renderCompany, Actions } from "./ui";
import { BriefMeta } from "./reports.data";
import { buildScenario, BUILTIN_META } from "./scenario";
import { sfx, unlockAudio } from "./audio";

const app = document.getElementById("app")!;

// 앱 단계: 인게임 전에는 GameState가 없음. 시나리오를 고른 뒤 newGame으로 생성.
type Phase = "title" | "industry" | "company" | "game";
let phase: Phase = "title";
let pickedScenario: IndustryScenario | null = null;
let s: GameState | null = null;

const stepMs = (sp: number) => sp === 1 ? 1400 : sp === 2 ? 800 : sp === 3 ? 360 : 0;
let timer: number | undefined;
function drainFx() { if (!s) return; for (const e of s.fx) sfx(e); s.fx = []; }
function schedule() {
  if (timer) clearTimeout(timer);
  if (phase !== "game" || !s || s.speed === 0 || s.ui.over) return;
  timer = window.setTimeout(() => { tick(s!); render(s!, A); drainFx(); schedule(); }, stepMs(s.speed));
}

function paint() {
  if (phase === "title") renderTitle(app, A);
  else if (phase === "industry") renderIndustry(app, A);
  else if (phase === "company") renderCompany(app, pickedScenario!, A);
  else if (phase === "game" && s) render(s, A);
}

function startGame(youIdx: number) {
  s = newGame(pickedScenario!, youIdx);
  recomputeLeaders(s);
  phase = "game";
  mountGame(app, A);   // 인게임 DOM 재구성
  render(s, A);
  schedule();
}

const A: Actions = {
  // ----- 사전 화면 흐름 -----
  toTitle() { if (timer) clearTimeout(timer); phase = "title"; s = null; pickedScenario = null; sfx("click"); paint(); },
  toIndustry() { unlockAudio(); if (timer) clearTimeout(timer); phase = "industry"; s = null; sfx("select"); paint(); },
  pickIndustry(meta: BriefMeta) {
    pickedScenario = meta.gics === BUILTIN_META.gics ? BUILTIN_SCENARIO : buildScenario(meta);
    phase = "company"; sfx("select"); paint();
  },
  pickCompany(youIdx: number) { sfx("invest"); startGame(youIdx); },

  // ----- 인게임 -----
  setSpeed(n) { if (!s) return; s.speed = n; sfx("click"); render(s, A); schedule(); },
  togglePanel(p) { if (!s) return; s.ui.panel = s.ui.panel === p ? "none" : p; sfx("click"); render(s, A); },
  selectCountry(n) { if (!s) return; s.ui.country = n; if (n) sfx("click"); render(s, A); },
  startStrategy(cap) {
    if (!s) return;
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
        if (!s) return;
        if (s.cash < p.capex) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        s.cash -= p.capex;
        s.venture = { name: CAPKO[cap] + " 역량 프로그램", cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} };
        s.ui.confirm = null; s.ui.panel = "projects";
        pushLog(s, "투자 착수: " + p.h);
        sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  operate(action) {
    if (!s || !s.venture) return;
    if (!canOperate(s, action)) { flash("아직 쿨다운입니다"); return; }
    const v = s.venture;
    if (action === "accel") { if (s.cash < 10) { flash("현금 부족"); return; } s.cash -= 10; v.progress = Math.min(100, v.progress + 14); setCooldown(s, "accel", 2); flash("가속 +14"); sfx("accel"); }
    else if (action === "risk") { if (v.risk <= 0) { flash("리스크 없음"); return; } v.risk--; setCooldown(s, "risk", 2); flash("리스크 해소"); sfx("select"); }
    else if (action === "pivot") { const ks: Cap[] = ["tech", "brand", "scale", "global"]; v.cap = ks[(ks.indexOf(v.cap) + 1) % 4]; v.name = CAPKO[v.cap] + " 역량 프로그램"; setCooldown(s, "pivot", 3); flash("대상 → " + CAPKO[v.cap]); sfx("select"); }
    else if (action === "cancel") { s.cash += 15; s.venture = null; flash("취소 — 자금 회수"); sfx("cancel"); }
    render(s, A);
  },
  confirmOk() { const f = s?.ui.confirm?.onOk; if (f) f(); },
  confirmCancel() { if (!s) return; s.ui.confirm = null; render(s, A); },
  restart() { if (!pickedScenario) { A.toTitle(); return; } startGame(s ? s.youIdx : 0); },
};

function flash(msg: string) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.className = "show"; clearTimeout((t as any)._t); (t as any)._t = setTimeout(() => { t!.className = ""; }, 1100);
}

// 브라우저 정책: 첫 사용자 제스처에 오디오 컨텍스트 언락
document.addEventListener("pointerdown", () => unlockAudio(), { once: true });
paint();
