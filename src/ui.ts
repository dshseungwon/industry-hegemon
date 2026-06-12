import { GameState, CAPS, CAPKO, WANTIC, Cap, CODEX } from "./state";
import { MAPDATA } from "./mapdata";
import { strategyProjects, myShare, waccOf, dateLabel, canOperate, Project, shareOf, monthlyCashflow, END_MONTHS, acquireTargets, lobbyCost, canAct, researchOptions, TECH_NODES, frontierMarkets, entryCost } from "./engine";
import { BRIEFS, BriefMeta } from "./reports.data";
import { BUILTIN_META } from "./scenario";
import { sfx, isMuted, toggleMute } from "./audio";

export interface Actions {
  setSpeed(n: 0 | 1 | 2 | 3): void;
  togglePanel(p: string): void;
  selectCountry(n: string | null): void;
  startStrategy(cap: Cap): void;
  operate(action: string): void;
  confirmOk(): void;
  confirmCancel(): void;
  restart(): void;
  pickIndustry(meta: BriefMeta): void;
  pickCompany(youIdx: number): void;
  toTitle(): void;
  toIndustry(): void;
  acquire(rivalKey: string): void;
  raiseDebt(): void;
  lobby(marketName: string): void;
  research(key: string): void;
  enter(marketName: string): void;
}
// 색은 firm.col에서(생성 시나리오는 임의 key). 비활성 시장은 어두운 색.
const colByKey = (s: GameState, k: string) => { const f = s.firms.find(x => x.key === k); return f ? f.col : "#23415f"; };
const fmt = (x: number) => Math.round(x).toLocaleString();
const esc = (s: string) => s.replace(/"/g, "&quot;");

export function mountGame(app: HTMLElement, A: Actions) {
  prevLeaders = {};   // 새 게임 — 점령 flash 추적 초기화
  app.innerHTML =
    '<svg id="map" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet"></svg>' +
    '<div id="topbar"></div>' +
    '<div id="overlayL" class="hide"></div>' +
    '<div id="overlay" class="hide"></div>' +
    '<div id="sheet" class="hide"></div>' +
    '<div id="confirmwrap" class="hide"></div>' +
    '<div id="banner" class="hide"></div>';
  const svg = document.getElementById("map")!;
  svg.innerHTML = MAPDATA.map(c => '<path data-n="' + esc(c.n) + '" class="country" d="' + c.d + '"></path>').join("");
  svg.addEventListener("click", (ev) => {
    const t = ev.target as Element;
    const n = t && t.getAttribute ? t.getAttribute("data-n") : null;
    A.selectCountry(n || null);
  });
}
let prevLeaders: Record<string, string> = {};
function recolor(s: GameState) {
  const youKey = s.firms[s.youIdx].key;
  const first = Object.keys(prevLeaders).length === 0;
  const open = new Set(s.marketOrder);
  let gained = 0, lost = 0;
  document.querySelectorAll<SVGPathElement>("#map path").forEach(p => {
    const n = p.getAttribute("data-n")!; const m = s.markets[n];
    const isOpen = !!m && open.has(n);
    const isFrontier = !!m && !open.has(n);
    p.setAttribute("fill", isOpen ? colByKey(s, m!.leader) : isFrontier ? "#2f4a2a" : "#23415f");
    let cls = "country" + (isOpen ? " active" : isFrontier ? " frontier" : " inactive") + (s.ui.country === n ? " sel" : "");
    if (isOpen && !first && prevLeaders[n] !== undefined && prevLeaders[n] !== m!.leader) {
      const win = m!.leader === youKey;
      cls += win ? " flash-win" : " flash-lose";
      if (win) gained++; else if (prevLeaders[n] === youKey) lost++;
      // 애니메이션 재생을 위해 클래스 제거(리플로우 후 재적용)
      window.setTimeout(() => { const el = p; el.setAttribute("class", el.getAttribute("class")!.replace(/ flash-(win|lose)/g, "")); }, 900);
    }
    if (isOpen) prevLeaders[n] = m!.leader; else if (isFrontier) delete prevLeaders[n];
    p.setAttribute("class", cls);
  });
  if (gained > 0) sfx("conquer");
  else if (lost > 0) sfx("lost");
}

export function render(s: GameState, A: Actions) {
  recolor(s);
  renderTop(s, A);
  renderPanel(s, A);
  renderSheet(s, A);
  renderConfirm(s, A);
  renderBanner(s, A);
}

function renderTop(s: GameState, A: Actions) {
  const t = document.getElementById("topbar")!;
  const sp = (n: number, lab: string) => '<button class="spbtn' + (s.speed === n ? " on" : "") + '" data-sp="' + n + '">' + lab + '</button>';
  t.innerHTML =
    '<div class="brand">산업 패권</div>' +
    '<div class="clock"><span class="date">' + dateLabel(s.date) + '</span><span class="mute small">~' + dateLabel(END_MONTHS) + '</span>' + sp(0, "⏸") + sp(1, "▶") + sp(2, "▶▶") + sp(3, "▶▶▶") + '</div>' +
    '<div class="hstats"><span>점유율 <b>' + (myShare(s) * 100).toFixed(0) + '%</b></span><span>현금 <b>$' + fmt(s.cash) + 'B</b></span>' + (s.debt > 0 ? '<span>부채 <b>$' + fmt(s.debt) + 'B</b></span>' : '') + '</div>' +
    '<div class="menu">' +
      mbtn("company", "🏢", s) + mbtn("projects", "🚀", s) + mbtn("strategy", "📈", s) + mbtn("tech", "🔬", s) + mbtn("codex", "📖", s) +
      '<button class="mbtn" id="muteBtn" title="소리 켜기/끄기">' + (isMuted() ? "🔇" : "🔊") + '</button>' +
    '</div>' +
    '<div class="trend">📰 ' + s.trend.headline + ' — ' + s.trend.note + (s.venture ? ' · 🚀 ' + CAPKO[s.venture.cap] + ' ' + Math.round(s.venture.progress) + '%' : '') + '</div>';
  t.querySelectorAll<HTMLElement>(".spbtn").forEach(b => b.onclick = () => A.setSpeed(Number(b.dataset.sp) as 0|1|2|3));
  t.querySelectorAll<HTMLElement>(".mbtn[data-p]").forEach(b => b.onclick = () => A.togglePanel(b.dataset.p!));
  document.getElementById("muteBtn")!.onclick = () => { const m = toggleMute(); if (!m) sfx("select"); renderTop(s, A); };
}
const mbtn = (p: string, ic: string, s: GameState) => {
  const on = p === "company" ? s.ui.leftPanel === p : s.ui.panel === p;
  return '<button class="mbtn' + (on ? " on" : "") + '" data-p="' + p + '">' + ic + '</button>';
};

function bar(label: string, v: number, color?: string) {
  const fill = color ? ';background:' + color : '';
  return '<div class="barrow"><span class="bl">' + label + '</span><div class="bt"><div class="bf" style="width:' + Math.round(v) + '%' + fill + '"></div></div><span class="bv">' + Math.round(v) + '</span></div>';
}

function renderPanel(s: GameState, A: Actions) {
  // 기업 내부 = 왼쪽 드로어, 투자/전략/용어집 = 오른쪽 드로어 (독립적으로 동시에 열림)
  const left = document.getElementById("overlayL")!;
  if (s.ui.leftPanel === "none") { left.className = "hide"; left.innerHTML = ""; }
  else {
    left.className = "drawer left";
    left.innerHTML = '<div class="dhead"><b>' + panelTitle(s.ui.leftPanel) + '</b><button class="x" id="closeL">✕</button></div><div class="dbody">' + panelBody(s, s.ui.leftPanel) + '</div>';
    document.getElementById("closeL")!.onclick = () => A.togglePanel(s.ui.leftPanel);
  }
  const o = document.getElementById("overlay")!;
  if (s.ui.panel === "none") { o.className = "hide"; o.innerHTML = ""; return; }
  o.className = "drawer";
  o.innerHTML = '<div class="dhead"><b>' + panelTitle(s.ui.panel) + '</b><button class="x" id="closePanel">✕</button></div><div class="dbody">' + panelBody(s, s.ui.panel) + '</div>';
  document.getElementById("closePanel")!.onclick = () => A.togglePanel(s.ui.panel);
  o.querySelectorAll<HTMLElement>(".proj:not(.mna):not(.tech):not(.enter)").forEach(b => b.onclick = () => A.startStrategy(b.dataset.cap as Cap));
  o.querySelectorAll<HTMLElement>(".mna").forEach(b => b.onclick = () => A.acquire(b.dataset.key!));
  o.querySelectorAll<HTMLElement>("button.tech").forEach(b => b.onclick = () => A.research(b.dataset.key!));
  o.querySelectorAll<HTMLElement>(".enter").forEach(b => b.onclick = () => A.enter(b.dataset.n!));
  o.querySelectorAll<HTMLElement>(".op").forEach(b => { if (!b.classList.contains("dis")) b.onclick = () => A.operate(b.dataset.op!); });
  const rd = document.getElementById("raiseDebt") as HTMLButtonElement | null;
  if (rd && !rd.disabled) rd.onclick = () => A.raiseDebt();
}

function panelBody(s: GameState, panel: string): string {
  let h = "";
  const you = s.firms[s.youIdx];
  if (panel === "company") {
    const cf = monthlyCashflow(s);
    h += '<div class="card"><div class="kv"><span>현금</span><b>$' + fmt(s.cash) + 'B</b></div><div class="kv"><span>월 현금흐름</span><b class="' + (cf >= 0 ? 'gold' : 'red') + '">' + (cf >= 0 ? '+' : '') + cf.toFixed(1) + 'B</b></div><div class="kv"><span>부채</span><b>$' + fmt(s.debt) + 'B</b></div><div class="kv"><span>전 세계 점유율</span><b class="gold">' + (myShare(s) * 100).toFixed(1) + '%</b></div><div class="kv"><span>WACC(할인율)</span><b>' + (waccOf(s) * 100).toFixed(1) + '%</b></div></div>';
    h += '<div class="sect">역량</div><div class="card">' + CAPS.map(k => bar(CAPKO[k], you.caps[k])).join("") + '</div>';
    h += '<div class="sect">경쟁사</div>' + s.firms.filter(f => f.key !== you.key).map(f => '<div class="card"><div class="kv"><b style="color:' + f.col + '">' + f.name + '</b><span>' + CAPS.map(k => CAPKO[k][0] + f.caps[k]).join(" ") + '</span></div></div>').join("");
  } else if (panel === "projects") {
    if (!s.venture) h += '<div class="card mute small">진행 중인 투자가 없습니다. [전략] 탭에서 새 투자를 시작하면 여기서 <b>운영</b>합니다.</div>';
    else {
      const v = s.venture;
      h += '<div class="venture">' + ring(v.progress) + '<div class="vt">🚀 ' + v.name + '</div><div class="vd">완성 시 ' + CAPKO[v.cap] + ' +' + v.payoff + ' → 관련 시장 점령</div>' +
        '<div class="vmeta"><span class="chip">진행 ' + Math.round(v.progress) + '%</span>' + (v.risk > 0 ? '<span class="chip risk">⚠️ 리스크 ' + v.risk + '</span>' : '<span class="chip">리스크 없음</span>') + '</div>' +
        '<div class="ops">' +
          opbtn(s, "accel", "⏩ 가속", "진행+, 현금 -10") +
          opbtn(s, "risk", "🛡️ 리스크 대응", "리스크 1 해소") +
          opbtn(s, "pivot", "🔀 대상 변경", "개발 역량 교체") +
          opbtn(s, "cancel", "✕ 취소", "자금 일부 회수") +
        '</div><div class="mute small" style="margin-top:6px">운영 행동엔 <b>쿨다운</b>이 있습니다(무한 클릭 불가). 시간이 흐르면 다시 가능.</div></div>';
    }
  } else if (panel === "strategy") {
    // 1) 내부 개발(역량 투자)
    h += '<div class="sect">내부 개발 — 역량 투자(NPV)</div>';
    if (s.venture) h += '<div class="card mute small">진행 중인 투자가 있습니다. [프로젝트]에서 운영·취소 후 새 투자를 시작하세요.</div>';
    else {
      strategyProjects(s).forEach((p: Project) => {
        const go = p.npv > 0;
        h += '<button class="proj" data-cap="' + p.cap + '"><div class="h">' + p.h + (go ? '<span class="bdg go">투자 적격</span>' : '<span class="bdg no">가치 파괴</span>') + '</div><div class="e">' + p.e + '</div><div class="fin"><span>Capex $' + p.capex + 'B</span><span class="gold">점유율 +' + (p.dShare * 100).toFixed(1) + '%p</span><span class="' + (go ? 'pos' : 'neg') + '">NPV $' + fmt(p.npv) + 'B</span><span>IRR ' + (p.irr != null ? (p.irr * 100).toFixed(0) + '%' : '-') + '</span></div></button>';
      });
      h += '<div class="mute small">※ NPV는 "지금 소비자 선호 유지" 가정. 환경이 바뀌면 실현이 달라집니다.</div>';
    }
    // 2) M&A(경쟁사 인수)
    h += '<div class="sect">M&A — 경쟁사 인수</div>';
    const tgts = acquireTargets(s);
    if (!tgts.length) h += '<div class="card mute small">인수할 경쟁사가 없습니다 — 이미 시장을 정리했습니다.</div>';
    else tgts.forEach(t => {
      const can = s.cash >= t.price;
      h += '<button class="proj mna" data-key="' + t.key + '"><div class="h"><span style="color:' + t.col + '">' + t.name + '</span> 인수<span class="bdg ' + (can ? 'go' : 'no') + '">$' + fmt(t.price) + 'B</span></div><div class="e">역량 흡수(더 높은 값 채택) + <b>경쟁자 제거</b> · 현 점유율 ' + (t.share * 100).toFixed(0) + '%</div></button>';
    });
    // 3) 재무(자금 조달)
    h += '<div class="sect">재무 — 자금 조달</div>';
    h += '<div class="card"><div class="kv"><span>현금</span><b>$' + fmt(s.cash) + 'B</b></div><div class="kv"><span>부채</span><b>$' + fmt(s.debt) + 'B</b></div><div class="kv"><span>WACC(할인율)</span><b>' + (waccOf(s) * 100).toFixed(1) + '%</b></div>' +
      '<button class="actbtn" id="raiseDebt"' + (s.debt >= 250 ? ' disabled' : '') + '>부채로 +$40B 조달</button>' +
      '<div class="mute small" style="margin-top:6px">부채는 즉시 현금이 되지만 월 이자·WACC 상승을 부릅니다. 큰 인수의 실탄.</div></div>';
    // 4) 해외진출(프론티어 시장 개척)
    h += '<div class="sect">해외진출 — 신규 시장 개척</div>';
    const fr = frontierMarkets(s);
    if (!fr.length) h += '<div class="card mute small">모든 시장에 진출했습니다.</div>';
    else fr.forEach(m => {
      const cost = entryCost(s, m.name); const can = s.cash >= cost;
      h += '<button class="proj enter" data-n="' + esc(m.name) + '"><div class="h">🌏 ' + m.ko + ' 진출<span class="bdg ' + (can ? 'go' : 'no') + '">$' + cost + 'B</span></div><div class="e">규모 $' + m.size + 'B · 우리 강점으로 시장 형성(선점 우위)</div></button>';
    });
  } else if (panel === "tech") {
    h += '<div class="card mute small">연구 노드를 해금해 <b>영구 역량</b>과 경제 효과(마진·고정비·벤처속도)를 얻습니다. 무엇을 먼저 개발할지가 전략.</div>';
    researchOptions(s).forEach(o => {
      const n = o.node;
      if (o.unlocked) h += '<div class="proj tech done"><div class="h">' + n.name + '<span class="bdg go">완료 ✓</span></div><div class="e">' + n.desc + '</div></div>';
      else if (o.available) { const can = s.cash >= n.cost; h += '<button class="proj tech" data-key="' + n.key + '"><div class="h">' + n.name + '<span class="bdg ' + (can ? 'go' : 'no') + '">$' + n.cost + 'B</span></div><div class="e">' + n.desc + '</div></button>'; }
      else h += '<div class="proj tech locked"><div class="h">🔒 ' + n.name + '</div><div class="e">선행 필요: ' + n.req.map(r => TECH_NODES.find(x => x.key === r)?.name || r).join(", ") + '</div></div>';
    });
  } else if (panel === "codex") {
    h += CODEX.map(c => '<div class="codex"><div class="t">' + c.t + (c.en ? ' <span class="en">' + c.en + '</span>' : '') + '</div><div class="d">' + c.d + '</div></div>').join("");
  }
  return h;
}
function opbtn(s: GameState, action: string, h: string, e: string) {
  const ok = canOperate(s, action);
  const cd = s.venture && !ok ? Math.max(0, (s.venture.cooldown[action] || 0) - s.date) : 0;
  return '<button class="op' + (ok ? '' : ' dis') + '" data-op="' + action + '"><div class="oh">' + h + '</div><div class="oe">' + (ok ? e : '쿨다운 ' + cd + '개월') + '</div></button>';
}
const panelTitle = (p: string) => ({ company: "🏢 기업 내부", projects: "🚀 진행 프로젝트", strategy: "📈 전략 실행", tech: "🔬 테크트리", codex: "📖 용어집" } as Record<string, string>)[p] || "";
function ring(pct: number) { const C = 2 * Math.PI * 16, off = C * (1 - pct / 100); return '<svg class="ring" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" fill="none" stroke="#3a2c55" stroke-width="5"/><circle cx="21" cy="21" r="16" fill="none" stroke="#cbb3ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 21 21)"/><text x="21" y="25" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + Math.round(pct) + '%</text></svg>'; }

function renderSheet(s: GameState, A: Actions) {
  const el = document.getElementById("sheet")!;
  if (!s.ui.country) { el.className = "hide"; el.innerHTML = ""; return; }
  const m = s.markets[s.ui.country]; if (!m) { el.className = "hide"; return; }
  // 닫힌 프론티어 시장 → 해외진출 시트
  if (!s.marketOrder.includes(m.name)) {
    const cost = entryCost(s, m.name); const can = s.cash >= cost;
    el.className = "sheet";
    el.innerHTML = '<button class="x" id="closeSheet">✕</button><h3>🌏 ' + m.ko + ' <span class="mute small">' + m.name + '</span></h3>' +
      '<div class="kv"><span>상태</span><b class="mute">미진출 시장</b></div>' +
      '<div class="kv"><span>시장 규모</span><b>$' + m.size + 'B</b></div>' +
      '<div class="card mute small">진입장벽을 돌파해 개척하면 시장이 <b>우리 강점 KSF로 형성</b>돼 선점 우위를 얻습니다. 단, 전체 시장이 커져 점유율 관리 부담도 늘어납니다.</div>' +
      '<button class="actbtn" id="enterBtn"' + (can ? '' : ' disabled') + '>해외진출 — 진입장벽 돌파 ($' + cost + 'B)</button>';
    document.getElementById("closeSheet")!.onclick = () => A.selectCountry(null);
    const eb = document.getElementById("enterBtn") as HTMLButtonElement | null;
    if (eb && !eb.disabled) eb.onclick = () => A.enter(m.name);
    return;
  }
  const lead = s.firms.find(f => f.key === m.leader)!;
  const top = (CAPS.slice().sort((a, b) => (m.pref[b] || 0) - (m.pref[a] || 0)))[0];
  el.className = "sheet";
  const shareRows = s.firms
    .map(f => ({ f, sh: shareOf(s, m, f.key) }))
    .sort((a, b) => b.sh - a.sh)
    .map(({ f, sh }) => '<div class="barrow"><span class="bl" style="color:' + f.col + '">' + f.name + '</span><div class="bt"><div class="bf" style="width:' + Math.round(sh * 100) + '%;background:' + f.col + '"></div></div><span class="bv">' + Math.round(sh * 100) + '%</span></div>')
    .join("");
  el.innerHTML = '<button class="x" id="closeSheet">✕</button><h3>' + m.ko + ' <span class="mute small">' + m.name + '</span></h3>' +
    '<div class="kv"><span>시장 규모</span><b>$' + m.size + 'B</b></div>' +
    '<div class="kv"><span>현재 1위</span><b style="color:' + lead.col + '">' + lead.name + '</b></div>' +
    '<div class="kv"><span>소비자 핵심 선호</span><b>' + CAPKO[top] + '</b></div>' +
    '<div class="sect">기업별 점유율</div>' + shareRows +
    '<div class="sect">소비자 선호</div>' + CAPS.map(k => bar(CAPKO[k], (m.pref[k] || 0) * 100)).join("") +
    '<div class="mute small" style="margin-top:6px">이 시장은 <b>' + CAPKO[top] + '</b>를 가장 원합니다. 그 역량을 키우면 점유율을 늘릴 수 있어요.</div>' +
    lobbyBtn(s);
  document.getElementById("closeSheet")!.onclick = () => A.selectCountry(null);
  const lb = document.getElementById("lobbyBtn") as HTMLButtonElement | null;
  if (lb && !lb.disabled) lb.onclick = () => A.lobby(s.ui.country!);
}
// 로비 버튼 — 이 시장의 KSF를 우리 강점 쪽으로(쿨다운·비용)
function lobbyBtn(s: GameState): string {
  const n = s.ui.country!; const cost = lobbyCost(s, n); const ok = canAct(s, "lobby:" + n);
  const cd = ok ? 0 : Math.max(0, (s.cooldowns["lobby:" + n] || 0) - s.date);
  const dis = !ok || s.cash < cost;
  return '<button class="actbtn" id="lobbyBtn"' + (dis ? ' disabled' : '') + '>🏛️ 로비 — KSF를 우리 강점으로 ' + (ok ? '($' + cost + 'B)' : '(쿨다운 ' + cd + '개월)') + '</button>';
}

function renderConfirm(s: GameState, A: Actions) {
  const el = document.getElementById("confirmwrap")!;
  if (!s.ui.confirm) { el.className = "hide"; el.innerHTML = ""; return; }
  const c = s.ui.confirm; el.className = "modalwrap";
  el.innerHTML = '<div class="modal"><h3>' + c.title + '</h3>' + c.lines.map(l => '<div class="mrow">' + l + '</div>').join("") +
    '<div class="mbtns"><button class="btn ghost" id="cCancel">취소</button><button class="btn" id="cOk">' + c.okLabel + '</button></div></div>';
  document.getElementById("cOk")!.onclick = () => A.confirmOk();
  document.getElementById("cCancel")!.onclick = () => A.confirmCancel();
}
function renderBanner(s: GameState, A: Actions) {
  const el = document.getElementById("banner")!;
  if (!s.ui.over) { el.className = "hide"; el.innerHTML = ""; return; }
  el.className = "modalwrap";
  el.innerHTML = '<div class="modal' + (s.ui.over.won ? " victory" : "") + '"><h3 class="gold">' + (s.ui.over.won ? "🏆 " + s.ui.over.msg : s.ui.over.msg) + '</h3>' +
    '<div class="mrow">' + s.scenario.ko + ' · 최종 점유율 ' + (myShare(s) * 100).toFixed(0) + '%</div>' +
    '<div class="mbtns"><button class="btn ghost" id="toTitle">다른 산업 고르기</button><button class="btn" id="restart">같은 산업 다시</button></div></div>';
  document.getElementById("restart")!.onclick = () => A.restart();
  document.getElementById("toTitle")!.onclick = () => A.toTitle();
}

// ===== 사전 화면(타이틀 → 산업 선택 → 기업 선택) =====
const sectorKo: Record<string, string> = {
  "Information Technology": "IT", "Communication Services": "통신", "Consumer Discretionary": "경기소비재",
  "Consumer Staples": "필수소비재", "Health Care": "헬스케어", "Financials": "금융", "Industrials": "산업재",
  "Materials": "소재", "Energy": "에너지", "Utilities": "유틸리티", "Real Estate": "부동산",
};

export function renderTitle(app: HTMLElement, A: Actions) {
  app.innerHTML =
    '<div class="screen title"><div class="hero">' +
    '<div class="logo">🌐 산업 패권</div><div class="tag">Industry Hegemon</div>' +
    '<p class="lede">오늘의 산업을 골라, 한 기업을 운영해 세계 시장을 점령하라.<br>' +
    '시장이 무엇을 원하는지 <b>읽고</b>, 역량에 <b>투자</b>해 1위에 오르는 실시간 경영 전략.</p>' +
    '<button class="btn big" id="toIndustry">산업 선택 →</button>' +
    '<p class="src">데이터: <a href="https://dshseungwon.github.io/daily-industry-report/" target="_blank" rel="noopener">The Industry Brief</a></p>' +
    '</div></div>';
  document.getElementById("toIndustry")!.onclick = () => A.toIndustry();
}

export function renderIndustry(app: HTMLElement, A: Actions) {
  const all: BriefMeta[] = [BUILTIN_META, ...BRIEFS];
  const card = (m: BriefMeta, featured: boolean) => {
    const link = m.file ? '<a class="rlink" href="https://dshseungwon.github.io/daily-industry-report/' + esc(m.file) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">리포트 ↗</a>' : '';
    return '<button class="icard' + (featured ? ' feat' : '') + '" data-gics="' + esc(m.gics) + '">' +
      '<div class="ih"><span class="chip">' + (sectorKo[m.sector] || m.sector) + '</span>' + (featured ? '<span class="bdg go">기준 시나리오</span>' : '') + link + '</div>' +
      '<div class="iname">' + m.industry_ko + '</div>' +
      '<div class="ihead">' + m.headline_ko + '</div>' +
      '<div class="ico"><span>🌐 ' + m.global_company + '</span><span>🇰🇷 ' + m.korea_company + '</span></div>' +
      '</button>';
  };
  app.innerHTML =
    '<div class="screen list"><div class="lhead"><button class="back" id="back">←</button>' +
    '<div><h2>산업 선택</h2><div class="mute small">The Industry Brief의 ' + BRIEFS.length + '개 산업 · 매일 갱신</div></div></div>' +
    '<div class="igrid">' + card(all[0], true) + all.slice(1).map(m => card(m, false)).join("") + '</div></div>';
  document.getElementById("back")!.onclick = () => A.toTitle();
  app.querySelectorAll<HTMLElement>(".icard").forEach(b => b.onclick = () => {
    const g = b.dataset.gics!; const meta = all.find(m => m.gics === g)!; A.pickIndustry(meta);
  });
}

export function renderCompany(app: HTMLElement, sc: import("./state").IndustryScenario, A: Actions) {
  const roleKo = (k: string) => k === "global" ? "글로벌 1위" : k === "challenger" ? "신흥 도전자" : "한국 1위 · 추천";
  const firmCard = (f: import("./state").FirmDef, idx: number) =>
    '<div class="ccard" style="border-left:4px solid ' + f.col + '"><div class="ch"><b style="color:' + f.col + '">' + f.name + '</b><span class="chip">' + roleKo(f.key) + '</span></div>' +
    '<div class="cbars">' + CAPS.map(k => bar(CAPKO[k], f.caps[k], f.col)).join("") + '</div>' +
    '<button class="btn" data-idx="' + idx + '">이 기업으로 플레이</button></div>';
  app.innerHTML =
    '<div class="screen list"><div class="lhead"><button class="back" id="back">←</button>' +
    '<div><h2>' + sc.ko + '</h2><div class="mute small">' + (sectorKo[sc.sector] || sc.sector) + '</div></div></div>' +
    '<div class="card"><div class="ihead">' + sc.headline + '</div>' +
    '<div class="ico"><a class="rlink" href="' + sc.reportUrl + '" target="_blank" rel="noopener">📖 브리프 리포트 읽기 ↗</a>' +
    (sc.preset ? '<span class="bdg no">KSF 데이터 준비중 — 섹터 프리셋</span>' : '<span class="bdg go">튜닝된 기준 시나리오</span>') + '</div></div>' +
    '<div class="sect">어느 기업을 운영할까요?</div>' +
    sc.firms.map((f, i) => firmCard(f, i)).join("") + '</div>';
  document.getElementById("back")!.onclick = () => A.toIndustry();
  app.querySelectorAll<HTMLElement>(".ccard .btn").forEach(b => b.onclick = () => A.pickCompany(Number(b.dataset.idx)));
}
