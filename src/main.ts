import "./style.css";
import { GameState, newGame, Cap, CAPKO, IndustryScenario, BUILTIN_SCENARIO } from "./state";
import { tick, recomputeLeaders, strategyProjects, pushLog, canOperate, setCooldown, acquireTargets, doAcquire, raiseDebt as engineRaiseDebt, lobbyCost, doLobby, canAct, setActCooldown, TECH_NODES, doResearch, entryCost, doEnter, myShare } from "./engine";
import { mountGame, render, renderTitle, renderIndustry, renderCompany, Actions } from "./ui";
import { BriefMeta } from "./reports.data";
import { buildScenario, BUILTIN_META } from "./scenario";
import { sfx, unlockAudio, startBgm } from "./audio";

const app = document.getElementById("app")!;

// 앱 단계: 인게임 전에는 GameState가 없음. 시나리오를 고른 뒤 newGame으로 생성.
type Phase = "title" | "industry" | "company" | "game";
let phase: Phase = "title";
let pickedScenario: IndustryScenario | null = null;
let s: GameState | null = null;

const stepMs = (sp: number) => sp === 1 ? 1400 : sp === 2 ? 800 : sp === 3 ? 360 : 0;
let timer: number | undefined;
function drainFx() { if (!s) return; for (const e of s.fx) sfx(e); s.fx = []; }
let wasCrisis = false;
function crisisCheck() {
  if (!s) return;
  const sh = myShare(s);
  if (sh < 0.10 && !wasCrisis) { wasCrisis = true; flash("⚠️ 위기 — 점유율 10% 미만! 전략을 재정비하세요"); sfx("lost"); }
  else if (sh > 0.13 && wasCrisis) { wasCrisis = false; }   // 히스테리시스(반복 경고 방지)
}
function schedule() {
  if (timer) clearTimeout(timer);
  if (phase !== "game" || !s || s.speed === 0 || s.ui.over) return;
  timer = window.setTimeout(() => { tick(s!); render(s!, A); drainFx(); crisisCheck(); schedule(); }, stepMs(s.speed));
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
  wasCrisis = false;
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
  togglePanel(p) {
    if (!s) return;
    if (p === "company") s.ui.leftPanel = s.ui.leftPanel === p ? "none" : p;   // 기업 내부는 왼쪽 드로어(독립)
    else s.ui.panel = s.ui.panel === p ? "none" : p;
    sfx("click"); render(s, A);
  },
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
  acquire(rivalKey) {
    if (!s) return;
    const t = acquireTargets(s).find(x => x.key === rivalKey); if (!t) return;
    s.ui.confirm = {
      title: "M&A — " + t.name + " 인수",
      lines: [
        "인수가: <b>$" + Math.round(t.price) + "B</b> (보유 현금 $" + Math.round(s.cash) + "B)",
        "효과: 각 역량을 <b>더 높은 값으로 흡수</b>하고 <b>경쟁자를 제거</b>합니다.",
        "남은 경쟁사를 모두 인수하면 시장을 완전 장악합니다. 진행할까요?",
      ],
      okLabel: "인수",
      onOk: () => {
        if (!s) return;
        if (s.cash < t.price) { s.ui.confirm = null; flash("현금이 부족합니다 — 재무에서 자금 조달"); render(s, A); return; }
        s.cash -= t.price; doAcquire(s, rivalKey); s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  raiseDebt() {
    if (!s) return;
    const amt = 40;
    s.ui.confirm = {
      title: "재무 — 부채 조달",
      lines: [
        "조달: <b>+$" + amt + "B</b> 현금 (부채 +$" + amt + "B)",
        "월 이자(연 5%)가 나가고, 부채가 늘면 <b>WACC(할인율)</b>가 올라 투자 문턱이 높아집니다.",
        "진행할까요?",
      ],
      okLabel: "조달",
      onOk: () => { if (!s) return; engineRaiseDebt(s, amt); s.ui.confirm = null; sfx("select"); render(s, A); },
    };
    render(s, A);
  },
  lobby(marketName) {
    if (!s) return;
    if (!canAct(s, "lobby:" + marketName)) { flash("아직 쿨다운입니다"); return; }
    const cost = lobbyCost(s, marketName);
    if (s.cash < cost) { flash("현금이 부족합니다"); return; }
    const m = s.markets[marketName];
    s.ui.confirm = {
      title: "로비 — " + m.ko,
      lines: [
        "비용: <b>$" + cost + "B</b>",
        "이 시장의 <b>KSF(소비자 선호)</b>를 우리의 최강 역량 쪽으로 끌어옵니다 — 적합도↑.",
        "규제·표준에 영향을 주는 정치 행위입니다. 진행할까요?",
      ],
      okLabel: "로비",
      onOk: () => {
        if (!s) return;
        if (s.cash < cost) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        s.cash -= cost; doLobby(s, marketName); setActCooldown(s, "lobby:" + marketName, 5);
        recomputeLeaders(s); s.ui.confirm = null; sfx("select"); render(s, A);
      },
    };
    render(s, A);
  },
  research(key) {
    if (!s) return;
    const n = TECH_NODES.find(x => x.key === key); if (!n) return;
    if (s.tech.includes(key)) return;
    if (s.cash < n.cost) { flash("현금이 부족합니다"); return; }
    s.ui.confirm = {
      title: "테크 개발 — " + n.name,
      lines: [ "비용: <b>$" + n.cost + "B</b>", n.desc, "한 번 개발하면 영구적입니다. 진행할까요?" ],
      okLabel: "개발",
      onOk: () => {
        if (!s) return;
        if (s.cash < n.cost) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        s.cash -= n.cost; doResearch(s, key); s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  enter(marketName) {
    if (!s) return;
    if (s.marketOrder.includes(marketName)) return;
    const cost = entryCost(s, marketName); const m = s.markets[marketName];
    if (s.cash < cost) { flash("현금이 부족합니다 — 재무에서 자금 조달"); return; }
    s.ui.confirm = {
      title: "해외진출 — " + m.ko,
      lines: [
        "진입장벽 돌파 비용: <b>$" + cost + "B</b> (규모 $" + m.size + "B)",
        "신규 시장을 <b>우리 강점 KSF로 형성</b>해 선점합니다.",
        "전체 시장이 커지니 점유율 관리 부담도 함께 늘어납니다. 진행할까요?",
      ],
      okLabel: "진출",
      onOk: () => {
        if (!s) return;
        if (s.cash < cost) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        s.cash -= cost; doEnter(s, marketName); s.ui.confirm = null; sfx("conquer"); render(s, A);
      },
    };
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

// 브라우저 정책: 첫 사용자 제스처에 오디오 언락 + 배경음악 시작
document.addEventListener("pointerdown", () => { unlockAudio(); startBgm(); }, { once: true });
paint();
