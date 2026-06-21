import { GameState, CAPS, CAPKO, WANTIC, Cap, CODEX, Candle } from "./state";
import { hasSave, savedLabel } from "./save";
import { allAchievements, unlockedIds } from "./achievements";
import { MAPDATA } from "./mapdata";
import { strategyProjects, myShare, waccOf, marketCap, intrinsicValue, naturalCaptured, utilizationOf, capacityCapex, dateLabel, canOperate, Project, shareOf, monthlyCashflow, grossMargin, fixedCost, operatingIncome, monthlyInterest, END_DAYS, DAYS_PER_MONTH, acquireTargets, lobbyCost, canAct, researchOptions, TECH_NODES, frontierMarkets, capturedSize, borrowRoom, creditRating, leverage, debtRate, allocUpkeep, allocUpkeepAt, maxAllocFor, regionOf, entryCost, bankruptcyIn, equityRaiseAmount, equityCooldownLeft, austeritySavings, liquidateValue, emergencyLoanAmount, gcap, matchScore, projectShare, hasControl, controllingThreat, equityMaxRaise, siCooldownLeft, stakeBuyCost, dividendIncome, cbPrincipal, cbMaxIssue, cbCooldownLeft, industryInitiatives } from "./engine";
import { BRIEFS, BriefMeta } from "./reports.data";
import { VERSION } from "./version";
import { industryIntel, scenarioGics, unlockedGics, intelTotal, IndustryIntel } from "./intel";
import { tutorialActive, tutorialSteps, tutorialAllDone } from "./tutorial";
import { sfx, isMuted, toggleMute, setBgmMood, startBgm, stopBgm } from "./audio";

export interface Actions {
  setSpeed(n: 0 | 1 | 2 | 3): void;
  togglePanel(p: string): void;
  selectCountry(n: string | null): void;
  startStrategy(cap: Cap): void;
  operate(cap: Cap, action: string): void;
  confirmOk(): void;
  confirmCancel(): void;
  restart(): void;
  continuePlaying(): void;
  pickIndustry(meta: BriefMeta): void;
  pickCompany(youIdx: number): void;
  claimFirm(idx: number): void;
  spectate(): void;
  skipTutorial(): void;
  replayTutorial(): void;
  toTitle(): void;
  toIndustry(): void;
  toCompany(): void;
  studyIntel(gics: string): void;
  goOnline(): void;
  createRoom(name: string): void;
  joinRoom(code: string, name: string): void;
  acquire(rivalKey: string): void;
  buyStakeOpen(rivalKey: string): void;
  buyStake(rivalKey: string, frac: number): void;
  raiseDebt(): void;
  buildCapacity(): void;
  toggleAutoCapacity(): void;
  raiseFI(): void;
  raiseSI(): void;
  raiseExec(asSI: boolean, amt: number): void;
  raiseCB(): void;
  raiseCBExec(amt: number): void;
  startInitiative(id: string): void;
  saveGame(): void;
  loadGame(): void;
  openAchievements(): void;
  lobby(marketName: string): void;
  research(key: string): void;
  raiseEquity(): void;
  emergencyLoan(): void;
  austerity(): void;
  liquidate(): void;
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
  globeMode = false; autoGlobePending = true;   // 새 게임도 기본 3D (ensureGlobe가 컨테이너 변경 시 안전 재생성)
  app.innerHTML =
    '<svg id="map" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet"></svg>' +
    '<div id="globe" class="hide"></div>' +
    '<div id="mapnav"><button id="globetoggle" title="2D / 3D 전환">🌐</button><button data-z="in" title="확대">＋</button><button data-z="out" title="축소">－</button><button data-z="reset" title="원위치">⤢</button></div>' +
    '<div id="topbar"></div>' +
    '<div id="overlayL" class="hide"></div>' +
    '<div id="overlay" class="hide"></div>' +
    '<div id="sheet" class="hide"></div>' +
    '<div id="confirmwrap" class="hide"></div>' +
    '<div id="banner" class="hide"></div>';
  const svg = document.getElementById("map") as unknown as SVGSVGElement;
  svg.innerHTML = '<g class="landmass">' + MAPDATA.map(c => '<path data-n="' + esc(c.n) + '" class="country" d="' + c.d + '"></path>').join("") + '</g><g id="transit"></g>';
  setupMapNav(svg, A);
  curA = A;
  const gt = document.getElementById("globetoggle"); if (gt) gt.onclick = () => toggleGlobe();
}
// 2D/3D 토글 버튼 라벨 동기화(좌하단 작은 🌐 + 큰 viewtoggle)
function setViewBtns(state: "3d" | "2d" | "loading"): void {
  const g = document.getElementById("globetoggle");
  const v = document.getElementById("viewtoggle");
  if (state === "loading") { if (g) g.textContent = "⏳"; if (v) v.textContent = "⏳ 로딩…"; return; }
  const is3d = state === "3d";
  if (g) { g.textContent = is3d ? "🗺️" : "🌐"; g.title = is3d ? "2D 지도로" : "3D 지구본으로"; }
  if (v) { v.textContent = is3d ? "🗺️ 2D 지도" : "🌐 3D 지구본"; v.title = is3d ? "2D 지도로" : "3D 지구본으로"; }
}

// ===== 3D 지구본 뷰(globe.gl, 동적 로딩) =====
let globeMode = false;
let autoGlobePending = true;   // 기본 뷰 = 3D 지구본(게임 시작 시 첫 render에서 자동 전환)
let globeMod: typeof import("./globe") | null = null;   // three.js 청크는 처음 3D 전환 때만 로드
let curA: Actions | null = null;
let curS: GameState | null = null;
const GLOBE_FRONTIER = "#2f4a2a";
// 국가명 → 표시 색: 우리 시장이면 리더색(개방)·프론티어색(미개방), 아니면 null(기본 inactive)
function colorForCountry(s: GameState, name: string): string | null {
  const m = s.markets[name];
  if (!m) return null;
  return s.marketOrder.includes(name) ? colByKey(s, m.leader) : GLOBE_FRONTIER;
}
function allocArcs(s: GameState): { from: string; to: string; color: string; level: number }[] {
  const me = s.firms[s.youIdx]; const out: { from: string; to: string; color: string; level: number }[] = [];
  for (const n in me.alloc) { const lvl = me.alloc[n]; if (lvl) out.push({ from: me.home, to: n, color: me.col, level: lvl }); }
  return out;
}
function showToast(msg: string): void {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t && t.classList.remove("show"), 6000);
}
async function toggleGlobe(): Promise<void> {
  globeMode = !globeMode;
  const mapEl = document.getElementById("map");
  const g = document.getElementById("globe");
  sfx("click");
  if (globeMode && g) {
    setViewBtns("loading");
    try {
      if (!globeMod) globeMod = await import("./globe");   // 최초 1회 three.js 로드
      if (mapEl) mapEl.classList.add("hide");
      g.classList.remove("hide");
      globeMod.ensureGlobe(g, (name) => { if (curA) curA.selectCountry(name); });
      globeMod.resizeGlobe();   // 재사용/창크기 변동 대비 크기 보정
      if (!g.querySelector("canvas")) throw new Error("globe canvas 미생성 (WebGL?)");   // 가시성 자가진단
      if (curS) { globeMod.paintGlobe((n) => colorForCountry(curS!, n)); globeMod.setGlobeArcs(allocArcs(curS)); }
      setViewBtns("3d");
    } catch (err) {
      globeMode = false;
      if (g) g.classList.add("hide");
      if (mapEl) mapEl.classList.remove("hide");
      setViewBtns("2d");
      const msg = "3D 로드 실패: " + (err instanceof Error ? (err.message + "\n" + (err.stack || "")) : String(err));
      console.error("[globe]", err);
      showToast(msg);
    }
  } else {
    if (g) g.classList.add("hide");
    if (mapEl) mapEl.classList.remove("hide");
    setViewBtns("2d");
  }
}
// 자원 이동(전송) 시각화 — 본진→대상으로 점이 흐름(CoC식)
const centroidCache: Record<string, [number, number] | null> = {};
let _mapByName: Record<string, string> | null = null;
function mapPathD(name: string): string | undefined {
  if (!_mapByName) { _mapByName = {}; for (const c of MAPDATA) _mapByName[c.n] = c.d; }
  return _mapByName[name];
}
// 국가 중심 — 전체 bbox가 아니라 '본토(면적 최대 서브패스)'의 중심을 쓴다.
// (France 해외영토·USA 알래스카·Russia 경도횡단·Indonesia 군도는 전체 bbox 중심이 바다에 찍혀 보급선이 엉뚱한 곳을 가리킴)
function centroidOf(name: string): [number, number] | null {
  if (name in centroidCache) return centroidCache[name];
  const d = mapPathD(name);
  let best: [number, number] | null = null, bestArea = -1;
  if (d) {
    for (const sub of d.split(/(?=M)/)) {                       // 서브패스(M 기준) 분할 — d는 M/L/Z 절대좌표 폴리곤
      const nums = sub.match(/-?\d+(?:\.\d+)?/g);
      if (!nums || nums.length < 4) continue;
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (let i = 0; i + 1 < nums.length; i += 2) {             // 연속쌍 = (x,y) 정점
        const x = +nums[i], y = +nums[i + 1];
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
      const area = (maxx - minx) * (maxy - miny);
      if (area > bestArea) { bestArea = area; best = [(minx + maxx) / 2, (miny + maxy) / 2]; }
    }
  }
  if (best) centroidCache[name] = best;                          // 유효값만 캐시(실패는 다음 렌더 재시도)
  return best;
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
    const x1 = hb[0], y1 = hb[1], x2 = to[0], y2 = to[1];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    let px = -dy / len, py = dx / len; if (py > 0) { px = -px; py = -py; }   // 수직 오프셋 — 위로 휘게
    const lift = Math.min(len * 0.32, 72);
    const cx = (x1 + x2) / 2 + px * lift, cy = (y1 + y2) / 2 + py * lift;
    const d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    html += '<path d="' + d + '" fill="none" stroke="' + me.col + '" stroke-width="' + (1.3 + lvl * 0.3).toFixed(1) + '" stroke-linecap="round" class="arcglow"/>';            // 글로우(블러)
    html += '<path d="' + d + '" fill="none" stroke="' + me.col + '" stroke-width="' + (0.7 + lvl * 0.2).toFixed(1) + '" stroke-linecap="round" stroke-dasharray="1.5 6" class="arcflow"/>';   // 흐르는 코어
    html += '<circle cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="2.5" fill="none" stroke="' + me.col + '" stroke-width="1.6" class="arcping"/>';   // 타깃 펄스
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
  // 멀티터치 지원: 1손가락 = 팬/탭, 2손가락 = 핀치 줌(+ 중점 팬). 데스크톱 휠 줌도 유지.
  const pts = new Map<number, { x: number; y: number }>();
  let moved = false, sx = 0, sy = 0, tx0 = 0, ty0 = 0, pinchDist = 0, pmx = 0, pmy = 0;

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAround(svg, e.clientX, e.clientY, e.deltaY > 0 ? 1 / 1.15 : 1.15);
  }, { passive: false });

  const onMove = (e: PointerEvent) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arr = [...pts.values()];
    if (arr.length >= 2) {                       // 핀치 줌 + 두 손가락 중점 팬
      const [a, b] = arr;
      const dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (pinchDist > 0) {
        zoomAround(svg, mx, my, dist / pinchDist);
        mtx += mx - pmx; mty += my - pmy; clampXform(); applyXform(svg);
      }
      pinchDist = dist; pmx = mx; pmy = my; moved = true;
    } else {                                      // 한 손가락 팬
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (moved) { mtx = tx0 + dx; mty = ty0 + dy; clampXform(); applyXform(svg); }
    }
  };
  const onUp = (e: PointerEvent) => {
    const wasTap = pts.size === 1 && !moved;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinchDist = 0;
    if (pts.size === 1) { const p = [...pts.values()][0]; sx = p.x; sy = p.y; tx0 = mtx; ty0 = mty; }  // 남은 손가락이 새 팬 기준
    else if (pts.size === 0) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (wasTap) { const t = e.target as Element; const n = t && t.getAttribute ? t.getAttribute("data-n") : null; A.selectCountry(n || null); }
    }
  };
  svg.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = false; sx = e.clientX; sy = e.clientY; tx0 = mtx; ty0 = mty; }
    else if (pts.size === 2) { const a = [...pts.values()]; pinchDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); pmx = (a[0].x + a[1].x) / 2; pmy = (a[0].y + a[1].y) / 2; }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });

  document.querySelectorAll<HTMLElement>("#mapnav button[data-z]").forEach(b => b.onclick = () => {
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
    const fill = isOpen ? colByKey(s, m!.leader) : isFrontier ? "#2f4a2a" : "#23415f";
    if (p.getAttribute("fill") !== fill) p.setAttribute("fill", fill);   // 값 변화 시에만(필터 재래스터 방지)
    let cls = "country" + (isOpen ? " active" : isFrontier ? " frontier" : " inactive") + (s.ui.country === n ? " sel" : "");
    if (isOpen && !first && prevLeaders[n] !== undefined && prevLeaders[n] !== m!.leader) {
      const win = m!.leader === youKey;
      cls += win ? " flash-win" : " flash-lose";
      if (win) gained++; else if (prevLeaders[n] === youKey) lost++;
      // 애니메이션 재생을 위해 클래스 제거(리플로우 후 재적용)
      window.setTimeout(() => { const el = p; el.setAttribute("class", el.getAttribute("class")!.replace(/ flash-(win|lose)/g, "")); }, 1200);
    }
    if (isOpen) prevLeaders[n] = m!.leader; else if (isFrontier) delete prevLeaders[n];
    if (p.getAttribute("class") !== cls) p.setAttribute("class", cls);
  });
  if (gained > 0) sfx("conquer");
  else if (lost > 0) sfx("lost");
}

