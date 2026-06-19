import "./style.css";
import { GameState, newGame, Cap, CAPKO, IndustryScenario, BUILTIN_SCENARIO } from "./state";
import { tick, recomputeLeaders, strategyProjects, pushLog, canOperate, setCooldown, acquireTargets, doAcquire, raiseDebt as engineRaiseDebt, lobbyCost, doLobby, canAct, setActCooldown, TECH_NODES, doResearch, myShare, dateLabel, END_DAYS, borrowRoom, creditRating, debtRate, setAlloc, doEnter, entryCost, isOpen, insolvent, raiseEquity as engineRaiseEquity, emergencyLoan as engineEmergencyLoan, emergencyAusterity, liquidateVentures, capacityCapex, buildCapacity as engineBuildCapacity, naturalCaptured, equityRaiseBy, buyStake as engineBuyStake, issueCB as engineIssueCB, startInitiative as engineStartInitiative } from "./engine";
import { initiativeById } from "./initiatives";
import { mountGame, render, renderTitle, renderIndustry, renderCompany, renderClaim, renderLobby, lobbyError, setRoomBadge, showEventBanner, renderGlobalMute, openRaiseModal, openStakeModal, openCBModal, Actions } from "./ui";
import { saveGame, loadGameRaw, clearSave } from "./save";
import { checkAchievements } from "./achievements";
import { BriefMeta } from "./reports.data";
import { buildScenario, BUILTIN_META } from "./scenario";
import { unlockIntel, industryIntel, scenarioGics } from "./intel";
import { refreshGameData } from "./gamedata";
import { startTutorial, endTutorial, tutorialIsPractice } from "./tutorial";
import { sfx, unlockAudio, startBgm, setBgmMood } from "./audio";
import { connect, defaultUrl, NetClient, RosterEntry } from "./net";

const app = document.getElementById("app")!;

// 앱 단계: 인게임 전에는 GameState가 없음. 시나리오를 고른 뒤 newGame으로 생성.
type Phase = "title" | "lobby" | "industry" | "company" | "claim" | "game";
let phase: Phase = "title";
let pickedScenario: IndustryScenario | null = null;
let pendingOnlineName: string | null = null;   // 온라인 '방 만들기' 중이면(닉네임 보관) — 산업·기업 선택 후 방 생성
let claimWorld: any = null;                     // 참가자 기업 선택 화면용(방의 월드)
let s: GameState | null = null;
// 온라인(권위서버) 모드 — 서버가 시간·상태를 소유, 클라는 렌더+액션 전송
let online = false;
let net: NetClient | null = null;
let youIdxNet = -1;
let myKeyNet = "";        // 내 firm 키(인덱스는 M&A로 바뀌므로 키로 추적)
let roomCode = "";
let rosterInfo: RosterEntry[] = [];

// 일 단위 진행(1 tick = 1일). 1배속=1초/일, 2배속=0.5초/일, 3배속=0.2초/일.
// 최대배속도 5fps라 메인 스레드 여유 → 일시정지 등 조작 즉시 반응 + 차트 흔들림 없음. 풀플레이 ≈ 87/43/17분.
const stepMs = (sp: number) => sp === 1 ? 1000 : sp === 2 ? 500 : sp === 3 ? 200 : 0;
let timer: number | undefined;
function drainFx() { if (!s) return; for (const e of s.fx) sfx(e); s.fx = []; }
let lastEventId = 0;
function checkEvent() { if (!s) return; if (s.event.id !== lastEventId) { lastEventId = s.event.id; if (s.event.id > 0) showEventBanner(s.event.icon, s.event.title, s.event.note); } }
let wasCrisis = false;
function crisisCheck() {
  if (!s) return;
  const sh = myShare(s);
  if (sh < 0.10 && !wasCrisis) { wasCrisis = true; flash("⚠️ 위기 — 점유율 10% 미만! 전략을 재정비하세요"); sfx("lost"); }
  else if (sh > 0.13 && wasCrisis) { wasCrisis = false; }   // 히스테리시스(반복 경고 방지)
}
let wasInsolvent = false;
function insolvencyCheck() {
  if (!s) return;
  const ins = !!s.firms[s.youIdx] && s.firms[s.youIdx].cash < 0;
  if (ins && !wasInsolvent) {
    wasInsolvent = true; flash("🚨 비상 경영 — 현금 고갈! 회생 조치가 필요합니다"); sfx("lost");
    if (!online && s.speed !== 0) s.speed = 0;   // 오프라인은 일시정지(판단). 온라인은 공유 월드라 유지.
  } else if (!ins && wasInsolvent) { wasInsolvent = false; }
}
function achCheck() { if (!s || online) return; for (const a of checkAchievements(s)) { flash("🏆 업적 — " + a.name); showEventBanner("🏆", "업적 달성: " + a.name, a.desc); sfx("invest"); } }
function autosave() { if (s && !online && !s.ui.over) saveGame(s); }
function schedule() {
  if (timer) clearTimeout(timer);
  if (online || phase !== "game" || !s || s.speed === 0 || s.ui.over) return;   // 온라인은 서버가 진행
  timer = window.setTimeout(() => {
    tick(s!); crisisCheck(); insolvencyCheck(); achCheck();
    if (s!.ui.over) clearSave(); else if (s!.date % 30 === 0) autosave();   // 월 경계 자동저장, 게임 끝나면 세이브 삭제
    render(s!, A); drainFx(); checkEvent(); schedule();
  }, stepMs(s.speed));
}

