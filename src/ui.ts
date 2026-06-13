import { GameState, CAPS, CAPKO, WANTIC, Cap, CODEX } from "./state";
import { MAPDATA } from "./mapdata";
import { strategyProjects, myShare, waccOf, dateLabel, canOperate, Project, shareOf, monthlyCashflow, END_MONTHS, acquireTargets, lobbyCost, canAct, researchOptions, TECH_NODES, frontierMarkets, capturedSize, borrowRoom, creditRating, leverage, debtRate, allocUpkeep, allocUpkeepAt, maxAllocFor, regionOf, entryCost } from "./engine";
import { BRIEFS, BriefMeta } from "./reports.data";
import { BUILTIN_META } from "./scenario";
import { industryIntel, scenarioGics, unlockedGics, intelTotal, IndustryIntel } from "./intel";
import { sfx, isMuted, toggleMute, setBgmMood } from "./audio";

export interface Actions {
  setSpeed(n: 0 | 1 | 2 | 3): void;
  togglePanel(p: string): void;
  selectCountry(n: string | null): void;
  startStrategy(cap: Cap): void;
  operate(cap: Cap, action: string): void;
  confirmOk(): void;
  confirmCancel(): void;
  restart(): void;
  pickIndustry(meta: BriefMeta): void;
  pickCompany(youIdx: number): void;
  toTitle(): void;
  toIndustry(): void;
  toCompany(): void;
  studyIntel(gics: string): void;
  goOnline(): void;
  createRoom(name: string): void;
  joinRoom(code: string, name: string): void;
  acquire(rivalKey: string): void;
  raiseDebt(): void;
  lobby(marketName: string): void;
  research(key: string): void;
  alloc(marketName: string, delta: number): void;
}
// 색은 firm.col에서(생성 시나리오는 임의 key). 비활성 시장은 어두운 색.
const colByKey = (s: GameState, k: string) => { const f = s.firms.find(x => x.key === k); return f ? f.col : "#23415f"; };
const fmt = (x: number) => Math.round(x).toLocaleString();
const esc = (s: string) => s.replace(/"/g, "&quot;");
// 역량별 색 — 4역량 전용(예약). 기업 색과 겹치지 않게 시안/마젠타/옐로/바이올렛.
const CAPCOL: Record<Cap, string> = { tech: "#35c5e0", brand: "#e85fd0", scale: "#ffce4d", global: "#9b8cff" };

export function mountGame(app: HTMLElement, A: Actions) {
  prevLeaders = {};   // 새 게임 — 점령 flash 추적 초기화
  app.innerHTML =
    '<svg id="map" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet"></svg>' +
    '<div id="mapnav"><button data-z="in" title="확대">＋</button><button data-z="out" title="축소">－</button><button data-z="reset" title="원위치">⤢</button></div>' +
    '<div id="topbar"></div>' +
    '<div id="overlayL" class="hide"></div>' +
    '<div id="overlay" class="hide"></div>' +
    '<div id="sheet" class="hide"></div>' +
    '<div id="confirmwrap" class="hide"></div>' +
    '<div id="banner" class="hide"></div>';
  const svg = document.getElementById("map") as unknown as SVGSVGElement;
  svg.innerHTML = MAPDATA.map(c => '<path data-n="' + esc(c.n) + '" class="country" d="' + c.d + '"></path>').join("") + '<g id="transit"></g>';
  setupMapNav(svg, A);
}
// 자원 이동(전송) 시각화 — 본진→대상으로 점이 흐름(CoC식)
const centroidCache: Record<string, [number, number] | null> = {};
function centroidOf(name: string): [number, number] | null {
  if (name in centroidCache) return centroidCache[name];
  const el = document.querySelector<SVGPathElement>('#map path[data-n="' + esc(name) + '"]');
  let c: [number, number] | null = null;
  if (el) { try { const b = el.getBBox(); c = [b.x + b.width / 2, b.y + b.height / 2]; } catch { /* noop */ } }
  centroidCache[name] = c; return c;
}
// 자원 흐름 시각화 — 내가 자원을 할당 중인 시장으로 본진에서 점이 계속 흐름(할당 1단계당 점 1개)
function renderTransit(s: GameState) {
  const g = document.getElementById("transit"); if (!g) return;
  const me = s.firms[s.youIdx]; let html = "";
  const hb = centroidOf(me.home);
  if (hb) html += '<circle cx="' + hb[0].toFixed(1) + '" cy="' + hb[1].toFixed(1) + '" r="4.5" fill="none" stroke="' + me.col + '" stroke-width="1.8" class="homebase"/>';
  for (const n in me.alloc) {
    const lvl = me.alloc[n]; if (!lvl || !hb) continue;
    const to = centroidOf(n); if (!to) continue;
    html += '<line x1="' + hb[0].toFixed(1) + '" y1="' + hb[1].toFixed(1) + '" x2="' + to[0].toFixed(1) + '" y2="' + to[1].toFixed(1) + '" stroke="' + me.col + '" stroke-width="' + (0.6 + lvl * 0.4) + '" stroke-dasharray="3 4" opacity="0.5" class="flow"/>';
    for (let i = 0; i < lvl; i++) {
      const ph = (i / lvl) + 0.001;   // 점을 균등 배치(흐르는 느낌은 CSS dash 애니메이션이 담당)
      const x = hb[0] + (to[0] - hb[0]) * ph, y = hb[1] + (to[1] - hb[1]) * ph;
      html += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4" fill="' + me.col + '" class="ship"/>';
    }
  }
  g.innerHTML = html;
}

// ---- 지도 팬/줌(스크롤) — CSS transform(스크린 좌표). 드래그 px = 이동 px. ----
const clampN = (x: number, a: number, b: number) => x < a ? a : x > b ? b : x;
let mk = 1, mtx = 0, mty = 0;     // scale, translate(px)
function applyXform(svg: SVGSVGElement) { svg.style.transformOrigin = "0 0"; svg.style.transform = "translate(" + mtx + "px," + mty + "px) scale(" + mk + ")"; }
function clampXform() {
  const W = window.innerWidth, H = window.innerHeight, M = 0.6;   // 오버스크롤 허용 → 100%에서도 항상 드래그 가능
  mk = clampN(mk, 1, 5);
  mtx = clampN(mtx, (1 - mk) * W - M * W, M * W);
  mty = clampN(mty, (1 - mk) * H - M * H, M * H);
}
function zoomAround(svg: SVGSVGElement, cx: number, cy: number, factor: number) {
  const nk = clampN(mk * factor, 1, 5), r = nk / mk;
  mtx = cx - r * (cx - mtx); mty = cy - r * (cy - mty); mk = nk;
  clampXform(); applyXform(svg);
}
const INITIAL_ZOOM = 1.25;   // 기본부터 살짝 확대 → 시작부터 드래그로 팬 가능(여백 확보)
function resetView(svg: SVGSVGElement) {
  mk = INITIAL_ZOOM; mtx = -(mk - 1) * window.innerWidth / 2; mty = -(mk - 1) * window.innerHeight / 2;
  clampXform(); applyXform(svg);
}
function setupMapNav(svg: SVGSVGElement, A: Actions) {
  resetView(svg);
  let drag = false, moved = false, sx = 0, sy = 0, tx0 = 0, ty0 = 0;

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAround(svg, e.clientX, e.clientY, e.deltaY > 0 ? 1 / 1.15 : 1.15);
  }, { passive: false });

  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (moved) { mtx = tx0 + dx; mty = ty0 + dy; clampXform(); applyXform(svg); }
  };
  const onUp = (e: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (!drag) return; drag = false;
    if (!moved) { const t = e.target as Element; const n = t && t.getAttribute ? t.getAttribute("data-n") : null; A.selectCountry(n || null); }
  };
  svg.addEventListener("pointerdown", (e) => {
    drag = true; moved = false; sx = e.clientX; sy = e.clientY; tx0 = mtx; ty0 = mty;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  document.querySelectorAll<HTMLElement>("#mapnav button").forEach(b => b.onclick = () => {
    const z = b.dataset.z;
    if (z === "reset") resetView(svg);
    else zoomAround(svg, window.innerWidth / 2, window.innerHeight / 2, z === "in" ? 1.4 : 1 / 1.4);
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
  const sh = myShare(s);                       // 점유율 상황 → 배경음악 분위기
  setBgmMood(sh < 0.12 ? "crisis" : sh >= 0.55 ? "strong" : "calm");
  recolor(s);
  renderTransit(s);
  renderTop(s, A);
  renderPanel(s, A);
  renderSheet(s, A);
  renderConfirm(s, A);
  renderBanner(s, A);
}

function renderTop(s: GameState, A: Actions) {
  const t = document.getElementById("topbar")!;
  const me = s.firms[s.youIdx];
  const sp = (n: number, lab: string) => '<button class="spbtn' + (s.speed === n ? " on" : "") + '" data-sp="' + n + '">' + lab + '</button>';
  t.innerHTML =
    '<div class="brand">산업 패권</div>' +
    '<div class="myfirm" title="내 기업" style="border-color:' + me.col + '"><span class="fdot" style="background:' + me.col + '"></span><b style="color:' + me.col + '">' + me.name + '</b></div>' +
    '<div class="clock"><span class="date">' + dateLabel(s.date) + '</span><span class="mute small">~' + dateLabel(END_MONTHS) + '</span>' + sp(0, "⏸") + sp(1, "▶") + sp(2, "▶▶") + sp(3, "▶▶▶") + '</div>' +
    '<div class="hstats"><span>점유율 <b>' + (myShare(s) * 100).toFixed(0) + '%</b></span><span>현금 <b>$' + fmt(me.cash) + 'B</b></span>' + (me.debt > 0 ? '<span>부채 <b>$' + fmt(me.debt) + 'B</b></span>' : '') + '</div>' +
    '<div class="menu">' +
      mbtn("menu", "☰", s, true) + mbtn("log", "📜", s, true) + mbtn("guide", "❓", s, true) + mbtn("codex", "📖", s, true) +
      '<button class="mbtn minor" id="muteBtn" title="소리 켜기/끄기">' + (isMuted() ? "🔇" : "🔊") + '</button>' +
      '<span class="mgap"></span>' + mbtn("company", "🏢", s) + mbtn("strategy", "📈", s) + mbtn("tech", "🔬", s) + mbtn("intel", "📊", s) +
    '</div>' +
    '<div class="trend">📰 ' + s.trend.headline + ' — ' + s.trend.note + (me.ventures.length ? ' · 🔬 ' + me.ventures.map(v => CAPKO[v.cap] + ' ' + Math.round(v.progress) + '%').join(' · ') : '') + '</div>';
  t.querySelectorAll<HTMLElement>(".spbtn").forEach(b => b.onclick = () => A.setSpeed(Number(b.dataset.sp) as 0|1|2|3));
  t.querySelectorAll<HTMLElement>(".mbtn[data-p]").forEach(b => b.onclick = () => A.togglePanel(b.dataset.p!));
  document.getElementById("muteBtn")!.onclick = () => { const m = toggleMute(); if (!m) sfx("select"); renderTop(s, A); };
  // 드로어가 상단바(트렌드 줄) 아래에서 시작하도록 실제 높이를 반영(겹침 방지)
  document.documentElement.style.setProperty("--topbar-h", (t.offsetHeight + 2) + "px");
}
const mbtn = (p: string, ic: string, s: GameState, minor = false) => {
  const on = p === "company" ? s.ui.leftPanel === p : s.ui.panel === p;
  return '<button class="mbtn' + (on ? " on" : "") + (minor ? " minor" : "") + '" data-p="' + p + '">' + ic + '</button>';
};

function bar(label: string, v: number, color?: string) {
  const fill = color ? ';background:' + color : '';
  return '<div class="barrow"><span class="bl">' + label + '</span><div class="bt"><div class="bf" style="width:' + Math.round(v) + '%' + fill + '"></div></div><span class="bv">' + Math.round(v) + '</span></div>';
}
// 역량 막대 — 4역량을 전체 이름(기술/브랜드/가성비/글로벌)으로, 역량별 색. 절대 앞글자 약어 금지.
function capBars(val: (k: Cap) => number): string {
  return '<div class="cbarset">' + CAPS.map(k => {
    const v = Math.max(0, Math.min(100, Math.round(val(k))));
    return '<div class="cbar"><span class="cbl">' + CAPKO[k] + '</span><div class="cbt"><div class="cbf" style="width:' + v + '%;background:' + CAPCOL[k] + '"></div></div><span class="cbv">' + v + '</span></div>';
  }).join("") + '</div>';
}
// 도넛 파이 차트 — 점유율 슬라이스(기업 색).
function pieChart(slices: { label: string; value: number; color: string }[]): string {
  const tot = slices.reduce((a, x) => a + x.value, 0) || 1; const C = 2 * Math.PI * 26; let off = 0;
  const segs = slices.map(x => { const fr = x.value / tot; const seg = '<circle cx="34" cy="34" r="26" fill="none" stroke="' + x.color + '" stroke-width="13" stroke-dasharray="' + (fr * C).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off * C).toFixed(2) + '" transform="rotate(-90 34 34)"/>'; off += fr; return seg; }).join("");
  const legend = slices.map(x => '<div class="plg"><span class="pdot" style="background:' + x.color + '"></span>' + x.label + ' <b>' + Math.round(x.value / tot * 100) + '%</b></div>').join("");
  return '<div class="pie"><svg viewBox="0 0 68 68" class="piesvg">' + segs + '</svg><div class="plgs">' + legend + '</div></div>';
}

function renderPanel(s: GameState, A: Actions) {
  // 기업 내부 = 왼쪽 드로어, 투자/전략/용어집 = 오른쪽 드로어 (독립적으로 동시에 열림)
  const DW = "min(360px,86%)";   // 드로어 폭 — 국가 시트가 겹치지 않게 인셋
  document.documentElement.style.setProperty("--lw", s.ui.leftPanel !== "none" ? DW : "0px");
  document.documentElement.style.setProperty("--rw", s.ui.panel !== "none" ? DW : "0px");
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
  o.querySelectorAll<HTMLElement>(".enter").forEach(b => b.onclick = () => A.alloc(b.dataset.n!, 1));
  o.querySelectorAll<HTMLElement>(".op").forEach(b => { if (!b.classList.contains("dis")) b.onclick = () => A.operate(b.dataset.cap as Cap, b.dataset.op!); });
  const rd = document.getElementById("raiseDebt") as HTMLButtonElement | null;
  if (rd && !rd.disabled) rd.onclick = () => A.raiseDebt();
  const reC = document.getElementById("mReCompany"); if (reC) reC.onclick = () => A.toCompany();
  const reI = document.getElementById("mReIndustry"); if (reI) reI.onclick = () => A.toIndustry();
  const reT = document.getElementById("mToTitle"); if (reT) reT.onclick = () => A.toTitle();
  o.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", () => A.studyIntel(b.dataset.gics!)));
}

function panelBody(s: GameState, panel: string): string {
  let h = "";
  const you = s.firms[s.youIdx];
  if (panel === "company") {
    const cf = monthlyCashflow(s); const upk = allocUpkeep(s, s.youIdx); const net = cf - upk;
    h += '<div class="card"><div class="kv"><span>현금</span><b>$' + fmt(you.cash) + 'B</b></div><div class="kv"><span>월 수입(영업)</span><b class="' + (cf >= 0 ? 'gold' : 'red') + '">' + (cf >= 0 ? '+' : '') + cf.toFixed(1) + 'B</b></div><div class="kv"><span>월 할당 유지비</span><b class="red">-' + upk.toFixed(1) + 'B</b></div><div class="kv"><span>월 순현금</span><b class="' + (net >= 0 ? 'gold' : 'red') + '">' + (net >= 0 ? '+' : '') + net.toFixed(1) + 'B</b></div><div class="kv"><span>부채</span><b>$' + fmt(you.debt) + 'B</b></div><div class="kv"><span>신용등급</span><b class="' + (leverage(s) <= 4 ? 'gold' : 'red') + '">' + creditRating(s) + '</b></div><div class="kv"><span>전 세계 점유율</span><b class="gold">' + (myShare(s) * 100).toFixed(1) + '%</b></div><div class="kv"><span>WACC(할인율)</span><b>' + (waccOf(s) * 100).toFixed(1) + '%</b></div></div>';
    h += '<div class="sect">역량</div><div class="card">' + capBars(k => you.caps[k]) + '</div>';
    const total = s.marketOrder.reduce((a, n) => a + s.markets[n].size, 0);
    h += '<div class="sect">경쟁사</div>' + s.firms.filter(f => f.key !== you.key).map(f => {
      const fsh = total > 0 ? capturedSize(s, f.key) / total * 100 : 0;
      return '<div class="card"><div class="kv"><b style="color:' + f.col + '">' + f.name + '</b><span class="mute small">점유율 ' + fsh.toFixed(0) + '%</span></div>' + capBars(k => f.caps[k]) + '</div>';
    }).join("");
  } else if (panel === "strategy") {
    // M&A(경쟁사 인수)
    h += '<div class="sect">M&A — 경쟁사 인수</div>';
    const tgts = acquireTargets(s);
    if (!tgts.length) h += '<div class="card mute small">인수할 경쟁사가 없습니다 — 이미 시장을 정리했습니다.</div>';
    else tgts.forEach(t => {
      const can = you.cash >= t.price;
      h += '<button class="proj mna" data-key="' + t.key + '"><div class="h"><span style="color:' + t.col + '">' + t.name + '</span> 인수<span class="bdg ' + (can ? 'go' : 'no') + '">$' + fmt(t.price) + 'B</span></div><div class="e"><b>경쟁자 제거</b> + 점유율 흡수(역량은 안 합쳐짐) · 현 점유율 ' + (t.share * 100).toFixed(0) + '%</div></button>';
    });
    // 3) 재무(자금 조달) — 차입여력은 벌이(EBITDA)에 비례
    const room = borrowRoom(s); const tranche = Math.min(40, Math.floor(room)); const canB = tranche >= 5;
    h += '<div class="sect">재무 — 자금 조달</div>';
    h += '<div class="card"><div class="kv"><span>현금</span><b>$' + fmt(you.cash) + 'B</b></div><div class="kv"><span>부채</span><b>$' + fmt(you.debt) + 'B</b></div>' +
      '<div class="kv"><span>신용등급</span><b class="' + (leverage(s) <= 4 ? 'gold' : 'red') + '">' + creditRating(s) + '</b></div>' +
      '<div class="kv"><span>레버리지(순부채/EBITDA)</span><b>' + leverage(s).toFixed(1) + 'x</b></div>' +
      '<div class="kv"><span>차입여력</span><b>$' + fmt(room) + 'B</b></div>' +
      '<div class="kv"><span>이자율 · WACC</span><b>' + (debtRate(s) * 100).toFixed(1) + '% · ' + (waccOf(s) * 100).toFixed(1) + '%</b></div>' +
      '<button class="actbtn" id="raiseDebt"' + (canB ? '' : ' disabled') + '>' + (canB ? '부채로 +$' + tranche + 'B 조달' : '차입여력 소진 — 점유율(벌이)을 키우세요') + '</button>' +
      '<div class="mute small" style="margin-top:6px">대출 한도 = 4 × 연 EBITDA. 레버리지가 오르면 신용등급↓·이자↑. 현금 음수가 12개월 지속되면 파산합니다.</div></div>';
    // 4) 해외진출(프론티어 시장 진출 — 자원 할당 시작)
    h += '<div class="sect">해외진출 — 신규 시장 (지도에서 클릭해 진출)</div>';
    const fr = frontierMarkets(s);
    if (!fr.length) h += '<div class="card mute small">모든 시장에 진출했습니다.</div>';
    else fr.forEach(m => {
      const started = (you.alloc[m.name] || 0) > 0;
      const ec = entryCost(s, m.name); const broke = !started && you.cash < ec;
      h += '<button class="proj enter" data-n="' + esc(m.name) + '"' + (started || broke ? ' disabled' : '') + '><div class="h">🌏 ' + m.ko + (started ? '<span class="bdg go">전개 중</span>' : '<span class="bdg">진입장벽 $' + ec + 'B</span>') + '</div><div class="e">규모 $' + m.size + 'B · 아무도 없는 시장 — 진출 시 100%로 시작' + (broke ? ' · <b>자금 부족</b>' : '') + '</div></button>';
    });
  } else if (panel === "tech") {
    // 1) 진행 중인 개발(동시 여러 개) — 가속/리스크/취소
    if (you.ventures.length) {
      h += '<div class="sect">진행 중인 개발</div>';
      you.ventures.forEach(v => {
        h += '<div class="venture">' + ring(v.progress) + '<div class="vt">🔬 ' + CAPKO[v.cap] + ' 역량 개발</div><div class="vd">완성 시 ' + CAPKO[v.cap] + ' +' + v.payoff + '</div>' +
          '<div class="vmeta"><span class="chip">진행 ' + Math.round(v.progress) + '%</span>' + (v.risk > 0 ? '<span class="chip risk">⚠️ 리스크 ' + v.risk + '</span>' : '<span class="chip">리스크 없음</span>') + '</div>' +
          '<div class="ops">' +
            opbtn(s, v.cap, "accel", "⏩ 가속", "진행+, -$10B") +
            opbtn(s, v.cap, "risk", "🛡️ 리스크 대응", "리스크 1 해소") +
            opbtn(s, v.cap, "cancel", "✕ 취소", "일부 회수") +
          '</div></div>';
      });
    }
    // 2) 새 개발 착수(미진행 역량) — 동시 여러 개 가능
    h += '<div class="sect">새 역량 개발 — 착수</div>';
    strategyProjects(s).forEach((p: Project) => {
      if (you.ventures.some(v => v.cap === p.cap)) return;   // 이미 진행 중인 역량은 제외
      const go = p.npv > 0; const afford = you.cash >= p.capex;
      h += '<button class="proj" data-cap="' + p.cap + '"><div class="h">' + p.h + (go ? '<span class="bdg go">투자 적격</span>' : '<span class="bdg no">NPV-</span>') + '</div><div class="e">' + p.e + '</div><div class="fin"><span class="' + (afford ? '' : 'neg') + '">Capex $' + p.capex + 'B</span><span class="gold">점유율 +' + (p.dShare * 100).toFixed(1) + '%p</span><span class="' + (go ? 'pos' : 'neg') + '">NPV $' + fmt(p.npv) + 'B</span></div></button>';
    });
    h += '<div class="mute small">역량이 높을수록 그 KSF를 원하는 시장에서 <b>공략 영향력</b>이 커집니다(영향력 = 할당 × 역량 × 적합도).</div>';
    // 3) 테크트리(영구 업글 — 할당 상한·마진·속도)
    h += '<div class="sect">테크트리 — 영구 업그레이드</div>';
    h += '<div class="card mute small">연구 노드로 <b>영구 역량</b> + 경제 효과(마진·고정비·개발속도·<b>할당 상한</b>)를 얻습니다.</div>';
    researchOptions(s).forEach(o => {
      const n = o.node;
      if (o.unlocked) h += '<div class="proj tech done"><div class="h">' + n.name + '<span class="bdg go">완료 ✓</span></div><div class="e">' + n.desc + '</div></div>';
      else if (o.available) { const can = you.cash >= n.cost; h += '<button class="proj tech" data-key="' + n.key + '"><div class="h">' + n.name + '<span class="bdg ' + (can ? 'go' : 'no') + '">$' + n.cost + 'B</span></div><div class="e">' + n.desc + '</div></button>'; }
      else h += '<div class="proj tech locked"><div class="h">🔒 ' + n.name + '</div><div class="e">선행 필요: ' + n.req.map(r => TECH_NODES.find(x => x.key === r)?.name || r).join(", ") + '</div></div>';
    });
  } else if (panel === "guide") {
    h += '<div class="card">한 기업을 운영해 <b>세계 시장 점유율 1위</b>에 오르는 실시간 경영 전략 게임입니다.</div>';
    h += '<div class="sect">🏆 승리 조건 (둘 중 하나)</div><div class="card">' +
      '<div class="kv"><span>① 완전 장악</span><b class="gold">모든 시장 1위</b></div>' +
      '<div class="kv"><span>② 마감 시 1위</span><b class="gold">~' + dateLabel(END_MONTHS) + '</b></div>' +
      '<div class="mute small" style="margin-top:4px">지도 전체가 내 색이 되면 즉시 승리. 아니면 마감(' + dateLabel(END_MONTHS) + ') 시점에 점유율 1위인 기업이 승리합니다.</div></div>';
    h += '<div class="sect">플레이 방법</div><div class="card mute small" style="line-height:1.7">' +
      '① <b>국가를 클릭</b> → 그 시장이 원하는 역량(KSF)·기업별 점유율 확인<br>' +
      '② 🎯<b>공략(자원 투입)</b> — 그 시장에 직접 자원을 부어 <b>점유율을 능동적으로</b> 끌어올립니다. 적합도(KSF)가 높을수록 효과적, 안 유지하면 약해집니다<br>' +
      '③ 📈<b>전략</b>에서 약한 역량에 투자 — 역량이 높을수록 공략이 강해집니다(시장 적합도↑)<br>' +
      '④ <b>▶</b> 진행 · <b>⏸</b> 판단. 수입(월 현금흐름)은 점유율에서 나와 재투자' + '</div>';
    h += '<div class="sect">전략 메뉴</div><div class="card mute small" style="line-height:1.7">' +
      '🎯 <b>공략</b>(국가 시트) — 자원 투입으로 그 시장 점유율 직접 상승<br>' +
      '🏢 기업 내부 · 🔬 연구개발(역량·테크) · 🏛️ 로비(시장 선호를 우리에게 유리하게)<br>' +
      '📈 전략: <b>내부개발</b>(역량) · <b>M&A</b>(인수) · <b>재무</b>(부채) · <b>해외진출</b>' + '</div>';
    h += '<div class="sect">팁</div><div class="card mute small">점유율 <b class="red">10% 미만</b>이면 위기입니다. 약한 시장을 진단해 맞는 역량에 투자하거나, 약한 경쟁사를 <b>M&A</b>로 흡수해 단번에 점유율을 끌어올리세요.</div>';
  } else if (panel === "intel") {
    const it = industryIntel(scenarioGics(s.scenario.key));
    h += '<div class="card mute small">현재 산업 <b>' + esc(it.ko) + '</b> — The Industry Brief 실데이터. KSF·실제 1위 기업을 읽고 어디에 투자할지 판단하세요.</div>';
    h += intelBlock(it);
    if (it.reportFile) h += '<a class="rlink big" data-gics="' + esc(it.gics) + '" href="https://dshseungwon.github.io/daily-industry-report/' + esc(it.reportFile) + '" target="_blank" rel="noopener">📖 브리프 리포트 전문 읽기 ↗</a>';
  } else if (panel === "codex") {
    const got = unlockedGics();
    h += '<div class="sect">📚 수집한 산업 인텔 ' + got.length + '/' + intelTotal() + '</div>';
    if (got.length) h += got.map(g => { const it = industryIntel(g); return '<div class="codex"><div class="t">' + esc(it.ko) + (it.sector ? ' <span class="en">' + esc(it.sector) + '</span>' : '') + '</div>' + (it.ksf ? ksfChips(it.ksf) + '<div class="d">' + it.why + '</div>' : '<div class="d mute">KSF 데이터 준비중</div>') + '</div>'; }).join("");
    else h += '<div class="card mute small">📊 산업 인텔을 열거나 브리프 리포트를 읽으면 여기에 수집됩니다.</div>';
    h += '<div class="sect">용어</div>';
    h += CODEX.map(c => '<div class="codex"><div class="t">' + c.t + (c.en ? ' <span class="en">' + c.en + '</span>' : '') + '</div><div class="d">' + c.d + '</div></div>').join("");
  } else if (panel === "log") {
    h += '<div class="card mute small">시장에서 일어난 일들 — 트렌드·규제, 개발 완성, 경쟁사 인수·파산, 진출 등(최근 40건).</div>';
    h += s.log.length
      ? '<div class="logfeed">' + s.log.map(l => '<div class="logitem">' + esc(l) + '</div>').join("") + '</div>'
      : '<div class="card mute small">아직 기록된 활동이 없습니다. ▶로 시간을 진행하세요.</div>';
  } else if (panel === "menu") {
    h += '<div class="card mute small">진행 중인 게임을 떠나 다시 선택합니다. (현재 게임은 저장되지 않습니다)</div>';
    h += '<div class="menucol">' +
      '<button class="btn" id="mReCompany">🏢 기업 다시 선택 <span class="mute">· 같은 산업</span></button>' +
      '<button class="btn ghost" id="mReIndustry">🏭 산업 다시 선택</button>' +
      '<button class="btn ghost" id="mToTitle">🏠 타이틀로 나가기</button>' +
      '</div>';
  }
  return h;
}
function opbtn(s: GameState, cap: Cap, action: string, h: string, e: string) {
  const v = s.firms[s.youIdx].ventures.find(x => x.cap === cap);
  const ok = canOperate(s, s.youIdx, cap, action);
  const cd = v && !ok ? Math.max(0, (v.cooldown[action] || 0) - s.date) : 0;
  return '<button class="op' + (ok ? '' : ' dis') + '" data-cap="' + cap + '" data-op="' + action + '"><div class="oh">' + h + '</div><div class="oe">' + (ok ? e : '쿨다운 ' + cd + '개월') + '</div></button>';
}
const panelTitle = (p: string) => ({ company: "🏢 기업 내부", strategy: "📈 전략 (M&A·재무·진출)", tech: "🔬 연구개발", intel: "📊 산업 인텔", guide: "❓ 플레이 가이드", codex: "📖 용어집", log: "📜 활동 로그", menu: "☰ 게임 메뉴" } as Record<string, string>)[p] || "";
function ring(pct: number) { const C = 2 * Math.PI * 16, off = C * (1 - pct / 100); return '<svg class="ring" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" fill="none" stroke="#3a2c55" stroke-width="5"/><circle cx="21" cy="21" r="16" fill="none" stroke="#cbb3ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 21 21)"/><text x="21" y="25" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + Math.round(pct) + '%</text></svg>'; }

function renderSheet(s: GameState, A: Actions) {
  const el = document.getElementById("sheet")!;
  if (!s.ui.country) { el.className = "hide"; el.innerHTML = ""; return; }
  const m = s.markets[s.ui.country]; if (!m) { el.className = "hide"; return; }
  // 닫힌 프론티어 시장 → 진출 시작(자원 할당) 시트
  if (!s.marketOrder.includes(m.name)) {
    const me0 = s.firms[s.youIdx]; const starting = (me0.alloc[m.name] || 0) > 0;
    const ec = entryCost(s, m.name); const broke = !starting && me0.cash < ec;
    el.className = "sheet";
    el.innerHTML = '<button class="x" id="closeSheet">✕</button><h3>🌏 ' + m.ko + ' <span class="mute small">' + m.name + '</span></h3>' +
      '<div class="kv"><span>상태</span><b class="mute">' + (starting ? '진출 전개 중…' : '미진출 시장') + '</b></div>' +
      '<div class="kv"><span>시장 규모</span><b>$' + m.size + 'B</b></div>' +
      '<div class="kv"><span>진입장벽(일시금)</span><b>$' + ec + 'B</b></div>' +
      '<div class="card mute small">진출하려면 <b>진입장벽 돌파 비용 $' + ec + 'B</b>(목돈)를 한 번 지불합니다. 이후 본진에서 자원이 전개돼 <b>아무도 없는 시장이라 100%로 진입</b>합니다. 경쟁사가 들어오면 영향력으로 다툽니다. (1단계 유지는 무료, 집중할수록 월 유지비)</div>' +
      '<button class="actbtn" id="enterBtn"' + (starting || broke ? ' disabled' : '') + '>' + (starting ? '🚩 진출 전개 중…' : broke ? '💸 자금 부족 ($' + ec + 'B 필요)' : '🚩 진출 — 진입장벽 $' + ec + 'B 지불') + '</button>';
    document.getElementById("closeSheet")!.onclick = () => A.selectCountry(null);
    const eb = document.getElementById("enterBtn") as HTMLButtonElement | null;
    if (eb && !eb.disabled) eb.onclick = () => A.alloc(m.name, 1);
    return;
  }
  const lead = s.firms.find(f => f.key === m.leader)!;
  const top = (CAPS.slice().sort((a, b) => (m.pref[b] || 0) - (m.pref[a] || 0)))[0];
  el.className = "sheet";
  const sharePie = pieChart(s.firms.map(f => ({ label: f.name, value: shareOf(s, m, f.key), color: f.col })).sort((a, b) => b.value - a.value));
  el.innerHTML = '<button class="x" id="closeSheet">✕</button><h3>' + m.ko + ' <span class="mute small">' + m.name + '</span></h3>' +
    '<div class="kv"><span>시장 규모</span><b>$' + m.size + 'B</b></div>' +
    '<div class="kv"><span>현재 1위</span><b style="color:' + lead.col + '">' + lead.name + '</b></div>' +
    '<div class="kv"><span>소비자 핵심 선호</span><b style="color:' + CAPCOL[top] + '">' + CAPKO[top] + '</b></div>' +
    '<div class="sect">기업별 점유율</div><div class="card">' + sharePie + '</div>' +
    '<div class="sect">소비자 선호(KSF)</div><div class="card">' + capBars(k => (m.pref[k] || 0) * 100) + '</div>' +
    allocSect(s) +
    lobbyBtn(s);
  document.getElementById("closeSheet")!.onclick = () => A.selectCountry(null);
  const ap = document.getElementById("allocPlus") as HTMLButtonElement | null;
  if (ap && !ap.disabled) ap.onclick = () => A.alloc(s.ui.country!, 1);
  const am = document.getElementById("allocMinus") as HTMLButtonElement | null;
  if (am && !am.disabled) am.onclick = () => A.alloc(s.ui.country!, -1);
  const lb = document.getElementById("lobbyBtn") as HTMLButtonElement | null;
  if (lb && !lb.disabled) lb.onclick = () => A.lobby(s.ui.country!);
}
// 자원 할당 — 진출한 시장에 자원을 단계로 배치(상시). 끊으면 영향력 감소→점유율 하락.
function infBars(s: GameState, n: string): string {
  const rows = s.firms.map(f => ({ f, e: f.effort[n] || 0 })).filter(x => x.e > 0.05).sort((a, b) => b.e - a.e)
    .map(({ f, e }) => '<div class="barrow"><span class="bl" style="color:' + f.col + '">' + f.name + '</span><div class="bt"><div class="bf" style="width:' + Math.min(100, e / 6 * 100).toFixed(0) + '%;background:' + f.col + '"></div></div><span class="bv">' + e.toFixed(1) + '</span></div>').join("");
  return '<div class="sect" style="margin-top:6px">기업별 영향력</div>' + (rows || '<div class="mute small">아직 아무도 영향력이 없습니다.</div>');
}
function allocSect(s: GameState): string {
  const me = s.firms[s.youIdx]; const n = s.ui.country!; const m = s.markets[n];
  const lvl = me.alloc[n] || 0; const mx = maxAllocFor(s, s.youIdx, n);
  const hereCost = allocUpkeepAt(s, n, lvl), total = allocUpkeep(s, s.youIdx), nextCost = allocUpkeepAt(s, n, lvl + 1) - hereCost;
  return '<div class="sect">🎯 자원 할당 <span class="mute small">(' + regionOf(n) + ' 지역)</span></div><div class="card">' +
    '<div class="kv"><span>내 시장 점유율</span><b style="color:' + me.col + '">' + (shareOf(s, m, me.key) * 100).toFixed(0) + '%</b></div>' +
    '<div class="allocrow"><span class="bl" style="width:auto">할당 단계</span>' +
      '<button class="abtn" id="allocMinus"' + (lvl <= 0 ? ' disabled' : '') + '>－</button>' +
      '<b class="alvl">' + lvl + ' / ' + mx + '</b>' +
      '<button class="abtn" id="allocPlus"' + (lvl >= mx ? ' disabled' : '') + '>＋</button>' +
      '<span class="mute small" style="margin-left:auto">이 시장 월 $' + hereCost.toFixed(1) + 'B' + (lvl < mx ? ' (+1 → +$' + nextCost.toFixed(1) + ')' : '') + '</span></div>' +
    (lvl >= mx && mx < 8 ? '<div class="mute small">상한 도달 — 🔬연구개발의 테크트리로 ' + regionOf(n) + ' 할당 상한을 올리세요.</div>' : '') +
    '<div class="kv"><span>총 월 유지비</span><b class="' + (total > 0 ? 'gold' : 'mute') + '">$' + total.toFixed(1) + 'B/월</b></div>' +
    infBars(s, n) +
    '<div class="mute small" style="margin-top:4px"><b>영향력 = 할당 × 역량 × KSF 적합도</b>. 할당이 많을수록 월 유지비↑ — <b>수입 관리</b> 필수. 0으로 내리면 철수해 점유율이 줄어듭니다.</div></div>';
}
// 로비 버튼 — 이 시장의 KSF를 우리 강점 쪽으로(쿨다운·비용)
function lobbyBtn(s: GameState): string {
  const me = s.firms[s.youIdx];
  const n = s.ui.country!; const cost = lobbyCost(s, n); const ok = canAct(s, s.youIdx, "lobby:" + n);
  const cd = ok ? 0 : Math.max(0, (me.cooldowns["lobby:" + n] || 0) - s.date);
  const dis = !ok || me.cash < cost;
  return '<button class="actbtn" id="lobbyBtn"' + (dis ? ' disabled' : '') + '>🏛️ 로비 — 시장 선호를 우리에게 유리하게 ' + (ok ? '($' + cost + 'B)' : '(쿨다운 ' + cd + '개월)') + '</button>';
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
  const won = s.ui.over.won; const me = s.firms[s.youIdx];
  const head = won
    ? '<div class="winburst">🎉</div><div class="confetti">🎊✨🏆✨🎊</div><h3 class="gold">축하합니다 — 승리!</h3><div class="mrow"><b style="color:' + me.col + '">' + me.name + '</b>(으)로 ' + s.ui.over.msg + '</div>'
    : '<h3>' + s.ui.over.msg + '</h3>';
  el.innerHTML = '<div class="modal' + (won ? " victory" : "") + '">' + head +
    '<div class="mrow mute small">' + s.scenario.ko + ' · 최종 점유율 ' + (myShare(s) * 100).toFixed(0) + '%</div>' +
    '<div class="mbtns"><button class="btn ghost" id="toTitle">' + (won ? "타이틀로" : "다른 산업 고르기") + '</button><button class="btn" id="restart">다시 하기</button></div></div>';
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
    '<button class="btn big ghost" id="toOnline">온라인 플레이 (베타)</button>' +
    '<p class="src">데이터: <a href="https://dshseungwon.github.io/daily-industry-report/" target="_blank" rel="noopener">The Industry Brief</a></p>' +
    '</div></div>';
  document.getElementById("toIndustry")!.onclick = () => A.toIndustry();
  document.getElementById("toOnline")!.onclick = () => A.goOnline();
}

export function renderLobby(app: HTMLElement, A: Actions) {
  app.innerHTML =
    '<div class="screen title"><div class="hero">' +
    '<div class="logo">🌐 온라인 플레이</div>' +
    '<p class="lede">방을 만들어 <b>코드</b>를 친구에게 공유하거나, 받은 코드로 참가하세요.<br>각자 한 기업을 맡아 실시간으로 패권을 다툽니다.</p>' +
    '<div class="lobbyform">' +
      '<input id="pname" class="lin" placeholder="닉네임 (선택)" maxlength="12" />' +
      '<button class="btn big" id="createRoom">방 만들기</button>' +
      '<div class="lrow"><input id="rcode" class="lin" placeholder="방 코드 (예: AB3K)" maxlength="4" /><button class="btn" id="joinRoom">참가</button></div>' +
      '<div id="lerr" class="src" style="color:var(--red);min-height:16px"></div>' +
    '</div>' +
    '<button class="btn big ghost" id="lback">← 뒤로</button>' +
    '</div></div>';
  const nm = () => (document.getElementById("pname") as HTMLInputElement).value.trim();
  document.getElementById("createRoom")!.onclick = () => A.createRoom(nm());
  document.getElementById("joinRoom")!.onclick = () => { const c = (document.getElementById("rcode") as HTMLInputElement).value.trim().toUpperCase(); if (c) A.joinRoom(c, nm()); };
  document.getElementById("lback")!.onclick = () => A.toTitle();
}
export function lobbyError(msg: string) { const e = document.getElementById("lerr"); if (e) e.textContent = msg; }

// 세계 흐름 이벤트 큰 토스트(HOI 스타일) — 4초 노출
export function showEventBanner(icon: string, title: string, note: string) {
  let b = document.getElementById("eventbanner");
  if (!b) { b = document.createElement("div"); b.id = "eventbanner"; document.body.appendChild(b); }
  b.innerHTML = '<div class="evico">' + icon + '</div><div class="evtxt"><div class="evlabel">세계 흐름</div><div class="evt">' + title + '</div><div class="evn">' + note + '</div></div>';
  b.className = "show"; clearTimeout((b as any)._t); (b as any)._t = setTimeout(() => { b!.className = ""; }, 4200);
}
// 인게임 방 코드/인원 배지(온라인 전용)
export function setRoomBadge(text: string | null) {
  let b = document.getElementById("roombadge");
  if (!text) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("div"); b.id = "roombadge"; document.body.appendChild(b); }
  b.textContent = text;
}

export function renderIndustry(app: HTMLElement, A: Actions) {
  const all: BriefMeta[] = [BUILTIN_META, ...BRIEFS];
  const card = (m: BriefMeta, featured: boolean) => {
    const link = m.file ? '<a class="rlink" data-gics="' + esc(m.gics) + '" href="https://dshseungwon.github.io/daily-industry-report/' + esc(m.file) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">리포트 ↗</a>' : '';
    const it = industryIntel(m.gics);
    return '<button class="icard' + (featured ? ' feat' : '') + '" data-gics="' + esc(m.gics) + '">' +
      '<div class="ih"><span class="chip">' + (sectorKo[m.sector] || m.sector) + '</span>' + (featured ? '<span class="bdg go">기준 시나리오</span>' : '') + link + '</div>' +
      '<div class="iname">' + m.industry_ko + '</div>' +
      '<div class="ihead">' + m.headline_ko + '</div>' +
      (it.hasData && it.ksf ? ksfChips(it.ksf) : '') +
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
  app.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", () => A.studyIntel(b.dataset.gics!)));
}

// 산업 KSF 가중치를 칩 행으로(선택 카드용). 실데이터(0~1) → %.
function ksfChips(ksf: Record<Cap, number>): string {
  return '<div class="ksfchips">' + CAPS.map(k => '<span class="ksfchip"><i style="background:' + CAPCOL[k] + '"></i>' + CAPKO[k] + ' <b>' + Math.round(ksf[k] * 100) + '</b></span>').join("") + '</div>';
}
// 산업 인텔 블록(기업 선택 카드 + 인게임 패널 공용): KSF 막대 + why + 실제 기업·점유율.
function intelBlock(it: IndustryIntel): string {
  if (!it.hasData || !it.ksf) return '<div class="card mute small">이 산업의 KSF 실데이터는 준비 중입니다(섹터 근사치로 플레이).</div>';
  const ksf = it.ksf;
  let h = '<div class="sect">이 산업의 KSF(핵심성공요인)</div><div class="cbars">' + capBars(k => ksf[k] * 100) + '</div>';
  h += '<div class="ksfwhy">📌 ' + it.why + '</div>';
  if (it.topFirms.length) {
    const hasShare = it.topFirms.some(f => f.share !== undefined);
    h += '<div class="sect">실제 주요 기업' + (hasShare ? ' · 점유율' : '') + '</div><div class="firmrows">' +
      it.topFirms.map(f => '<div class="firmrow"><span>' + esc(f.en) + (f.ko ? ' <span class="mute">' + esc(f.ko) + '</span>' : '') + '</span>' + (f.share !== undefined ? '<b>' + f.share + '%</b>' : '') + '</div>').join("") + '</div>';
  }
  return h;
}
// 기업 caps에서 강점/약점과 플레이 성향을 한 줄 설명으로 도출(데이터에 별도 설명 필드가 없어 caps·역할에서 생성).
const CAP_MARKET: Record<Cap, string> = {
  tech: "기술 선도 시장(미국·독일·일본)", brand: "프리미엄·선진 시장",
  scale: "대량·신흥 시장(중국·인도)", global: "다국적 분산 시장",
};
function firmBlurb(f: import("./state").FirmDef, idx: number): string {
  let strong: Cap = CAPS[0], weak: Cap = CAPS[0];
  for (const k of CAPS) { if (f.caps[k] > f.caps[strong]) strong = k; if (f.caps[k] < f.caps[weak]) weak = k; }
  const role = idx === 0 ? "언더독에서 출발해 시장을 잘 읽고 투자해 역전하는 정석 플레이."
    : f.key === "global" ? "강한 출발 — 1위 자리를 지키는 게 관건."
    : "중간 위치 — 균형 잡힌 운영으로 빈틈을 노립니다.";
  return '<b class="up">강점 ' + CAPKO[strong] + '</b> → ' + CAP_MARKET[strong] + '에 유리.<br>' +
    '<b class="dn">약점 ' + CAPKO[weak] + '</b> → ' + CAP_MARKET[weak] + '은 투자로 보완.<br>' +
    '<span class="mute">' + role + '</span>';
}
export function renderCompany(app: HTMLElement, sc: import("./state").IndustryScenario, A: Actions) {
  const roleKo = (f: import("./state").FirmDef, i: number) => i === 0 ? "추천 · 우리 기업" : f.key === "global" ? "글로벌 1위" : "글로벌 경쟁사";
  const firmCard = (f: import("./state").FirmDef, idx: number) =>
    '<div class="ccard" style="border-left:4px solid ' + f.col + '"><div class="ch"><b style="color:' + f.col + '">' + f.name + '</b><span class="chip">' + roleKo(f, idx) + '</span></div>' +
    '<div class="cbars">' + capBars(k => f.caps[k]) + '</div>' +
    '<div class="cdesc">' + firmBlurb(f, idx) + '</div>' +
    '<button class="btn" data-idx="' + idx + '">이 기업으로 플레이</button></div>';
  app.innerHTML =
    '<div class="screen list"><div class="cwrap"><div class="lhead"><button class="back" id="back">←</button>' +
    '<div><h2>' + sc.ko + '</h2><div class="mute small">' + (sectorKo[sc.sector] || sc.sector) + '</div></div></div>' +
    '<div class="card"><div class="ihead">' + sc.headline + '</div>' +
    '<div class="ico"><a class="rlink" data-gics="' + esc(scenarioGics(sc.key)) + '" href="' + sc.reportUrl + '" target="_blank" rel="noopener">📖 브리프 리포트 읽기 ↗</a>' +
    (sc.real ? '<span class="bdg go">실데이터 · The Industry Brief</span>' : sc.preset ? '<span class="bdg no">KSF 데이터 준비중 — 섹터 프리셋</span>' : '<span class="bdg go">튜닝된 기준 시나리오</span>') + '</div>' +
    intelBlock(industryIntel(scenarioGics(sc.key))) + '</div>' +
    '<div class="sect">어느 기업을 운영할까요?</div>' +
    '<div class="ccards">' + sc.firms.map((f, i) => firmCard(f, i)).join("") + '</div></div></div>';
  document.getElementById("back")!.onclick = () => A.toIndustry();
  app.querySelectorAll<HTMLElement>(".ccard .btn").forEach(b => b.onclick = () => A.pickCompany(Number(b.dataset.idx)));
  app.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", () => A.studyIntel(b.dataset.gics!)));
}