export function render(s: GameState, A: Actions) {
  curS = s; curA = A;
  if (autoGlobePending) { autoGlobePending = false; toggleGlobe(); }   // 기본 3D 진입(첫 render에서 1회)
  const sh = myShare(s);                       // 점유율 상황 → 배경음악 분위기
  setBgmMood(sh < 0.12 ? "crisis" : sh >= 0.55 ? "strong" : "calm");
  recolor(s);
  if (globeMode && globeMod) { globeMod.paintGlobe((n) => colorForCountry(s, n)); globeMod.setGlobeArcs(allocArcs(s)); }   // 3D 뷰: 리더색 + 할당 아크
  renderTransit(s);
  renderTop(s, A);
  renderPanel(s, A);
  renderSheet(s, A);
  renderConfirm(s, A);
  renderBanner(s, A);
  renderEmergency(s, A);
  renderGlobalMute(false);   // 인게임은 상단바 메뉴의 음소거 사용 → 전역 버튼 숨김
  renderTutorial(s, A);
}
// 첫 경영 가이드 체크리스트(진행 시 자동 체크)
function renderTutorial(s: GameState, A: Actions) {
  let el = document.getElementById("tutorial");
  if (!tutorialActive()) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "tutorial"; document.body.appendChild(el); }
  const steps = tutorialSteps(s), allDone = tutorialAllDone(s);
  el.innerHTML = '<div class="tuthead">🎓 첫 경영 가이드' + (allDone ? ' — 완료!' : '') + '<button class="x" id="tutSkip">✕</button></div>' +
    '<div class="tutsteps">' + steps.map(x => '<div class="tutstep' + (x.done ? ' done' : '') + '">' + (x.done ? '✅' : '⬜') + ' ' + x.label + '</div>').join("") + '</div>' +
    (allDone ? '<button class="btn" id="tutDone">좋아요, 시작!</button>' : '<div class="mute small">순서대로 해보세요 · 언제든 ✕로 닫기</div>');
  document.getElementById("tutSkip")!.onclick = () => A.skipTutorial();
  const d = document.getElementById("tutDone"); if (d) d.onclick = () => A.skipTutorial();
}
// 비상 경영 배너 — 현금<0 동안 상시. 파산 카운트다운 + 회생 조치 4종.
function renderEmergency(s: GameState, A: Actions) {
  let el = document.getElementById("emergency");
  const me = s.firms[s.youIdx];
  if (!me || me.cash >= 0 || s.ui.over) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "emergency"; document.body.appendChild(el); }
  const months = bankruptcyIn(s, s.youIdx);
  const eqAmt = equityRaiseAmount(s, s.youIdx), eqCd = equityCooldownLeft(s, s.youIdx);
  const loan = emergencyLoanAmount(s, s.youIdx), save = austeritySavings(s, s.youIdx), liq = liquidateValue(s, s.youIdx);
  const b = (id: string, dis: boolean, label: string) => '<button class="embtn" id="' + id + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
  el.innerHTML =
    '<div class="emhead">🚨 비상 경영 — 파산까지 <b>' + months + '개월</b> <span class="emcash">현금 $' + fmt(me.cash) + 'B</span></div>' +
    '<div class="embtns">' +
    b("emEquity", eqCd > 0, '🏦 증자 ' + (eqCd > 0 ? '쿨다운 ' + Math.ceil(eqCd / DAYS_PER_MONTH) + '개월' : '+$' + eqAmt + 'B' + (me.equityRaises > 0 ? ' (' + (me.equityRaises + 1) + '회차·체감)' : ''))) +
    b("emLoan", loan < 1, '💵 긴급 대출 ' + (loan < 1 ? '여력 없음' : '+$' + loan + 'B')) +
    b("emAusterity", save <= 0.05, '✂️ 비상 긴축 ' + (save > 0.05 ? '−$' + save.toFixed(1) + '/월' : '여지 없음')) +
    b("emLiquidate", liq <= 0, '🛑 개발 중단 ' + (liq > 0 ? '+$' + liq + 'B' : '없음')) +
    '</div>';
  const bind = (id: string, fn: () => void) => { const x = document.getElementById(id) as HTMLButtonElement | null; if (x && !x.disabled) x.onclick = fn; };
  bind("emEquity", () => A.raiseEquity());
  bind("emLoan", () => A.emergencyLoan());
  bind("emAusterity", () => A.austerity());
  bind("emLiquidate", () => A.liquidate());
}

function renderTop(s: GameState, A: Actions) {
  const t = document.getElementById("topbar")!;
  const me = s.firms[s.youIdx];
  const sp = (n: number, lab: string) => '<button class="spbtn' + (s.speed === n ? " on" : "") + '" data-sp="' + n + '">' + lab + '</button>';
  marketCap(s);   // 주가/발행주식수 lazy-init 보장
  const pv = me.priceHist.length > 1 ? me.priceHist[me.priceHist.length - 2] : me.price;
  const pchg = pv > 0 ? (me.price / pv - 1) * 100 : 0;
  t.innerHTML =
    '<div class="brand">더 체어맨</div>' +
    '<div class="myfirm" title="내 기업" style="border-color:' + me.col + '"><span class="fdot" style="background:' + me.col + '"></span><b style="color:' + me.col + '">' + me.name + '</b></div>' +
    '<div class="clock"><span class="date">' + dateLabel(s.date) + '</span><span class="mute small">~' + dateLabel(END_DAYS) + '</span>' + sp(0, "⏸") + sp(1, "▶") + sp(2, "▶▶") + sp(3, "▶▶▶") + '</div>' +
    '<div class="hstats"><span>점유율 <b>' + (myShare(s) * 100).toFixed(0) + '%</b></span><span>주가 <b class="pxv">$' + (me.price || 100).toFixed(0) + '</b> <span class="chg small ' + (pchg >= 0 ? 'gold' : 'red') + '">' + (pchg >= 0 ? '▲' : '▼') + Math.abs(pchg).toFixed(1) + '%</span></span><span>현금 <b class="' + (me.cash < 0 ? 'red' : '') + '">$' + fmt(me.cash) + 'B</b></span>' + (me.debt > 0 ? '<span>부채 <b>$' + fmt(me.debt) + 'B</b></span>' : '') + '</div>' +
    '<div class="menu">' +
      mbtn("menu", "☰", s, true) + mbtn("log", "📜", s, true) + mbtn("guide", "❓", s, true) + mbtn("codex", "📖", s, true) +
      '<button class="mbtn minor" id="muteBtn" title="소리 켜기/끄기">' + (isMuted() ? "🔇" : "🔊") + '</button>' +
      '<span class="mgap"></span>' + mbtn("company", "🏢", s) + mbtn("alloc", "🎯", s) + mbtn("strategy", "📈", s) + mbtn("market", "💹", s) + mbtn("tech", "🔬", s) + mbtn("intel", "📊", s) +
    '</div>' +
    '<div class="trend">📰 ' + s.trend.headline + ' — ' + s.trend.note + (me.ventures.length ? ' · 🔬 ' + me.ventures.map(v => CAPKO[v.cap] + ' ' + Math.round(v.progress) + '%').join(' · ') : '') + '</div>';
  t.querySelectorAll<HTMLElement>(".spbtn").forEach(b => b.onclick = () => A.setSpeed(Number(b.dataset.sp) as 0|1|2|3));
  t.querySelectorAll<HTMLElement>(".mbtn[data-p]").forEach(b => b.onclick = () => A.togglePanel(b.dataset.p!));
  document.getElementById("muteBtn")!.onclick = () => { const m = toggleMute(); if (!m) sfx("select"); renderTop(s, A); };
  // 드로어가 상단바(트렌드 줄) 아래에서 시작하도록 실제 높이를 반영(겹침 방지). 값이 바뀔 때만 set(불필요한 레이아웃 흔들림 방지).
  const th = (t.offsetHeight + 2) + "px";
  if (th !== lastTopbarH) { lastTopbarH = th; document.documentElement.style.setProperty("--topbar-h", th); }
}
let lastTopbarH = "";
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
// 지분구조 누적 막대: 창업자(금)·FI float(청회)·SI blocs(적). 합=100%.
function capTableBar(f: { ownership: number; float: number; blocs: { name: string; stake: number }[] }): string {
  const segs: [string, number, string][] = [["창업자", f.ownership, "#ffb81c"], ["FI", f.float, "#5a7088"]];
  f.blocs.forEach((b, i) => segs.push([b.name, b.stake, i % 2 ? "#c44456" : "#e8556b"]));
  return '<div class="ctbar">' + segs.map(([lb, v, c]) => v > 0.001 ? '<div class="ctseg" style="width:' + (v * 100).toFixed(1) + '%;background:' + c + '" title="' + lb + ' ' + (v * 100).toFixed(0) + '%"></div>' : '').join("") + '</div>';
}
// 도넛 파이 차트 — 점유율 슬라이스(기업 색).
function pieChart(slices: { label: string; value: number; color: string }[]): string {
  const tot = slices.reduce((a, x) => a + x.value, 0) || 1; const C = 2 * Math.PI * 26; let off = 0;
  const segs = slices.map(x => { const fr = x.value / tot; const seg = '<circle cx="34" cy="34" r="26" fill="none" stroke="' + x.color + '" stroke-width="13" stroke-dasharray="' + (fr * C).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off * C).toFixed(2) + '" transform="rotate(-90 34 34)"/>'; off += fr; return seg; }).join("");
  const legend = slices.map(x => '<div class="plg"><span class="pdot" style="background:' + x.color + '"></span>' + x.label + ' <b>' + Math.round(x.value / tot * 100) + '%</b></div>').join("");
  return '<div class="pie"><svg viewBox="0 0 68 68" class="piesvg">' + segs + '</svg><div class="plgs">' + legend + '</div></div>';
}