// ----- 온라인 모드 (로비 → 방 생성/참가) -----
function roomBadge() { const ppl = rosterInfo.filter(r => r.human).length; setRoomBadge("🌐 방 " + roomCode + " · " + ppl + "명"); }
function connectOnline(join: { mode: "create" | "join"; room?: string; name?: string; scenario?: IndustryScenario; firm?: number }) {
  unlockAudio(); startBgm();
  if (timer) clearTimeout(timer);
  online = true; s = null; youIdxNet = -1; myKeyNet = "";
  net = connect(defaultUrl(), join, {
    onWelcome: (m) => {
      roomCode = m.room; rosterInfo = m.roster || []; youIdxNet = m.youIdx; lastEventId = m.world?.event?.id ?? 0;
      if (m.youIdx < 0) { claimWorld = m.world; phase = "claim"; paint(); return; }   // 참가자: 기업 선택 화면
      myKeyNet = m.world.firms[m.youIdx]?.key || "";
      phase = "game"; applyWorld(m.world); roomBadge();
      flash("방 " + m.room + " — " + (m.world.firms[m.youIdx]?.name || "내 기업") + "(으)로 플레이");
    },
    onWorld: (w) => applyWorld(w),
    onRoster: (r) => { rosterInfo = r; if (online) roomBadge(); if (phase === "claim") paint(); },
    onClose: () => { if (online && (phase === "game" || phase === "claim")) flash("서버 연결이 종료되었습니다"); },
    onError: (msg) => {
      if (phase === "claim") { flash(msg); return; }                  // 기업 선택 중 충돌 → 안내만(화면 유지)
      online = false; net = null; if (phase === "lobby") lobbyError(msg); else { flash(msg); phase = "title"; paint(); }
    },
  });
}
function applyWorld(w: any) {
  if (!w) return;
  // 내 firm 인덱스를 키로 재해결(M&A로 인덱스가 바뀌어도 안전)
  let yi = myKeyNet ? w.firms.findIndex((f: any) => f.key === myKeyNet) : -1;
  if (yi < 0) yi = youIdxNet >= 0 ? youIdxNet : 0;
  const myKey = w.firms[yi]?.key;
  const over = w.over ? { won: w.over.winnerKey ? w.over.winnerKey === myKey : !!w.over.won, msg: w.over.msg } : null;
  if (!s) {
    s = { ...w, ui: { panel: "none", leftPanel: "company", country: null, confirm: null, over }, fx: [] } as GameState;
    s.youIdx = yi; mountGame(app, A);
  } else {
    const ui = s.ui; ui.over = over;
    Object.assign(s, w); s.ui = ui; s.fx = []; s.youIdx = yi;
  }
  render(s, A); checkEvent(); insolvencyCheck();
}