// 드로어 .dbody 스크롤 위치를 패널별로 기억(매 틱 innerHTML 재생성으로 리셋되는 것 방지)
const scrollMem: Record<string, number> = {};
let lastLeftP = "", lastRightP = "";
function renderPanel(s: GameState, A: Actions) {
  // 기업 내부 = 왼쪽 드로어, 투자/전략/용어집 = 오른쪽 드로어 (독립적으로 동시에 열림)
  const DW = "min(360px,86%)";   // 드로어 폭 — 국가 시트가 겹치지 않게 인셋
  document.documentElement.style.setProperty("--lw", s.ui.leftPanel !== "none" ? DW : "0px");
  document.documentElement.style.setProperty("--rw", s.ui.panel !== "none" ? DW : "0px");
  const left = document.getElementById("overlayL")!;
  if (s.ui.leftPanel === "none") { left.className = "hide"; left.innerHTML = ""; lastLeftP = ""; }
  else {
    const oldLB = left.querySelector(".dbody") as HTMLElement | null; if (oldLB && lastLeftP) scrollMem["l:" + lastLeftP] = oldLB.scrollTop;
    left.className = "drawer left";
    left.innerHTML = '<div class="dhead"><b>' + panelTitle(s.ui.leftPanel) + '</b><button class="x" id="closeL">✕</button></div><div class="dbody">' + panelBody(s, s.ui.leftPanel) + '</div>';
    lastLeftP = s.ui.leftPanel;
    document.getElementById("closeL")!.onclick = () => A.togglePanel(s.ui.leftPanel);
    const bcL = document.getElementById("buildCap") as HTMLButtonElement | null;   // 회사 패널(왼쪽 드로어)의 증설 버튼 바인딩
    if (bcL && !bcL.disabled) bcL.onclick = () => A.buildCapacity();
    const fiL = document.getElementById("raiseFI") as HTMLButtonElement | null;
    if (fiL && !fiL.disabled) fiL.onclick = () => A.raiseFI();
    const siL = document.getElementById("raiseSI") as HTMLButtonElement | null;
    if (siL && !siL.disabled) siL.onclick = () => A.raiseSI();
    const nlb = left.querySelector(".dbody") as HTMLElement | null; if (nlb) nlb.scrollTop = scrollMem["l:" + s.ui.leftPanel] || 0;
  }
  const o = document.getElementById("overlay")!;
  if (s.ui.panel === "none") { o.className = "hide"; o.innerHTML = ""; lastRightP = ""; return; }
  const oldRB = o.querySelector(".dbody") as HTMLElement | null; if (oldRB && lastRightP) scrollMem["r:" + lastRightP] = oldRB.scrollTop;
  o.className = "drawer";
  o.innerHTML = '<div class="dhead"><b>' + panelTitle(s.ui.panel) + '</b><button class="x" id="closePanel">✕</button></div><div class="dbody">' + panelBody(s, s.ui.panel) + '</div>';
  lastRightP = s.ui.panel;
  document.getElementById("closePanel")!.onclick = () => A.togglePanel(s.ui.panel);
  o.querySelectorAll<HTMLElement>(".proj:not(.mna):not(.tech):not(.enter)").forEach(b => b.onclick = () => A.startStrategy(b.dataset.cap as Cap));
  o.querySelectorAll<HTMLElement>(".initbtn").forEach(b => { if (!(b as HTMLButtonElement).disabled) b.onclick = () => A.startInitiative(b.dataset.id!); });
  o.querySelectorAll<HTMLElement>(".mna").forEach(b => b.onclick = () => A.acquire(b.dataset.key!));
  o.querySelectorAll<HTMLElement>(".buystake").forEach(b => { if (!(b as HTMLButtonElement).disabled) b.onclick = () => A.buyStakeOpen(b.dataset.key!); });
  o.querySelectorAll<HTMLElement>("button.tech").forEach(b => b.onclick = () => A.research(b.dataset.key!));
  o.querySelectorAll<HTMLElement>(".enter").forEach(b => b.onclick = () => A.alloc(b.dataset.n!, 1));
  o.querySelectorAll<HTMLElement>(".allocset").forEach(b => { if (!(b as HTMLButtonElement).disabled) b.onclick = () => A.alloc(b.dataset.n!, Number(b.dataset.d)); });
  { const acb = o.querySelector("#autoCapBtn") as HTMLElement | null; if (acb) acb.onclick = () => A.toggleAutoCapacity(); }
  o.querySelectorAll<HTMLElement>(".op").forEach(b => { if (!b.classList.contains("dis")) b.onclick = () => A.operate(b.dataset.cap as Cap, b.dataset.op!); });
  const rd = document.getElementById("raiseDebt") as HTMLButtonElement | null;
  if (rd && !rd.disabled) rd.onclick = () => A.raiseDebt();
  const cbBtn = document.getElementById("issueCB") as HTMLButtonElement | null;
  if (cbBtn && !cbBtn.disabled) cbBtn.onclick = () => A.raiseCB();
  const bc = document.getElementById("buildCap") as HTMLButtonElement | null;
  if (bc && !bc.disabled) bc.onclick = () => A.buildCapacity();
  const sv = document.getElementById("mSaveGame"); if (sv) sv.onclick = () => A.saveGame();
  const ld = document.getElementById("mLoadGame"); if (ld) ld.onclick = () => A.loadGame();
  const ac = document.getElementById("mAchievements"); if (ac) ac.onclick = () => A.openAchievements();
  const reC = document.getElementById("mReCompany"); if (reC) reC.onclick = () => A.toCompany();
  const reI = document.getElementById("mReIndustry"); if (reI) reI.onclick = () => A.toIndustry();
  const reT = document.getElementById("mToTitle"); if (reT) reT.onclick = () => A.toTitle();
  o.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", () => A.studyIntel(b.dataset.gics!)));
  const rt = document.getElementById("replayTut"); if (rt) rt.onclick = () => A.replayTutorial();
  const nrb = o.querySelector(".dbody") as HTMLElement | null; if (nrb) nrb.scrollTop = scrollMem["r:" + s.ui.panel] || 0;   // 스크롤 위치 복원
}