function paint() {
  if (phase === "title") renderTitle(app, A);
  else if (phase === "lobby") renderLobby(app, A);
  else if (phase === "industry") renderIndustry(app, A);
  else if (phase === "company") renderCompany(app, pickedScenario!, A);
  else if (phase === "claim") renderClaim(app, claimWorld, rosterInfo, A);
  else if (phase === "game" && s) render(s, A);
  if (phase !== "game") { renderGlobalMute(true); setBgmMood("title"); }   // 인게임 외: 음소거 버튼 + 타이틀 테마
}

function startGame(youIdx: number, ask = true) {
  s = newGame(pickedScenario!, youIdx);
  recomputeLeaders(s);
  wasCrisis = false; wasInsolvent = false; lastEventId = 0;
  phase = "game";
  mountGame(app, A);   // 인게임 DOM 재구성
  if (ask && !online) s.ui.confirm = tutorialAskSpec();   // 매 게임 시작 시 튜토리얼(연습) 여부 물어봄
  render(s, A);
  schedule();
}
function tutorialAskSpec() {
  return {
    title: "🎓 튜토리얼로 시작할까요?",
    lines: [
      "한 기업을 운영해 <b>세계 시장 점유율 1위</b>에 오르는 실시간 경영 전략입니다.",
      "🏆 모든 시장 1위(완전 장악) 또는 <b>" + dateLabel(END_DAYS) + " 마감 시 1위</b>면 승리.",
      "조작이 익숙치 않으면 <b>연습 튜토리얼</b>로 핵심을 익혀보세요 — <b>연습 내용은 반영되지 않고</b> 끝나면 새 게임으로 시작합니다.",
    ],
    okLabel: "🎓 튜토리얼 (연습)",
    onOk: () => { if (s) { s.ui.confirm = null; startTutorial(s, true); render(s, A); } },
    cancelLabel: "바로 시작",
    onCancel: () => { if (s) render(s, A); },
  };
}