function panelBody(s: GameState, panel: string): string {
  let h = "";
  const you = s.firms[s.youIdx];
  if (panel === "alloc") {
    return allocManagerBody(s);
  } else if (panel === "company") {
    // 월간 손익계산서(회계 구조): 공헌이익 − 고정비 − 유지비 = 영업이익(EBITDA) − 이자 = 순이익
    const gross = grossMargin(s), fixc = fixedCost(s), upk = allocUpkeep(s, s.youIdx);
    const ebitda = operatingIncome(s), intr = monthlyInterest(s), divIn = dividendIncome(s), net = ebitda - intr + divIn;
    const sgn = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(1) + 'B';
    h += '<div class="card">'
      + '<div class="kv"><span>현금</span><b class="' + (you.cash < 0 ? 'red' : '') + '">$' + fmt(you.cash) + 'B</b></div>'
      + '<div class="pnl">'
      + '<div class="kv"><span>공헌이익(영업)</span><b class="' + (gross >= 0 ? 'gold' : 'red') + '">' + sgn(gross) + '</b></div>'
      + '<div class="kv"><span>− 고정비</span><b class="red">-' + fixc.toFixed(1) + 'B</b></div>'
      + '<div class="kv"><span>− 할당 유지비</span><b class="red">-' + upk.toFixed(1) + 'B</b></div>'
      + '<div class="kv tot"><span>= 영업이익(EBITDA)</span><b class="' + (ebitda >= 0 ? 'gold' : 'red') + '">' + sgn(ebitda) + '</b></div>'
      + (intr > 0 ? '<div class="kv"><span>− 이자비용</span><b class="red">-' + intr.toFixed(1) + 'B</b></div>' : '')
      + (divIn > 0.005 ? '<div class="kv"><span>+ 지분 배당 수익</span><b class="gold">+' + divIn.toFixed(divIn < 1 ? 2 : 1) + 'B</b></div>' : '')
      + '<div class="kv tot"><span>= 월 순이익(현금증감)</span><b class="' + (net >= 0 ? 'gold' : 'red') + '">' + sgn(net) + '</b></div>'
      + '</div>'
      + '<div class="kv"><span>시가총액(기업가치)</span><b class="gold">$' + fmt(marketCap(s)) + 'B</b></div>'
      + '<div class="kv"><span>부채</span><b>$' + fmt(you.debt) + 'B</b></div><div class="kv"><span>신용등급</span><b class="' + (leverage(s) <= 4 ? 'gold' : 'red') + '">' + creditRating(s) + '</b></div><div class="kv"><span>전 세계 점유율</span><b class="gold">' + (myShare(s) * 100).toFixed(1) + '%</b></div><div class="kv"><span>WACC(할인율)</span><b>' + (waccOf(s) * 100).toFixed(1) + '%</b></div>' + (you.equityRaises > 0 ? '<div class="kv"><span>유상증자</span><b class="red">' + you.equityRaises + '회 · 신용 부담↑</b></div>' : '') + '</div>';
    // 생산능력(공장) — 홈 전용. 점령 상한 + 고정비 driver. 수요(자연점령)>생산능력이면 증설 권장.
    const cap = Math.round(you.capacity), tgt = Math.round(you.capacityTarget), nat = Math.round(naturalCaptured(s, you.key));
    const chunk = Math.max(10, Math.round(you.capacityTarget * 0.2)), capex = capacityCapex(s, chunk);
    const useRate = Math.min(1, nat / Math.max(1, you.capacity));   // 가동률 = 수요 ÷ 생산능력(쓰는 비율)
    const constrained = nat > you.capacity + 1, homeKo = s.markets[you.home]?.ko || you.home;
    h += '<div class="sect">🏭 생산능력 (본국 ' + esc(homeKo) + ')</div><div class="card">'
      + '<div class="kv"><span>생산능력</span><b>' + cap + (tgt > cap ? ' <span class="mute small">→ ' + tgt + ' 증설중</span>' : '') + '</b></div>'
      + '<div class="kv"><span>수요(잠재 점령)</span><b' + (constrained ? ' class="gold"' : '') + '>' + nat + '</b></div>'
      + '<div class="kv"><span>가동률</span><b class="' + (constrained ? 'gold' : useRate < 0.55 ? 'red' : '') + '">' + (useRate * 100).toFixed(0) + '%' + (constrained ? ' · 수요초과(증설 권장)' : useRate < 0.55 ? ' · 유휴설비(과잉)' : ' · 여유') + '</b></div>'
      + '<button class="actbtn" id="buildCap"' + (you.cash < capex ? ' disabled' : '') + '>🏭 증설 +' + chunk + ' (CAPEX $' + capex + 'B)' + (you.cash < capex ? ' · 자금부족' : '') + '</button>'
      + '</div>';
    // 지분구조·지배구조: 경영권(나 ≥ 최대 적대블록 & ≥20%) + 유상증자(슬라이더로 금액 직접 조절).
    const ctrl = hasControl(s), ownP = you.ownership * 100, threatP = controllingThreat(s) * 100;
    const fiMax = equityMaxRaise(s, s.youIdx, false), siMax = equityMaxRaise(s, s.youIdx, true);
    const fiCd = equityCooldownLeft(s), siCd = siCooldownLeft(s);
    h += '<div class="sect">🪪 지분구조 · 지배구조</div><div class="card">'
      + '<div class="kv"><span>경영권</span><b class="' + (ctrl ? 'gold' : 'red') + '">' + (ctrl ? '✓ 확보' : '⚠️ 상실') + '</b></div>'
      + '<div class="kv"><span class="mute small">내 지분 ' + ownP.toFixed(0) + '% vs 최대 적대 지분 ' + threatP.toFixed(0) + '% (이보다 많아야 경영권 유지)</span></div>'
      + capTableBar(you)
      + '<div class="kv small"><span>창업자(나) <b class="gold">' + ownP.toFixed(0) + '%</b></span><span class="mute">재무적투자자 ' + (you.float * 100).toFixed(0) + '% · 전략적투자자 ' + threatP.toFixed(0) + '%</span></div>'
      + '<button class="actbtn" id="raiseFI"' + (fiCd > 0 || fiMax <= 0 ? ' disabled' : '') + '>🏦 유상증자 — 재무적 투자자' + (fiCd > 0 ? ' · 재충전 ' + Math.ceil(fiCd / DAYS_PER_MONTH) + '개월' : fiMax <= 0 ? ' · 지분 한도(20%)' : ' (최대 $' + fiMax + 'B)') + '</button>'
      + '<button class="actbtn" id="raiseSI"' + (siCd > 0 || siMax <= 0 ? ' disabled' : '') + '>🤝 유상증자 — 전략적 투자자' + (siCd > 0 ? ' · 재충전 ' + Math.ceil(siCd / DAYS_PER_MONTH) + '개월' : siMax <= 0 ? ' · 경영권 위협(불가)' : ' (최대 $' + siMax + 'B)') + '</button>'
      + '</div>';
    h += '<div class="sect">역량</div><div class="card">' + capBars(k => you.caps[k]) + '</div>';
    const total = s.marketOrder.reduce((a, n) => a + s.markets[n].size, 0);
    h += '<div class="sect">경쟁사</div>' + s.firms.filter(f => f.key !== you.key).map(f => {
      const fsh = total > 0 ? capturedSize(s, f.key) / total * 100 : 0;
      const fi = s.firms.indexOf(f);
      const netI = operatingIncome(s, fi) - monthlyInterest(s, fi);
      const g = (f.grudge && f.grudge[you.key]) || 0;   // 이 라이벌의 나에 대한 원한(태도)
      const stance = g >= 0.6 ? '<span class="red">⚔️ 적대(보복)</span>' : g >= 0.2 ? '<span class="gold">⚠️ 긴장</span>' : '<span class="mute">🤝 중립</span>';
      return '<div class="card"><div class="kv"><b style="color:' + f.col + '">' + f.name + '</b>' + stance + '</div>'
        + '<div class="kv small"><span class="mute">점유율 ' + fsh.toFixed(0) + '% · 월순이익 ' + (netI >= 0 ? '+' : '') + netI.toFixed(1) + 'B</span></div>'
        + capTableBar(f)
        + '<div class="kv small"><span class="mute">창업자 ' + (f.ownership * 100).toFixed(0) + '% · FI ' + (f.float * 100).toFixed(0) + '% · SI ' + (controllingThreat(s, fi) * 100).toFixed(0) + '%</span><span class="' + (hasControl(s, fi) ? 'mute' : 'red') + '">' + (hasControl(s, fi) ? '경영권 ✓' : '경영권 ⚠️') + '</span></div>'
        + capBars(k => f.caps[k]) + '</div>';
    }).join("");
  } else if (panel === "strategy") {
    // 산업 특화 전략 이니셔티브 — 그 산업의 실제 전략 메뉴(안정/도박/증설)
    h += '<div class="sect">🎯 산업 특화 전략</div>';
    const actInit = you.ventures.find(v => v.init);
    if (actInit) h += '<div class="card"><div class="kv"><b>진행 중 — ' + esc(actInit.name) + '</b><span class="gold">' + Math.round(actInit.progress) + '%</span></div><div class="mute small">완성 시 효과 적용 · 가속은 연구개발(🔬) 패널에서</div></div>';
    const inits = industryInitiatives(s);
    if (!inits.length && !actInit) h += '<div class="card mute small">이 산업의 특화 전략을 모두 수행했습니다.</div>';
    inits.forEach(it => {
      const badge = it.kind === "gamble" ? '<span class="bdg no">🎲 도박 ' + Math.round((it.successProb || 0) * 100) + '%</span>' : it.kind === "scale" ? '<span class="bdg">🏭 증설</span>' : '<span class="bdg go">안정</span>';
      const eff = it.effect;
      const parts: string[] = [];
      if (eff.caps) for (const k in eff.caps) parts.push(CAPKO[k as Cap] + ' +' + eff.caps[k as Cap]);
      if (eff.marginAdd) parts.push('마진↑'); if (eff.overheadCut) parts.push('고정비↓'); if (eff.capacityBonus) parts.push('생산능력 +' + eff.capacityBonus);
      const dis = !!actInit || you.cash < it.capex;
      h += '<button class="proj initbtn" data-id="' + it.id + '"' + (dis ? ' disabled' : '') + '><div class="h">' + esc(it.name) + badge + '</div>'
        + '<div class="e">' + esc(it.desc) + '</div>'
        + '<div class="fin"><span>Capex $' + it.capex + 'B · ~' + it.months + '개월</span><span class="gold">' + parts.join(' · ') + (it.kind === "gamble" ? ' (성공 시)' : '') + '</span></div></button>';
    });
    // M&A(경쟁사 인수)
    h += '<div class="sect">M&A · 지분 — 경쟁사</div>';
    const tgts = acquireTargets(s);
    if (!tgts.length) h += '<div class="card mute small">경쟁사가 없습니다 — 이미 시장을 정리했습니다.</div>';
    else tgts.forEach(t => {
      const f = s.firms.find(x => x.key === t.key)!;
      const can = you.cash >= t.price;
      const ti = s.firms.indexOf(f);
      const netI = operatingIncome(s, ti) - monthlyInterest(s, ti);
      const myDiv = Math.max(0, netI) * f.divRate * t.myStake;
      h += '<div class="card">'
        + '<div class="kv"><b style="color:' + t.col + '">' + t.name + '</b><span class="mute small">점유율 ' + (t.share * 100).toFixed(0) + '% · 내 보유 ' + (t.myStake * 100).toFixed(0) + '%</span></div>'
        + '<div class="kv small"><span class="mute">월순이익 ' + (netI >= 0 ? '+' : '') + netI.toFixed(1) + 'B · 배당성향 ' + Math.round(f.divRate * 100) + '%</span>' + (t.myStake > 0 ? '<span class="gold">내 배당 +' + myDiv.toFixed(myDiv < 1 ? 2 : 1) + 'B/월</span>' : '') + '</div>'
        + capTableBar(f)
        + '<div class="kv small"><span class="mute">창업자 ' + (t.founder * 100).toFixed(0) + '% · 공모주 ' + (f.float * 100).toFixed(0) + '%</span><span class="' + (t.controlled ? 'mute' : 'red') + '">' + (t.controlled ? '경영권 ✓' : '경영권 흔들림 ⚠️') + '</span></div>'
        + '<button class="actbtn buystake" data-key="' + t.key + '"' + (f.float < 0.005 || you.cash < stakeBuyCost(s, s.youIdx, t.key, 0.05) ? ' disabled' : '') + '>📈 지분 매입 (공모주 ' + Math.round(f.float * 100) + '%까지)</button>'
        + '<button class="proj mna" data-key="' + t.key + '"' + (can ? '' : ' disabled') + '><div class="h">🤝 인수(흡수)<span class="bdg ' + (can ? 'go' : 'no') + '">$' + fmt(t.price) + 'B</span></div><div class="e">경쟁자 제거 + <b>생산능력 흡수</b> · 점유율 재분배' + (t.myStake > 0 ? ' · 잔여 ' + Math.round((1 - t.myStake) * 100) + '% 인수' : '') + '</div></button>'
        + '</div>';
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
      '<div class="mute small" style="margin-top:6px">차입여력 = 4×연EBITDA − 부채·전환사채</div></div>';
    // 3-b) 하이브리드 금융 — 전환사채(CB): 저금리 조달, 주가가 전환가 넘으면 자동 전환(부채 소멸+희석)
    const cbP = cbPrincipal(s), cbMax = cbMaxIssue(s), cbCd = cbCooldownLeft(s);
    h += '<div class="sect">하이브리드 금융 — 전환사채(CB)</div>';
    h += '<div class="card">'
      + (cbP > 0 ? '<div class="kv"><span>전환사채 잔액</span><b>$' + fmt(cbP) + 'B</b></div>'
        + you.cbs.map(cb => '<div class="kv small"><span class="mute">$' + Math.round(cb.principal) + 'B</span><span class="' + (you.price >= cb.convPrice ? 'gold' : 'mute') + '">전환가 $' + cb.convPrice.toFixed(0) + ' · 현재가 $' + you.price.toFixed(0) + (you.price >= cb.convPrice ? ' · 전환 임박 ⚡' : '') + '</span></div>').join('')
        : '<div class="kv small"><span class="mute">저금리(' + (2) + '%) 조달 · 주가가 전환가↑면 부채→자본 전환(희석)</span></div>')
      + '<button class="actbtn" id="issueCB"' + (cbCd > 0 || cbMax < 1 ? ' disabled' : '') + '>🧬 전환사채 발행' + (cbCd > 0 ? ' · 재충전 ' + Math.ceil(cbCd / DAYS_PER_MONTH) + '개월' : cbMax < 1 ? ' · 차입여력 없음' : ' (최대 $' + fmt(cbMax) + 'B)') + '</button>'
      + '</div>';
    // 4) 해외진출(프론티어 시장 진출 — 자원 할당 시작)
    h += '<div class="sect">해외진출 — 신규 시장 (지도에서 클릭해 진출)</div>';
    const fr = frontierMarkets(s);
    if (!fr.length) h += '<div class="card mute small">모든 시장에 진출했습니다.</div>';
    else fr.forEach(m => {
      const started = (you.alloc[m.name] || 0) > 0;
      const ec = entryCost(s, m.name); const broke = !started && you.cash < ec;
      h += '<button class="proj enter" data-n="' + esc(m.name) + '"' + (started || broke ? ' disabled' : '') + '><div class="h">🌏 ' + m.ko + (started ? '<span class="bdg go">전개 중</span>' : '<span class="bdg">진입장벽 $' + ec + 'B</span>') + '</div><div class="e">규모 $' + Math.round(m.size) + 'B · 아무도 없는 시장 — 진출 시 100%로 시작' + (broke ? ' · <b>자금 부족</b>' : '') + '</div></button>';
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
      '<div class="kv"><span>② 마감 시 1위</span><b class="gold">~' + dateLabel(END_DAYS) + '</b></div>' +
      '<div class="mute small" style="margin-top:4px">전 시장 1위(완전장악) 또는 마감(' + dateLabel(END_DAYS) + ') 시 1위면 승리.</div></div>';
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
    h += '<button class="btn ghost" id="replayTut" style="width:100%;margin-top:8px">🎓 첫 경영 가이드 다시 보기</button>';
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
  } else if (panel === "market") {
    const mc = marketCap(s), iv = intrinsicValue(s);
    const pv = you.priceHist.length > 1 ? you.priceHist[you.priceHist.length - 2] : you.price;
    const chg = pv > 0 ? (you.price / pv - 1) * 100 : 0;
    const gap = iv > 0 ? (mc / iv - 1) * 100 : 0;
    const gapLab = gap >= 15 ? '고평가 — 증자 유리' : gap <= -15 ? '저평가' : '적정';
    const fair = you.shares > 0 ? iv / you.shares : 0;           // 적정주가(주당 내재가치) = 내재가치 ÷ 발행주식수
    const sharesKo = (b: number) => (b * 10).toFixed(b < 1 ? 1 : 0) + '억 주';
    h += '<div class="card">'
      + '<div class="kv"><span>내 주가</span><b class="gold">$' + (you.price || 100).toFixed(1) + ' <span class="small ' + (chg >= 0 ? 'gold' : 'red') + '">' + (chg >= 0 ? '▲' : '▼') + Math.abs(chg).toFixed(1) + '%</span></b></div>'
      + candleChart(you.candles, s.date)
      + '<div class="kv"><span>적정주가 <span class="mute small">(주당 내재가치)</span></span><b class="' + (you.price >= fair ? 'mute' : 'gold') + '">$' + fair.toFixed(1) + '</b></div>'
      + '<div class="kv"><span>밸류에이션</span><b class="' + (gap >= 15 ? 'gold' : gap <= -15 ? 'red' : 'mute') + '">' + (gap >= 0 ? '+' : '') + gap.toFixed(0) + '% ' + gapLab + '</b></div>'
      + '<div class="kv small"><span class="mute">발행주식수</span><span class="mute">' + sharesKo(you.shares) + '</span></div>'
      + '<div class="kv small"><span class="mute">시가총액 (주가×주식수)</span><span>$' + fmt(mc) + 'B</span></div>'
      + '<div class="kv small"><span class="mute">펀더멘털 시총</span><span>$' + fmt(iv) + 'B</span></div>'
      + '</div>';
    h += '<div class="sect">📊 시세판</div>';
    s.firms.forEach(f => {
      const fi = s.firms.indexOf(f), fmc = marketCap(s, fi), fiv = intrinsicValue(s, fi);
      const fpv = f.priceHist.length > 1 ? f.priceHist[f.priceHist.length - 2] : f.price;
      const fchg = fpv > 0 ? (f.price / fpv - 1) * 100 : 0, fgap = fiv > 0 ? (fmc / fiv - 1) * 100 : 0;
      const mine = f.key === you.key;
      const hint = !mine && fgap <= -15 ? '저평가 — 인수 유리' : mine && fgap >= 15 ? '고평가 — 증자 유리' : (fgap >= 0 ? '+' : '') + fgap.toFixed(0) + '%';
      h += '<div class="card' + (mine ? ' mine' : '') + '">'
        + '<div class="kv"><b style="color:' + f.col + '">' + f.name + (mine ? ' (나)' : '') + '</b><span class="small ' + (fchg >= 0 ? 'gold' : 'red') + '">$' + (f.price || 100).toFixed(1) + ' ' + (fchg >= 0 ? '▲' : '▼') + Math.abs(fchg).toFixed(1) + '%</span></div>'
        + '<div class="kv small"><span class="mute">시총 $' + fmt(fmc) + 'B</span><span class="' + ((!mine && fgap <= -15) || (mine && fgap >= 15) ? 'gold' : 'mute') + '">' + hint + '</span></div>'
        + '</div>';
    });
    h += '<div class="card mute small">주가는 트렌드·규제 등 환경 이벤트로 급등·급락합니다. 주가가 높을 때 유상증자하면 같은 지분 희석으로 더 큰 자금을 조달합니다.</div>';
  } else if (panel === "log") {
    h += '<div class="card mute small">시장에서 일어난 일들 — 트렌드·규제, 개발 완성, 경쟁사 인수·파산, 진출 등(최근 40건).</div>';
    h += s.log.length
      ? '<div class="logfeed">' + s.log.map(l => '<div class="logitem">' + esc(l) + '</div>').join("") + '</div>'
      : '<div class="card mute small">아직 기록된 활동이 없습니다. ▶로 시간을 진행하세요.</div>';
  } else if (panel === "menu") {
    h += '<div class="card mute small">매월 자동 저장됩니다. 타이틀의 "이어하기"로 복원할 수 있어요.</div>';
    h += '<div class="menucol">' +
      '<button class="btn" id="mSaveGame">💾 지금 저장</button>' +
      '<button class="btn ghost" id="mLoadGame">📂 마지막 저장 불러오기</button>' +
      '<button class="btn ghost" id="mAchievements">🏆 업적 보기</button>' +
      '<div class="mute small" style="margin:6px 2px">— 게임 떠나기 —</div>' +
      '<button class="btn ghost" id="mReCompany">🏢 기업 다시 선택 <span class="mute">· 같은 산업</span></button>' +
      '<button class="btn ghost" id="mReIndustry">🏭 산업 다시 선택</button>' +
      '<button class="btn ghost" id="mToTitle">🏠 타이틀로 나가기</button>' +
      '</div>';
  } else if (panel === "achievements") {
    const all = allAchievements(), got = unlockedIds();
    h += '<div class="sect">🏆 업적 ' + got.size + ' / ' + all.length + '</div>';
    h += '<div class="achgrid">' + all.map(a => {
      const on = got.has(a.id);
      return '<div class="achcard' + (on ? '' : ' locked') + '"><div class="achico">' + (on ? a.icon : '🔒') + '</div><div class="achtxt"><b>' + (on ? esc(a.name) : '???') + '</b><span class="mute small">' + esc(a.desc) + '</span></div></div>';
    }).join("") + '</div>';
  }
  return h;
}
function opbtn(s: GameState, cap: Cap, action: string, h: string, e: string) {
  const v = s.firms[s.youIdx].ventures.find(x => x.cap === cap);
  const ok = canOperate(s, s.youIdx, cap, action);
  const cd = v && !ok ? Math.max(0, (v.cooldown[action] || 0) - s.date) : 0;
  return '<button class="op' + (ok ? '' : ' dis') + '" data-cap="' + cap + '" data-op="' + action + '"><div class="oh">' + h + '</div><div class="oe">' + (ok ? e : '쿨다운 ' + Math.ceil(cd / DAYS_PER_MONTH) + '개월') + '</div></button>';
}
const panelTitle = (p: string) => ({ company: "🏢 기업 내부", alloc: "🎯 자원 할당", strategy: "📈 전략 (M&A·재무·진출)", market: "💹 주식시장", tech: "🔬 연구개발", intel: "📊 산업 인텔", guide: "❓ 플레이 가이드", codex: "📖 용어집", log: "📜 활동 로그", menu: "☰ 게임 메뉴", achievements: "🏆 업적" } as Record<string, string>)[p] || "";
// 자원 할당 + 시장 대시보드 — 국가별 점유율·월수익·할당을 한눈에, 미충족 수요(생산능력 부족) 표시
function allocManagerBody(s: GameState): string {
  const me = s.firms[s.youIdx];
  const total = allocUpkeep(s, s.youIdx);
  const myNat = naturalCaptured(s, me.key);        // 경쟁력으로 가져갈 수 있는 수요(생산능력 무관)
  const gm = grossMargin(s);                        // 월 기여이익(전체, 생산능력 반영)
  const util = utilizationOf(s, me.key);            // 가동률 = 생산능력/수요
  const unmet = Math.max(0, myNat - capturedSize(s, me.key));   // 미충족 수요(생산능력 부족분)
  const open = s.marketOrder.slice();
  open.sort((a, b) => (s.markets[a]?.ko || a).localeCompare(s.markets[b]?.ko || b, "ko"));   // 이름순 고정
  let rows = "";
  for (const n of open) {
    const m = s.markets[n]; if (!m) continue;
    const lvl = me.alloc[n] || 0, mx = maxAllocFor(s, s.youIdx, n);
    const sh = shareOf(s, m, me.key);
    const rev = myNat > 0 ? gm * (m.size * sh / myNat) : 0;     // 그 시장의 월 기여이익(수요 비중 × 전체 기여)
    rows += '<div class="arow' + (lvl > 0 ? ' on' : '') + '">' +
      '<span class="an" title="' + esc(m.name) + '">' + m.ko + '</span>' +
      '<span class="ash" style="color:' + me.col + '">' + (sh * 100).toFixed(0) + '%</span>' +
      '<span class="arev">$' + rev.toFixed(1) + '</span>' +
      '<button class="abtn allocset" data-n="' + esc(n) + '" data-d="-1"' + (lvl <= 0 ? ' disabled' : '') + '>－</button>' +
      '<b class="alvl2">' + lvl + '/' + mx + '</b>' +
      '<button class="abtn allocset" data-n="' + esc(n) + '" data-d="1"' + (lvl >= mx ? ' disabled' : '') + '>＋</button></div>';
  }
  if (!open.length) rows = '<div class="mute small">아직 진출한 시장이 없습니다 — 지도의 프론티어(점선) 국가를 클릭해 진출하세요.</div>';
  return '<div class="card">' +
    '<div class="kv"><span>글로벌 점유율 <span class="mute small">상대</span></span><b class="gold">' + (myShare(s) * 100).toFixed(0) + '%</b></div>' +
    '<div class="kv"><span>월 기여이익</span><b class="' + (gm >= 0 ? 'gold' : 'red') + '">$' + gm.toFixed(1) + 'B</b></div>' +
    '<div class="kv"><span>가동률 <span class="mute small">생산/수요</span></span><b class="' + (util >= 0.97 ? 'gold' : 'red') + '">' + (util * 100).toFixed(0) + '%</b></div>' +
    '<div class="kv"><span>미충족 수요 <span class="mute small">생산능력 부족분</span></span><b class="' + (unmet > 0.5 ? 'red' : 'mute') + '">$' + unmet.toFixed(1) + 'B/월</b></div>' +
    '<div class="kv"><span>총 월 유지비</span><b class="' + (total > 0 ? 'gold' : 'mute') + '">$' + total.toFixed(1) + 'B/월</b></div>' +
    '<div class="kv"><span>🏭 자동 증설 <span class="mute small">수요 자동 추종(차입 포함)</span></span><button class="captog' + (me.autoCapacity ? ' on' : '') + '" id="autoCapBtn">' + (me.autoCapacity ? 'ON' : 'OFF') + '</button></div></div>' +
    '<div class="sect">시장별 <span class="mute small">점유율 · 월수익 · 할당</span></div>' +
    '<div class="card alloclist"><div class="arow ahead"><span class="an">국가</span><span class="ash">점유</span><span class="arev">월$</span><span class="ahd-alloc">할당</span></div>' + rows + '</div>' +
    '<div class="mute small" style="margin-top:6px">＋/－ 단계 조절 · 0=철수 · 가동률<100%면 🏭증설로 수익↑(승리는 점유율 기준)</div>';
}
// 일봉 캔들차트(인라인 SVG, 의존성 없음). 가격축 라벨·격자·현재가선·날짜. 상승=초록/하락=빨강.
function candleChart(candles: Candle[], curDate: number): string {
  if (!candles || candles.length < 2) return '';
  const n = candles.length, W = 320, H = 150, padR = 40, padB = 14, padT = 6, padL = 4;
  const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
  const rng = hi - lo || 1, mg = rng * 0.08; lo -= mg; hi += mg; const span = hi - lo || 1;
  const Y = (v: number) => y1 - (v - lo) / span * (y1 - y0);
  const cw = (x1 - x0) / n, bw = Math.max(1, cw * 0.62);
  // 가격 격자 + 우측 가격 라벨(5단계)
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = lo + span * i / 4, yy = Y(v);
    grid += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="rgba(255,255,255,.08)" stroke-width="0.5"/>'
      + '<text x="' + (x1 + 3) + '" y="' + (yy + 2.6).toFixed(1) + '" font-size="8" fill="#8a93a0">' + v.toFixed(0) + '</text>';
  }
  // 캔들(몸통+꼬리)
  const body = candles.map((c, i) => {
    const x = x0 + i * cw + cw / 2, up = c.c >= c.o, col = up ? '#3fb568' : '#e8556b';
    const yt = Math.min(Y(c.o), Y(c.c)), bh = Math.max(0.6, Math.abs(Y(c.c) - Y(c.o)));
    return '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + Y(c.h).toFixed(1) + '" y2="' + Y(c.l).toFixed(1) + '" stroke="' + col + '" stroke-width="0.6"/>'
      + '<rect x="' + (x - bw / 2).toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + col + '"/>';
  }).join("");
  // 현재가 점선 + 우측 강조 라벨
  const last = candles[n - 1], yc = Y(last.c);
  const cur = '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + yc.toFixed(1) + '" y2="' + yc.toFixed(1) + '" stroke="#ffb81c" stroke-width="0.6" stroke-dasharray="3 2"/>'
    + '<rect x="' + (x1 + 1) + '" y="' + (yc - 5).toFixed(1) + '" width="' + (padR - 2) + '" height="10" rx="1.5" fill="#ffb81c"/>'
    + '<text x="' + (x1 + 3) + '" y="' + (yc + 2.6).toFixed(1) + '" font-size="8" font-weight="700" fill="#1a1330">' + last.c.toFixed(0) + '</text>';
  // 날짜 라벨(시작·중간·끝)
  let dates = '';
  [[0, 'start'], [Math.floor((n - 1) / 2), 'middle'], [n - 1, 'end']].forEach(([i, anc]) => {
    const idx = i as number, x = x0 + idx * cw + cw / 2;
    dates += '<text x="' + x.toFixed(1) + '" y="' + (H - 3) + '" font-size="7.5" fill="#8a93a0" text-anchor="' + anc + '">' + dateLabel(curDate - (n - 1 - idx)) + '</text>';
  });
  return '<svg class="candle" viewBox="0 0 ' + W + ' ' + H + '">' + grid + body + cur + dates + '</svg>';
}
function ring(pct: number) { const C = 2 * Math.PI * 16, off = C * (1 - pct / 100); return '<svg class="ring" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" fill="none" stroke="#3a2c55" stroke-width="5"/><circle cx="21" cy="21" r="16" fill="none" stroke="#cbb3ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 21 21)"/><text x="21" y="25" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + Math.round(pct) + '%</text></svg>'; }

// 적합도 진단 — 이 시장에서 나 vs 현재 1위(내가 1위면 최강 라이벌)를 KSF별 기여로 분해해 "왜 이기/지는지" 보여줌.
function fitDiagnosis(s: GameState): string {
  const me = s.firms[s.youIdx]; const m = s.markets[s.ui.country!];
  // 비교 상대: 내가 1위면 최강 라이벌, 아니면 현재 1위
  let opp = s.firms.find(f => f.key === m.leader)!;
  if (opp.key === me.key) { let best = -1; for (const f of s.firms) { if (f.key === me.key) continue; const sc = matchScore(f, m); if (sc > best) { best = sc; opp = f; } } }
  if (!opp || opp.key === me.key) return "";   // 라이벌 없음(독점)
  const contrib = (f: typeof me, k: Cap) => (m.pref[k] || 0) * gcap(f.caps[k]);
  const caps = CAPS.slice().sort((a, b) => (m.pref[b] || 0) - (m.pref[a] || 0));
  let worstK: Cap = caps[0], worstGap = -Infinity;
  const rows = caps.map(k => {
    const my = contrib(me, k), op = contrib(opp, k); const gap = op - my; if (gap > worstGap) { worstGap = gap; worstK = k; }
    const ahead = my >= op - 0.01;
    return '<div class="fxrow"><span class="fxk">' + CAPKO[k] + ' <i>' + Math.round((m.pref[k] || 0) * 100) + '%</i></span>' +
      '<b class="' + (ahead ? 'up' : 'dn') + '">' + my.toFixed(0) + '</b><span class="fxvs">vs</span><span class="fxop">' + op.toFixed(0) + '</span></div>';
  }).join("");
  const myFit = matchScore(me, m), opFit = matchScore(opp, m);
  const why = m.leader === me.key
    ? '📌 이 시장 1위 — 영향력을 유지해 방어하세요.'
    : (worstGap > 0
      ? '📌 ' + esc(opp.name) + '은(는) <b>' + CAPKO[worstK] + '</b>에서 가장 앞섭니다 — <b>' + CAPKO[worstK] + '</b> 투자가 점유율 회복의 핵심.'
      : '📌 적합도는 앞서지만 영향력(할당)이 부족합니다 — 자원 할당을 늘리세요.');
  return '<div class="sect">적합도 진단 <span class="mute small">나 vs ' + esc(opp.name) + '</span></div>' +
    '<div class="card fitdx">' + rows +
    '<div class="fxtot">종합 적합도 <b class="' + (myFit >= opFit ? 'up' : 'dn') + '">' + myFit.toFixed(0) + '</b><span class="fxvs">vs</span><span class="fxop">' + opFit.toFixed(0) + '</span></div>' +
    '<div class="why">' + why + '</div></div>';
}
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
      '<div class="kv"><span>시장 규모</span><b>$' + Math.round(m.size) + 'B</b></div>' +
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
    '<div class="kv"><span>시장 규모</span><b>$' + Math.round(m.size) + 'B</b></div>' +
    '<div class="kv"><span>현재 1위</span><b style="color:' + lead.col + '">' + lead.name + '</b></div>' +
    '<div class="kv"><span>소비자 핵심 선호</span><b style="color:' + CAPCOL[top] + '">' + CAPKO[top] + '</b></div>' +
    '<div class="sect">기업별 점유율 · 소비자 선호(KSF)</div>' +
    '<div class="card splitrow"><div class="spcol-pie">' + sharePie + '</div><div class="spcol-bars">' + capBars(k => (m.pref[k] || 0) * 100) + '</div></div>' +
    fitDiagnosis(s) +
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
  const pct = (x: number) => (x * 100).toFixed(0) + "%";
  const cur = shareOf(s, m, me.key), settle = projectShare(s, m, s.youIdx, lvl);
  const up = lvl < mx ? pct(projectShare(s, m, s.youIdx, lvl + 1)) : null;
  const down = lvl > 0 ? pct(projectShare(s, m, s.youIdx, lvl - 1)) : null;
  // 할당 단계별 예상 점유율(안착 기준) — −1 / 유지 / +1 을 버튼과 같은 좌·중·우로 정렬해 직관적으로.
  const seg = (cls: string, top: string, val: string | null) =>
    '<div class="apseg ' + (val === null ? "off" : cls) + '"><span>' + top + '</span><b>' + (val === null ? "—" : "~" + val) + '</b></div>';
  const pred = '<div class="allocpred">' +
    seg("dn", "－1단계", down) + seg("cur", "유지 " + lvl + "단계", pct(settle)) + seg("up", "＋1단계", up) + '</div>';
  return '<div class="sect">🎯 자원 할당 <span class="mute small">(' + regionOf(n) + ' 지역)</span></div><div class="card">' +
    '<div class="kv"><span>내 점유율 <span class="mute small">지금</span></span><b style="color:' + me.col + '">' + pct(cur) + '</b></div>' +
    '<div class="allocrow"><span class="bl" style="width:auto">할당 단계</span>' +
      '<button class="abtn" id="allocMinus"' + (lvl <= 0 ? ' disabled' : '') + '>－</button>' +
      '<b class="alvl">' + lvl + ' / ' + mx + '</b>' +
      '<button class="abtn" id="allocPlus"' + (lvl >= mx ? ' disabled' : '') + '>＋</button>' +
      '<span class="mute small" style="margin-left:auto">월 $' + hereCost.toFixed(1) + 'B' + (lvl < mx ? ' (+1: +$' + nextCost.toFixed(1) + ')' : '') + '</span></div>' +
    '<div class="predcap mute small">할당 단계별 예상 점유율(안착)</div>' + pred +
    (lvl >= mx && mx < 8 ? '<div class="mute small">상한 도달 — 🔬연구개발의 테크트리로 ' + regionOf(n) + ' 할당 상한을 올리세요.</div>' : '') +
    '<div class="kv"><span>총 월 유지비</span><b class="' + (total > 0 ? 'gold' : 'mute') + '">$' + total.toFixed(1) + 'B/월</b></div>' +
    infBars(s, n) +
    '<div class="mute small" style="margin-top:4px">할당↑ → 영향력·유지비↑ · 0=철수</div></div>';
}
// 로비 버튼 — 이 시장의 KSF를 우리 강점 쪽으로(쿨다운·비용)
function lobbyBtn(s: GameState): string {
  const me = s.firms[s.youIdx];
  const n = s.ui.country!; const cost = lobbyCost(s, n); const ok = canAct(s, s.youIdx, "lobby:" + n);
  const cd = ok ? 0 : Math.max(0, (me.cooldowns["lobby:" + n] || 0) - s.date);
  const dis = !ok || me.cash < cost;
  return '<button class="actbtn" id="lobbyBtn"' + (dis ? ' disabled' : '') + '>🏛️ 로비 — 시장 선호를 우리에게 유리하게 ' + (ok ? '($' + cost + 'B)' : '(쿨다운 ' + Math.ceil(cd / DAYS_PER_MONTH) + '개월)') + '</button>';
}

function renderConfirm(s: GameState, A: Actions) {
  const el = document.getElementById("confirmwrap")!;
  if (!s.ui.confirm) { el.className = "hide"; el.innerHTML = ""; return; }
  const c = s.ui.confirm; el.className = "modalwrap";
  el.innerHTML = '<div class="modal"><h3>' + c.title + '</h3>' + c.lines.map(l => '<div class="mrow">' + l + '</div>').join("") +
    '<div class="mbtns"><button class="btn ghost" id="cCancel">' + (c.cancelLabel || "취소") + '</button><button class="btn" id="cOk">' + c.okLabel + '</button></div></div>';
  document.getElementById("cOk")!.onclick = () => A.confirmOk();
  document.getElementById("cCancel")!.onclick = () => A.confirmCancel();
}
// 유상증자 슬라이더 팝업 — 조달 금액을 직접 드래그(희석·경영권 실시간 미리보기).
export function openRaiseModal(s: GameState, A: Actions, asSI: boolean) {
  const fi = s.youIdx, f = s.firms[fi];
  const pre = Math.max(1, marketCap(s, fi)), si = controllingThreat(s, fi), max = equityMaxRaise(s, fi, asSI);
  document.getElementById("raisewrap")?.remove();
  const wrap = document.createElement("div"); wrap.id = "raisewrap"; wrap.className = "modalwrap";
  const desc = asSI
    ? "한 곳(전략적 투자자)에 큰 지분을 넘겨 큰 자금을 조달합니다. 그 지분이 내 지분을 넘으면 경영권을 잃습니다."
    : "여러 재무적 투자자에게 지분을 분산 매각해 자금을 조달합니다. 분산돼 경영권이 상대적으로 안전(내 지분 20%까지).";
  wrap.innerHTML = '<div class="modal"><h3>' + (asSI ? "🤝 유상증자 — 전략적 투자자" : "🏦 유상증자 — 재무적 투자자") + '</h3>'
    + '<div class="rtabs"><button class="rtab' + (!asSI ? ' on' : '') + '" data-si="0">재무적 투자자</button><button class="rtab' + (asSI ? ' on' : '') + '" data-si="1">전략적 투자자</button></div>'
    + '<div class="mrow mute small">' + desc + '</div>'
    + '<div class="rrow"><span>조달 금액</span><b id="rAmt" class="gold"></b></div>'
    + '<input type="range" id="rSlider" min="0" max="' + Math.max(0, max) + '" value="' + Math.round(max / 2) + '" step="1">'
    + '<div class="rrow"><span>내 지분</span><b id="rOwn"></b></div>'
    + '<div class="rrow"><span>경영권</span><b id="rCtl"></b></div>'
    + (max <= 0 ? '<div class="mrow red small">⚠️ 지금은 더 조달하면 경영권을 잃어 한도가 0입니다.</div>' : '')
    + '<div class="mbtns"><button class="btn ghost" id="rCancel">취소</button><button class="btn" id="rOk">유상증자 실행</button></div></div>';
  document.body.appendChild(wrap);
  const slider = document.getElementById("rSlider") as HTMLInputElement;
  const upd = () => {
    const amt = +slider.value, φ = amt / (pre + amt);
    const own = f.ownership * (1 - φ), siA = asSI ? si * (1 - φ) + φ : si * (1 - φ);
    const ok = own >= Math.max(0.2, siA) - 1e-9;
    document.getElementById("rAmt")!.textContent = "+$" + amt + "B";
    document.getElementById("rOwn")!.innerHTML = (f.ownership * 100).toFixed(0) + "% → <b class='" + (ok ? "gold" : "red") + "'>" + (own * 100).toFixed(0) + "%</b>";
    document.getElementById("rCtl")!.innerHTML = ok ? "<span class='gold'>✓ 유지</span>" : "<span class='red'>⚠️ 상실</span>";
    (document.getElementById("rOk") as HTMLButtonElement).disabled = amt <= 0;
  };
  slider.oninput = upd; upd();
  document.getElementById("rOk")!.onclick = () => { const amt = +slider.value; wrap.remove(); if (amt > 0) A.raiseExec(asSI, amt); };
  document.getElementById("rCancel")!.onclick = () => wrap.remove();
  wrap.querySelectorAll<HTMLElement>(".rtab").forEach(b => b.onclick = () => { wrap.remove(); openRaiseModal(s, A, b.dataset.si === "1"); });
}
// 경쟁사 지분 매입 슬라이더 팝업 — 공모주에서 %를 드래그(비용·라이벌 경영권 실시간).
export function openStakeModal(s: GameState, A: Actions, rivalKey: string) {
  const me = s.firms[s.youIdx].key, r = s.firms.find(f => f.key === rivalKey); if (!r) return;
  const idx = s.firms.indexOf(r), pre = Math.max(1, marketCap(s, idx));
  const myNow = r.blocs.reduce((a, b) => a + (b.owner === me ? b.stake : 0), 0);
  const siNow = r.blocs.reduce((a, b) => a + b.stake, 0);
  const maxPct = Math.floor(r.float * 100); const cash = s.firms[s.youIdx].cash;
  document.getElementById("raisewrap")?.remove();
  const wrap = document.createElement("div"); wrap.id = "raisewrap"; wrap.className = "modalwrap";
  wrap.innerHTML = '<div class="modal"><h3>📈 ' + r.name + ' 지분 매입</h3>'
    + '<div class="mrow mute small">공모주(자유 유통 지분)에서 매입합니다. 내 지분이 창업자(' + (r.ownership * 100).toFixed(0) + '%)를 넘으면 그 회사 경영권이 흔들립니다 → 인수가도 저렴해집니다.</div>'
    + '<div class="rrow"><span>매입 비율</span><b id="sPct" class="gold"></b></div>'
    + '<input type="range" id="sSlider" min="0" max="' + maxPct + '" value="' + Math.round(maxPct / 2) + '" step="1">'
    + '<div class="rrow"><span>비용</span><b id="sCost"></b></div>'
    + '<div class="rrow"><span>내 보유 지분</span><b id="sMy"></b></div>'
    + '<div class="rrow"><span>' + r.name + ' 경영권</span><b id="sCtl"></b></div>'
    + (maxPct <= 0 ? '<div class="mrow red small">공모주가 없어 매입할 수 없습니다(창업자·기존 주주만 보유).</div>' : '')
    + '<div class="mbtns"><button class="btn ghost" id="sCancel">취소</button><button class="btn" id="sOk">지분 매입</button></div></div>';
  document.body.appendChild(wrap);
  const slider = document.getElementById("sSlider") as HTMLInputElement;
  const upd = () => {
    const frac = (+slider.value) / 100, cost = Math.round(frac * pre * 1.1);
    const myAfter = myNow + frac, siAfter = siNow + frac, rivCtl = r.ownership >= siAfter - 1e-9;
    document.getElementById("sPct")!.textContent = (+slider.value) + "%";
    document.getElementById("sCost")!.innerHTML = "<b class='" + (cost <= cash ? "" : "red") + "'>$" + cost + "B</b>" + (cost > cash ? " (자금부족)" : "");
    document.getElementById("sMy")!.innerHTML = (myNow * 100).toFixed(0) + "% → <b class='gold'>" + (myAfter * 100).toFixed(0) + "%</b>";
    document.getElementById("sCtl")!.innerHTML = rivCtl ? "<span class='gold'>유지</span>" : "<span class='red'>⚠️ 흔들림(내가 최대주주)</span>";
    (document.getElementById("sOk") as HTMLButtonElement).disabled = frac <= 0 || cost > cash;
  };
  slider.oninput = upd; upd();
  document.getElementById("sOk")!.onclick = () => { const frac = (+slider.value) / 100; wrap.remove(); if (frac > 0) A.buyStake(rivalKey, frac); };
  document.getElementById("sCancel")!.onclick = () => wrap.remove();
}
// 전환사채 발행 모달 — 금액만 슬라이더. 전환가·금리 고정. 전환 시 희석·경영권 미리보기.
export function openCBModal(s: GameState, A: Actions) {
  const f = s.firms[s.youIdx]; marketCap(s);   // 주가 init 보장
  const max = cbMaxIssue(s), convPrice = Math.round(f.price * 1.3 * 10) / 10, threat = controllingThreat(s);
  document.getElementById("raisewrap")?.remove();
  const wrap = document.createElement("div"); wrap.id = "raisewrap"; wrap.className = "modalwrap";
  wrap.innerHTML = '<div class="modal"><h3>🧬 전환사채(CB) 발행</h3>'
    + '<div class="mrow mute small">저금리(2%)로 현금 조달. 주가가 <b>전환가 $' + convPrice.toFixed(0) + '</b>(현재가 $' + f.price.toFixed(0) + '×1.3)를 넘으면 자동 전환 — 부채가 사라지는 대신 지분이 희석됩니다.</div>'
    + '<div class="rrow"><span>발행 금액</span><b id="cAmt" class="gold"></b></div>'
    + '<input type="range" id="cSlider" min="0" max="' + Math.max(0, max) + '" value="' + Math.round(max / 2) + '" step="1">'
    + '<div class="rrow"><span>전환가 · 금리</span><b>$' + convPrice.toFixed(0) + ' · 2%</b></div>'
    + '<div class="rrow"><span>전환 시 내 지분</span><b id="cOwn"></b></div>'
    + '<div class="rrow"><span>전환 시 경영권</span><b id="cCtl"></b></div>'
    + (max < 1 ? '<div class="mrow red small">차입여력이 없습니다(EBITDA×4 한도 소진 — 점유율을 키우세요).</div>' : '')
    + '<div class="mbtns"><button class="btn ghost" id="cCancel">취소</button><button class="btn" id="cOk">전환사채 발행</button></div></div>';
  document.body.appendChild(wrap);
  const slider = document.getElementById("cSlider") as HTMLInputElement;
  const upd = () => {
    const amt = +slider.value, newShares = amt / convPrice, total = f.shares + newShares, phi = total > 0 ? newShares / total : 0;
    const ownAfter = f.ownership * (1 - phi), threatAfter = threat * (1 - phi), ctlOk = ownAfter >= Math.max(0.2, threatAfter) - 1e-9;
    document.getElementById("cAmt")!.textContent = "+$" + amt + "B";
    document.getElementById("cOwn")!.innerHTML = (f.ownership * 100).toFixed(0) + "% → <b class='" + (ctlOk ? "gold" : "red") + "'>" + (ownAfter * 100).toFixed(0) + "%</b>";
    document.getElementById("cCtl")!.innerHTML = ctlOk ? "<span class='gold'>유지</span>" : "<span class='red'>⚠️ 상실 위험</span>";
    (document.getElementById("cOk") as HTMLButtonElement).disabled = amt < 1;
  };
  slider.oninput = upd; upd();
  document.getElementById("cOk")!.onclick = () => { const amt = +slider.value; wrap.remove(); if (amt >= 1) A.raiseCBExec(amt); };
  document.getElementById("cCancel")!.onclick = () => wrap.remove();
}
// 전체화면 승리/패배 플래시 — 1회. (한 게임 오버당 한 번)
let flashedOver = false;
export function screenFlash(kind: "win" | "lose") {
  let el = document.getElementById("screenflash");
  if (!el) { el = document.createElement("div"); el.id = "screenflash"; document.body.appendChild(el); }
  el.className = ""; void el.offsetWidth;   // 리플로우로 애니메이션 재생
  el.className = "show " + kind;
  window.setTimeout(() => { if (el) el.className = ""; }, 1400);
}
function renderBanner(s: GameState, A: Actions) {
  const el = document.getElementById("banner")!;
  if (!s.ui.over) { el.className = "hide"; el.innerHTML = ""; flashedOver = false; return; }
  if (!flashedOver) { flashedOver = true; screenFlash(s.ui.over.won ? "win" : "lose"); }
  el.className = "modalwrap";
  const won = s.ui.over.won; const me = s.firms[s.youIdx];
  const head = won
    ? '<div class="winburst">🎉</div><div class="confetti">🎊✨🏆✨🎊</div><h3 class="gold">축하합니다 — 승리!</h3><div class="mrow"><b style="color:' + me.col + '">' + me.name + '</b>(으)로 ' + s.ui.over.msg + '</div>'
    : '<h3>' + s.ui.over.msg + '</h3>';
  el.innerHTML = '<div class="modal' + (won ? " victory" : "") + '">' + head +
    '<div class="mrow mute small">' + s.scenario.ko + ' · 최종 점유율 ' + (myShare(s) * 100).toFixed(0) + '%</div>' +
    (won ? '<div class="mrow mute small">계속 경영하면 마감 제한 없이 자유롭게 세계를 운영합니다(승리 기록은 유지).</div>' : '') +
    '<div class="mbtns">' +
    (won ? '<button class="btn" id="keepPlaying">▶ 계속 경영하기</button>' : '') +
    '<button class="btn' + (won ? ' ghost' : '') + '" id="restart">다시 하기</button>' +
    '<button class="btn ghost" id="toTitle">' + (won ? "타이틀로" : "다른 산업 고르기") + '</button></div></div>';
  document.getElementById("restart")!.onclick = () => A.restart();
  document.getElementById("toTitle")!.onclick = () => A.toTitle();
  const kp = document.getElementById("keepPlaying"); if (kp) kp.onclick = () => A.continuePlaying();
}

// ===== 사전 화면(타이틀 → 산업 선택 → 기업 선택) =====
const sectorKo: Record<string, string> = {
  "Information Technology": "IT", "Communication Services": "통신", "Consumer Discretionary": "경기소비재",
  "Consumer Staples": "필수소비재", "Health Care": "헬스케어", "Financials": "금융", "Industrials": "산업재",
  "Materials": "소재", "Energy": "에너지", "Utilities": "유틸리티", "Real Estate": "부동산",
};

export function renderTitle(app: HTMLElement, A: Actions) {
  // 정적 배포(GitHub Pages 등, VITE_STATIC=1)에는 WS 게임 서버가 없어 온라인 버튼을 숨긴다.
  const staticBuild = (import.meta as any).env?.VITE_STATIC === "1";
  // 배경: 희미한 세계지도 + 주요 시장 맥동(레이더 핑). 회장이 글로벌 시장을 굽어보는 톤.
  const land = MAPDATA.map(c => '<path d="' + c.d + '"></path>').join("");
  const dots: [number, number, number][] = [
    [180, 150, 0], [120, 168, 1.5], [410, 116, 0.6], [392, 104, 2.2], [560, 100, 1.1],
    [620, 158, 0.3], [648, 150, 1.9], [560, 205, 0.9], [478, 188, 2.5], [430, 252, 1.4],
    [270, 292, 0.7], [690, 312, 2.0], [640, 232, 1.2], [330, 206, 2.7],
  ];
  const pulses = dots.map(([x, y, d]) =>
    '<circle class="dot" cx="' + x + '" cy="' + y + '" r="2.1"></circle>' +
    '<circle class="ping" cx="' + x + '" cy="' + y + '" r="2.1" style="animation-delay:' + d + 's"></circle>').join("");
  app.innerHTML =
    '<div class="screen title">' +
    '<svg class="titlemap" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="land">' + land + '</g><g class="pulses">' + pulses + '</g></svg>' +
    '<div class="titlevig"></div>' +
    '<div class="hero chairman">' +
    '<div class="kicker">실시간 경영 그랜드 전략 · REAL-TIME BUSINESS STRATEGY</div>' +
    '<div class="crest">🎩</div>' +
    '<h1 class="gametitle">THE CHAIRMAN</h1>' +
    '<div class="kotitle">더 체어맨</div>' +
    '<div style="opacity:.45;font-size:12px;letter-spacing:1px;margin-top:4px">v' + VERSION + '</div>' +
    '<p class="lede">당신은 회장이다.<br>한 기업을 운영해 변화하는 세계 시장을 공략하고, <b>점유율 1위</b>로 산업을 지배하라.</p>' +
    (hasSave() ? '<button class="btn big" id="loadGame">▶ 이어하기 <span class="mute" style="font-size:12px">· ' + savedLabel() + '</span></button>' : '') +
    '<button class="btn big' + (hasSave() ? ' ghost' : '') + '" id="toIndustry">새 게임 — 집무 시작 →</button>' +
    (staticBuild
      ? '<p class="src mute">온라인 플레이는 게임 서버 실행 시 가능합니다 (npm run server).</p>'
      : '<button class="btn big ghost" id="toOnline">온라인 플레이 (베타)</button>') +
    '<p class="src">데이터: <a href="https://dshseungwon.github.io/daily-industry-report/" target="_blank" rel="noopener">The Industry Brief</a></p>' +
    '</div></div>';
  document.getElementById("toIndustry")!.onclick = () => A.toIndustry();
  const ob = document.getElementById("toOnline"); if (ob) ob.onclick = () => A.goOnline();
  const lb = document.getElementById("loadGame"); if (lb) lb.onclick = () => A.loadGame();
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

// 전역 음소거 버튼 — 모든 화면(타이틀·로비·선택)에서 우상단에 고정. 인게임은 상단바 메뉴의 🔊가 담당하므로 숨김.
export function renderGlobalMute(show: boolean) {
  let b = document.getElementById("globalmute") as HTMLButtonElement | null;
  if (!show) { if (b) b.style.display = "none"; return; }
  if (!b) {
    b = document.createElement("button"); b.id = "globalmute"; document.body.appendChild(b);
    b.onclick = () => {
      const m = toggleMute();
      if (m) stopBgm(); else { startBgm(); sfx("select"); }
      renderGlobalMute(true);
    };
  }
  b.style.display = "";
  b.textContent = isMuted() ? "🔇" : "🔊";
  b.title = "소리 켜기/끄기";
}

// 온라인 참가자 — 방의 시나리오에서 '남은 기업'을 선택. roster의 human=이미 선택됨.
export function renderClaim(app: HTMLElement, world: any, roster: { key: string; human: boolean; name: string }[], A: Actions) {
  const firms: any[] = world?.firms || [];
  const taken: Record<string, string> = {};
  for (const r of (roster || [])) if (r.human) taken[r.key] = r.name || "참가자";
  const card = (f: any, idx: number) => {
    const t = taken[f.key];
    return '<div class="ccard" style="border-left:4px solid ' + f.col + '"><div class="ch"><b style="color:' + f.col + '">' + esc(f.name) + '</b><span class="chip">' + (t ? esc(t) + ' 선택됨' : '선택 가능') + '</span></div>' +
      '<div class="cbars">' + capBars(k => f.caps[k]) + '</div>' +
      '<button class="btn" data-idx="' + idx + '"' + (t ? ' disabled' : '') + '>' + (t ? '선택됨' : '이 기업으로 플레이') + '</button></div>';
  };
  app.innerHTML =
    '<div class="screen list"><div class="cwrap"><div class="lhead"><button class="back" id="back">←</button>' +
    '<div><h2>기업 선택</h2><div class="mute small">방 ' + esc(world?.scenario?.ko || '') + ' · 방 코드 공유됨 — 남은 기업에서 고르세요</div></div></div>' +
    '<div class="ccards">' + firms.map((f, i) => card(f, i)).join("") + '</div>' +
    '<button class="btn big ghost" id="spectate">관전하기</button></div></div>';
  document.getElementById("back")!.onclick = () => A.toTitle();
  app.querySelectorAll<HTMLElement>(".ccard .btn").forEach(b => { if (!(b as HTMLButtonElement).disabled) b.onclick = () => A.claimFirm(Number(b.dataset.idx)); });
  document.getElementById("spectate")!.onclick = () => A.spectate();
}

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
  const all: BriefMeta[] = BRIEFS;   // 모든 산업을 동일하게(기준 시나리오 특별 취급 없음)
  const card = (m: BriefMeta) => {
    const link = m.file ? '<a class="rlink" data-gics="' + esc(m.gics) + '" href="https://dshseungwon.github.io/daily-industry-report/' + esc(m.file) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">리포트 ↗</a>' : '';
    return '<button class="icard" data-gics="' + esc(m.gics) + '">' +
      '<div class="ih"><span class="chip">' + (sectorKo[m.sector] || m.sector) + '</span>' + link + '</div>' +
      '<div class="iname">' + m.industry_ko + '</div>' +
      '<div class="ihead">' + m.headline_ko + '</div>' +
      '<div class="ico"><span>🌐 ' + m.global_company + '</span><span>🇰🇷 ' + m.korea_company + '</span></div>' +
      '</button>';
  };
  app.innerHTML =
    '<div class="screen list"><div class="lhead"><button class="back" id="back">←</button>' +
    '<div style="flex:1"><h2>산업 선택</h2><div class="mute small">The Industry Brief의 ' + BRIEFS.length + '개 산업 · 매일 갱신</div></div>' +
    '</div>' +
    '<input id="indSearch" class="search" type="search" placeholder="🔍 산업·기업·섹터 검색 (예: 반도체, 현대, 은행)" autocomplete="off">' +
    '<div class="igrid" id="igrid"></div></div>';
  document.getElementById("back")!.onclick = () => A.toTitle();
  const grid = document.getElementById("igrid")!;
  const norm = (x: string) => (x || "").toLowerCase();
  // 한글 기업명 별칭 → 영문(데이터는 영문 회사명) — 토큰별로 변형 매칭에 사용.
  const KO_ALIAS: [string, string][] = [
    ["삼성", "samsung"], ["현대", "hyundai"], ["기아", "kia"], ["엘지", "lg"], ["에스케이", "sk"],
    ["롯데", "lotte"], ["한화", "hanwha"], ["포스코", "posco"], ["두산", "doosan"], ["카카오", "kakao"],
    ["네이버", "naver"], ["쿠팡", "coupang"], ["대한항공", "korean air"], ["아모레", "amorepacific"],
    ["코웨이", "coway"], ["신한", "shinhan"], ["미래에셋", "mirae"], ["한국전력", "kepco"], ["한전", "kepco"],
    ["가스공사", "kogas"], ["크래프톤", "krafton"], ["제일제당", "cheiljedang"], ["모비스", "mobis"],
    ["하이닉스", "hynix"], ["이마트", "mart"], ["하이마트", "hi-mart"], ["칠성", "chilsung"], ["한솔", "hansol"],
    ["영원", "youngone"], ["오스템", "osstem"], ["루닛", "lunit"], ["메가스터디", "megastudy"],
    ["사람인", "saramin"], ["케이티", "kt"], ["셀트리온", "celltrion"], ["코스맥스", "cosmax"],
  ];
  const variants = (t: string) => { const vs = [t]; for (const [ko, en] of KO_ALIAS) if (t.includes(ko)) vs.push(en); return vs; };
  const matches = (m: BriefMeta, q: string) => {
    if (!q) return true;
    const hay = [m.industry_ko, m.industry_en, sectorKo[m.sector] || m.sector, m.sector, m.global_company, m.korea_company].map(norm).join(" ");
    return q.split(/\s+/).filter(Boolean).every(t => variants(t).some(v => hay.includes(v)));
  };
  const paint = (q: string) => {
    const list = all.filter(m => matches(m, norm(q)));
    grid.innerHTML = list.length ? list.map(card).join("") : '<div class="mute" style="padding:24px;grid-column:1/-1">검색 결과가 없습니다.</div>';
    grid.querySelectorAll<HTMLElement>(".icard").forEach(b => b.onclick = () => { const g = b.dataset.gics!; A.pickIndustry(all.find(m => m.gics === g)!); });
    grid.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); A.studyIntel(b.dataset.gics!); }));
  };
  paint("");
  const si = document.getElementById("indSearch") as HTMLInputElement;
  si.oninput = () => paint(si.value);
}