const A: Actions = {
  // ----- 사전 화면 흐름 -----
  toTitle() { if (timer) clearTimeout(timer); if (net) { net.close(); net = null; } online = false; setRoomBadge(null); phase = "title"; s = null; pickedScenario = null; pendingOnlineName = null; sfx("click"); paint(); },
  toIndustry() { unlockAudio(); if (timer) clearTimeout(timer); if (net) { net.close(); net = null; } online = false; setRoomBadge(null); phase = "industry"; s = null; sfx("select"); paint(); },
  // 같은 산업에서 기업 다시 선택. 온라인이거나 시나리오가 없으면 타이틀로 폴백.
  toCompany() { if (!pickedScenario || online) { A.toTitle(); return; } if (timer) clearTimeout(timer); phase = "company"; s = null; sfx("select"); paint(); },
  // 산업 인텔 해금(리포트 열람·인텔 확인 시) — localStorage 수집, 게임 경제엔 영향 없음.
  studyIntel(gics) { if (unlockIntel(gics)) { flash("📖 산업 인텔 해금: " + industryIntel(gics).ko); sfx("invest"); if (s) render(s, A); } },
  goOnline() { unlockAudio(); sfx("select"); phase = "lobby"; s = null; paint(); },
  // 방 만들기 = 먼저 산업 선택 → 그 시나리오로 방 생성(방장이 산업을 고른다)
  createRoom(name) { pendingOnlineName = name || ""; phase = "industry"; sfx("select"); paint(); },
  joinRoom(code, name) { sfx("select"); connectOnline({ mode: "join", room: code, name }); },
  pickIndustry(meta: BriefMeta) {
    pickedScenario = meta.gics === BUILTIN_META.gics ? BUILTIN_SCENARIO : buildScenario(meta);
    phase = "company"; sfx("select"); paint();   // 솔로·온라인 모두 기업 선택으로(방장도 기업을 고름)
  },
  pickCompany(youIdx: number) {
    if (pendingOnlineName !== null) {   // 온라인 방 만들기 — 고른 산업+기업으로 방 생성(방장)
      const name = pendingOnlineName; pendingOnlineName = null;
      sfx("invest"); connectOnline({ mode: "create", name, scenario: pickedScenario!, firm: youIdx });
      return;
    }
    sfx("invest"); startGame(youIdx);
  },
  skipTutorial() {
    const wasPractice = tutorialIsPractice(); endTutorial();
    if (wasPractice && pickedScenario) startGame(s ? s.youIdx : 0, false);   // 연습 후 새 게임(모달 다시 안 물음)
    else if (s) render(s, A);
  },
  replayTutorial() { if (s) { startTutorial(s); s.ui.panel = "none"; render(s, A); } },   // 다시보기는 연습모드 아님(현재 게임 유지)
  // 참가자: 남은 기업 중 선택
  claimFirm(idx: number) { sfx("invest"); net?.claim(idx); },
  spectate() { if (claimWorld) { youIdxNet = -1; phase = "game"; applyWorld(claimWorld); roomBadge(); flash("관전 모드"); } },

  // ----- 인게임 -----
  setSpeed(n) { if (!s) return; if (online) { net?.send({ kind: "speed", n }); sfx("click"); return; } s.speed = n; sfx("click"); if (n === 0) autosave(); render(s, A); schedule(); },
  togglePanel(p) {
    if (!s) return;
    if (p === "company") s.ui.leftPanel = s.ui.leftPanel === p ? "none" : p;   // 기업 내부는 왼쪽 드로어(독립)
    else s.ui.panel = s.ui.panel === p ? "none" : p;
    // 모바일: 한 번에 한 창만(좌·우 드로어가 동시에 화면을 덮어 지도가 콩알 되는 문제 방지)
    if (window.innerWidth < 760) {
      if (p === "company" && s.ui.leftPanel !== "none") { s.ui.panel = "none"; s.ui.country = null; }
      else if (p !== "company" && s.ui.panel !== "none") { s.ui.leftPanel = "none"; s.ui.country = null; }
    }
    if (p === "intel" && s.ui.panel === "intel") { const g = scenarioGics(s.scenario.key); if (unlockIntel(g)) flash("📖 산업 인텔 해금: " + industryIntel(g).ko); }
    sfx("click"); render(s, A);
  },
  selectCountry(n) { if (!s) return; s.ui.country = (n && s.ui.country === n) ? null : n; if (s.ui.country) { sfx("click"); if (window.innerWidth < 760) { s.ui.leftPanel = "none"; s.ui.panel = "none"; } } render(s, A); },
  startStrategy(cap) {
    if (!s) return;
    const me = s.firms[s.youIdx];
    if (me.ventures.some(v => v.cap === cap)) { flash(CAPKO[cap] + " 개발이 이미 진행 중입니다"); return; }
    const p = strategyProjects(s).find(x => x.cap === cap)!;
    if (online) { net?.send({ kind: "invest", cap }); sfx("invest"); return; }
    if (me.cash < p.capex) { flash("현금이 부족합니다"); return; }
    me.cash -= p.capex;
    me.ventures.push({ name: CAPKO[cap] + " 역량 개발", cap, payoff: p.gain, progress: 6, risk: 0, cooldown: {} });
    pushLog(s, "개발 착수: " + p.h); sfx("invest"); render(s, A);
  },
  startInitiative(id) {
    if (!s) return;
    const me = s.firms[s.youIdx]; const init = initiativeById(id); if (!init) return;
    if (me.ventures.some(v => v.init)) { flash("이미 특화 전략 진행 중입니다"); return; }
    if (me.cash < init.capex) { flash("현금이 부족합니다"); return; }
    const eff = init.effect; const parts: string[] = [];
    if (eff.caps) for (const k in eff.caps) parts.push(CAPKO[k as Cap] + " +" + (eff.caps as Record<string, number>)[k]);
    if (eff.marginAdd) parts.push("마진↑"); if (eff.overheadCut) parts.push("고정비↓"); if (eff.capacityBonus) parts.push("생산능력 +" + eff.capacityBonus);
    s.ui.confirm = {
      title: "🎯 " + init.name,
      lines: [init.desc, "Capex <b>$" + init.capex + "B</b> · 약 " + init.months + "개월",
        init.kind === "gamble" ? "🎲 성공 확률 <b>" + Math.round((init.successProb || 0) * 100) + "%</b> — 성공 시 " + parts.join("·") + " · 실패 시 비용 매몰" : "효과: " + parts.join("·"),
        "착수할까요?"],
      okLabel: "착수",
      onOk: () => {
        if (!s) return;
        if (online) { net?.send({ kind: "initiative", id }); s.ui.confirm = null; sfx("invest"); render(s, A); return; }
        engineStartInitiative(s, s.youIdx, id); s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  operate(cap, action) {
    if (!s) return;
    const me = s.firms[s.youIdx]; const v = me.ventures.find(x => x.cap === cap); if (!v) return;
    if (online) { net?.send({ kind: "operate", cap, action }); sfx(action === "accel" ? "accel" : action === "cancel" ? "cancel" : "select"); return; }
    if (!canOperate(s, s.youIdx, cap, action)) { flash("아직 쿨다운입니다"); return; }
    if (action === "accel") { if (me.cash < 10) { flash("현금 부족"); return; } me.cash -= 10; v.progress = Math.min(100, v.progress + 14); setCooldown(s, s.youIdx, cap, "accel", 2); flash("가속 +14"); sfx("accel"); }
    else if (action === "risk") { if (v.risk <= 0) { flash("리스크 없음"); return; } v.risk--; setCooldown(s, s.youIdx, cap, "risk", 2); flash("리스크 해소"); sfx("select"); }
    else if (action === "cancel") { me.cash += 15; me.ventures = me.ventures.filter(x => x.cap !== cap); flash("취소 — 자금 회수"); sfx("cancel"); }
    render(s, A);
  },
  buyStakeOpen(rivalKey) { if (s) openStakeModal(s, A, rivalKey); },
  buyStake(rivalKey, frac) {
    if (!s || frac <= 0) return;
    if (online) { net?.send({ kind: "buyStake", rivalKey, frac }); sfx("invest"); return; }
    engineBuyStake(s, s.youIdx, rivalKey, frac); sfx("invest"); render(s, A);
  },
  acquire(rivalKey) {
    if (!s) return;
    const t = acquireTargets(s).find(x => x.key === rivalKey); if (!t) return;
    s.ui.confirm = {
      title: "M&A — " + t.name + " 인수",
      lines: [
        "인수가: <b>$" + Math.round(t.price) + "B</b> (보유 현금 $" + Math.round(s.firms[s.youIdx].cash) + "B)",
        "효과: 각 역량을 <b>더 높은 값으로 흡수</b>하고 <b>경쟁자를 제거</b>합니다.",
        "남은 경쟁사를 모두 인수하면 시장을 완전 장악합니다. 진행할까요?",
      ],
      okLabel: "인수",
      onOk: () => {
        if (!s) return;
        if (online) { net?.send({ kind: "acquire", rivalKey }); s.ui.confirm = null; sfx("invest"); render(s, A); return; }
        const me = s.firms[s.youIdx];
        if (me.cash < t.price) { s.ui.confirm = null; flash("현금이 부족합니다 — 재무에서 자금 조달"); render(s, A); return; }
        const youKey = me.key;
        me.cash -= t.price; doAcquire(s, s.youIdx, rivalKey);
        s.youIdx = Math.max(0, s.firms.findIndex(f => f.key === youKey));   // 인수로 배열 변동 → 내 인덱스 재해결
        s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  raiseDebt() {
    if (!s) return;
    const room = borrowRoom(s); const amt = Math.min(40, Math.floor(room));
    if (amt < 5) { flash("차입여력 소진 — 점유율(벌이)을 키워야 빌릴 수 있습니다"); return; }
    s.ui.confirm = {
      title: "재무 — 부채 조달",
      lines: [
        "조달: <b>+$" + amt + "B</b> 현금 (차입여력 $" + Math.round(room) + "B)",
        "신용등급 <b>" + creditRating(s) + "</b> · 이자율 " + (debtRate(s) * 100).toFixed(1) + "% — 레버리지가 오르면 등급↓·이자↑.",
        "현금 음수가 12개월 지속되면 <b class='red'>파산</b>합니다. 진행할까요?",
      ],
      okLabel: "조달",
      onOk: () => { if (!s) return; if (online) { net?.send({ kind: "raiseDebt" }); s.ui.confirm = null; sfx("select"); render(s, A); return; } engineRaiseDebt(s, s.youIdx, amt); s.ui.confirm = null; sfx("select"); render(s, A); },
    };
    render(s, A);
  },
  buildCapacity() {
    if (!s) return;
    const me = s.firms[s.youIdx];
    const chunk = Math.max(10, Math.round(me.capacityTarget * 0.2));
    const px = capacityCapex(s, chunk);
    if (me.cash < px) { flash("증설 자금 부족 ($" + px + "B 필요)"); return; }
    s.ui.confirm = {
      title: "🏭 생산능력 증설",
      lines: [
        "투자(CAPEX): <b>$" + px + "B</b> · 생산능력 <b>+" + chunk + "</b>",
        "가동까지 <b>수개월</b>(증설 지연). 생산능력이 점유율 상한을 정합니다.",
        "가동 후 <b>월 고정비</b>가 늘어납니다. 진행할까요?",
      ],
      okLabel: "증설",
      onOk: () => {
        if (!s) return;
        if (online) { net?.send({ kind: "buildCapacity" }); s.ui.confirm = null; sfx("invest"); render(s, A); return; }
        const m = s.firms[s.youIdx]; m.cash -= capacityCapex(s, Math.max(10, Math.round(m.capacityTarget * 0.2)));
        engineBuildCapacity(s, s.youIdx, Math.max(10, Math.round(m.capacityTarget * 0.2)));
        s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  raiseFI() { if (s) openRaiseModal(s, A, false); },   // 슬라이더 팝업(재무적 투자자)
  raiseSI() { if (s) openRaiseModal(s, A, true); },    // 슬라이더 팝업(전략적 투자자)
  raiseExec(asSI, amt) {
    if (!s || amt <= 0) return;
    if (online) { net?.send({ kind: asSI ? "raiseSI" : "raiseFI", amt }); sfx("invest"); return; }
    equityRaiseBy(s, s.youIdx, amt, asSI); sfx("invest"); render(s, A);
  },
  raiseCB() { if (s) openCBModal(s, A); },   // 전환사채 발행(슬라이더 팝업)
  raiseCBExec(amt) {
    if (!s || amt < 1) return;
    if (online) { net?.send({ kind: "issueCB", amt }); sfx("invest"); return; }
    engineIssueCB(s, s.youIdx, amt); sfx("invest"); render(s, A);
  },
  // ----- 저장/불러오기/업적 (오프라인 전용) -----
  saveGame() { if (!s || online) return; s.speed = 0; flash(saveGame(s) ? "💾 게임 저장됨" : "❌ 저장 실패"); render(s, A); schedule(); },
  loadGame() {
    const raw = loadGameRaw();
    if (!raw) { flash("불러올 저장본이 없습니다"); return; }
    if (timer) clearTimeout(timer); if (net) { net.close(); net = null; } online = false; setRoomBadge(null);
    s = raw; pickedScenario = null; phase = "game"; wasCrisis = false; wasInsolvent = false; lastEventId = 0;
    mountGame(app, A); render(s, A); flash("📂 이어하기"); sfx("select"); schedule();
  },
  openAchievements() { if (s) A.togglePanel("achievements"); },
  // ===== 비상 경영 조치(현금<0) — 즉시 실행(위기엔 속도가 중요, 확인모달 없음) =====
  raiseEquity() { if (!s) return; if (online) { net?.send({ kind: "raiseEquity" }); sfx("invest"); return; } engineRaiseEquity(s, s.youIdx); sfx("invest"); render(s, A); },
  emergencyLoan() { if (!s) return; if (online) { net?.send({ kind: "emergencyLoan" }); sfx("select"); return; } engineEmergencyLoan(s, s.youIdx); sfx("select"); render(s, A); },
  austerity() { if (!s) return; if (online) { net?.send({ kind: "austerity" }); sfx("click"); return; } emergencyAusterity(s, s.youIdx); sfx("click"); render(s, A); },
  liquidate() { if (!s) return; if (online) { net?.send({ kind: "liquidate" }); sfx("select"); return; } liquidateVentures(s, s.youIdx); sfx("select"); render(s, A); },
  lobby(marketName) {
    if (!s) return;
    if (!canAct(s, s.youIdx, "lobby:" + marketName)) { flash("아직 쿨다운입니다"); return; }
    const cost = lobbyCost(s, marketName);
    if (s.firms[s.youIdx].cash < cost) { flash("현금이 부족합니다"); return; }
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
        if (online) { net?.send({ kind: "lobby", market: marketName }); s.ui.confirm = null; sfx("select"); render(s, A); return; }
        const me = s.firms[s.youIdx];
        if (me.cash < cost) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        me.cash -= cost; doLobby(s, s.youIdx, marketName); setActCooldown(s, s.youIdx, "lobby:" + marketName, 5);
        recomputeLeaders(s); s.ui.confirm = null; sfx("select"); render(s, A);
      },
    };
    render(s, A);
  },
  research(key) {
    if (!s) return;
    const n = TECH_NODES.find(x => x.key === key); if (!n) return;
    if (s.firms[s.youIdx].tech.includes(key)) return;
    if (s.firms[s.youIdx].cash < n.cost) { flash("현금이 부족합니다"); return; }
    s.ui.confirm = {
      title: "테크 개발 — " + n.name,
      lines: [ "비용: <b>$" + n.cost + "B</b>", n.desc, "한 번 개발하면 영구적입니다. 진행할까요?" ],
      okLabel: "개발",
      onOk: () => {
        if (!s) return;
        if (online) { net?.send({ kind: "research", key }); s.ui.confirm = null; sfx("invest"); render(s, A); return; }
        const me = s.firms[s.youIdx];
        if (me.cash < n.cost) { s.ui.confirm = null; flash("현금이 부족합니다"); render(s, A); return; }
        me.cash -= n.cost; doResearch(s, s.youIdx, key); s.ui.confirm = null; sfx("invest"); render(s, A);
      },
    };
    render(s, A);
  },
  alloc(marketName, delta) {
    if (!s) return;
    const me = s.firms[s.youIdx];
    if (delta > 0 && insolvent(s, s.youIdx)) { flash("현금이 음수입니다 — 비상 경영(증자·긴축)으로 흑자 전환부터 하세요"); return; }
    if (delta > 0 && naturalCaptured(s, me.key) > me.capacityTarget * 1.05) { flash("🏭 생산능력 부족 — 먼저 증설하세요 (생산 못 한 점유는 실현되지 않습니다)"); return; }
    const firstEntry = delta > 0 && !isOpen(s, marketName) && !(me.alloc[marketName] > 0);
    if (online) {
      if (firstEntry && me.cash < entryCost(s, marketName)) { flash("진입 자금이 부족합니다 (진입장벽 $" + entryCost(s, marketName) + "B)"); return; }
      net?.send({ kind: "alloc", market: marketName, delta }); sfx(delta > 0 ? "accel" : "click"); return;
    }
    if (firstEntry) {
      if (!doEnter(s, s.youIdx, marketName)) { flash("진입 자금이 부족합니다 (진입장벽 $" + entryCost(s, marketName) + "B)"); return; }
    } else {
      setAlloc(s, s.youIdx, marketName, delta);
    }
    recomputeLeaders(s); sfx(delta > 0 ? "accel" : "click"); render(s, A);
  },
  confirmOk() { const f = s?.ui.confirm?.onOk; if (f) f(); },
  confirmCancel() { if (!s) return; const f = s.ui.confirm?.onCancel; s.ui.confirm = null; if (f) f(); else render(s, A); },
  restart() { if (!pickedScenario) { A.toTitle(); return; } startGame(s ? s.youIdx : 0); },
  continuePlaying() {   // 승리 후 계속 경영(샌드박스) — 마감·승리 재판정 끔, 파산은 유효
    if (!s || !s.ui.over || online) return;
    s.ui.over = null; s.ui.sandbox = true; s.speed = 0;
    flash("▶ 계속 경영 — 마감 제한 없이 자유 운영"); sfx("select"); autosave(); render(s, A); schedule();
  },
};

function flash(msg: string) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.className = "show"; clearTimeout((t as any)._t); (t as any)._t = setTimeout(() => { t!.className = ""; }, 1100);
}

// 브라우저 정책: 첫 사용자 제스처에 오디오 언락 + 배경음악 시작
document.addEventListener("pointerdown", () => { unlockAudio(); startBgm(); }, { once: true });
paint();
// 자매 레포(daily-industry-report)가 매일 발행하는 game_data.json으로 최신화(실패 시 내장 스냅샷 유지).
// 산업·기업 선택 화면이면 새 데이터로 다시 그린다.
refreshGameData(() => { if (phase === "industry" || phase === "company") paint(); });