// 산업 KSF 가중치를 칩 행으로(선택 카드용). 실데이터(0~1) → %.
function ksfChips(ksf: Record<Cap, number>): string {
  return '<div class="ksfchips">' + CAPS.map(k => '<span class="ksfchip"><i style="background:' + CAPCOL[k] + '"></i>' + CAPKO[k] + ' <b>' + Math.round(ksf[k] * 100) + '</b></span>').join("") + '</div>';
}
// 산업 인텔 블록(기업 선택 카드 + 인게임 패널 공용): KSF 막대 + why + 실제 기업·점유율.
function firmRows(firms: IndustryIntel["topFirms"]): string {
  return '<div class="firmrows">' + firms.map(f => '<div class="firmrow"><span>' + esc(f.en) + (f.ko ? ' <span class="mute">' + esc(f.ko) + '</span>' : '') + '</span>' + (f.share !== undefined ? '<b>' + f.share + '%</b>' : '') + '</div>').join("") + '</div>';
}
function intelBlock(it: IndustryIntel): string {
  if (!it.hasData || !it.ksf) return '<div class="card mute small">이 산업의 KSF 실데이터는 준비 중입니다(섹터 근사치로 플레이).</div>';
  const ksf = it.ksf;
  let h = '<div class="sect">이 산업의 KSF(핵심성공요인)' + (it.market ? ' · 시장 ' + esc(it.market.label) + '(' + esc(it.market.year) + ')' : '') + '</div><div class="cbars">' + capBars(k => ksf[k] * 100) + '</div>';
  h += '<div class="ksfwhy">📌 ' + it.why + '</div>';
  if (it.topFirms.length) h += '<div class="sect">실제 글로벌 점유율</div>' + firmRows(it.topFirms);
  if (it.koreaFirms.length) h += '<div class="sect">실제 한국 점유율</div>' + firmRows(it.koreaFirms);
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
    (sc.real ? '<span class="bdg go">실데이터 · The Industry Brief</span>' : '<span class="bdg no">KSF 데이터 준비중 — 섹터 프리셋</span>') + '</div>' +
    intelBlock(industryIntel(scenarioGics(sc.key))) + '</div>' +
    '<div class="sect">어느 기업을 운영할까요?</div>' +
    '<div class="ccards">' + sc.firms.map((f, i) => firmCard(f, i)).join("") + '</div></div></div>';
  document.getElementById("back")!.onclick = () => A.toIndustry();
  app.querySelectorAll<HTMLElement>(".ccard .btn").forEach(b => b.onclick = () => A.pickCompany(Number(b.dataset.idx)));
  app.querySelectorAll<HTMLElement>(".rlink[data-gics]").forEach(b => b.addEventListener("click", () => A.studyIntel(b.dataset.gics!)));
}
