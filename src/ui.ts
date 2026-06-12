import { GameState, CAPS, CAPKO, WANTIC, Cap, CODEX } from "./state";
import { MAPDATA } from "./mapdata";
import { strategyProjects, myShare, waccOf, dateLabel, canOperate, Project, shareOf, monthlyCashflow, END_MONTHS } from "./engine";

export interface Actions {
  setSpeed(n: 0 | 1 | 2 | 3): void;
  togglePanel(p: string): void;
  selectCountry(n: string | null): void;
  startStrategy(cap: Cap): void;
  operate(action: string): void;
  confirmOk(): void;
  confirmCancel(): void;
  restart(): void;
}
const colOf = (k: string) => k === "you" ? "#ffb81c" : k === "apple" ? "#5aa9e6" : k === "xiaomi" ? "#36c98e" : "#23415f";
const fmt = (x: number) => Math.round(x).toLocaleString();
const esc = (s: string) => s.replace(/"/g, "&quot;");

export function mount(app: HTMLElement, A: Actions) {
  app.innerHTML =
    '<svg id="map" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet"></svg>' +
    '<div id="topbar"></div>' +
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
function recolor(s: GameState) {
  const youKey = s.firms[s.youIdx].key;
  document.querySelectorAll<SVGPathElement>("#map path").forEach(p => {
    const n = p.getAttribute("data-n")!; const m = s.markets[n];
    p.setAttribute("fill", m ? colOf(m.leader) : "#23415f");
    p.setAttribute("class", "country" + (m ? " active" : " inactive") + (s.ui.country === n ? " sel" : ""));
  });
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
      mbtn("company", "🏢", s) + mbtn("projects", "🚀", s) + mbtn("strategy", "📈", s) + mbtn("codex", "📖", s) +
    '</div>' +
    '<div class="trend">📰 ' + s.trend.headline + ' — ' + s.trend.note + (s.venture ? ' · 🚀 ' + CAPKO[s.venture.cap] + ' ' + Math.round(s.venture.progress) + '%' : '') + '</div>';
  t.querySelectorAll<HTMLElement>(".spbtn").forEach(b => b.onclick = () => A.setSpeed(Number(b.dataset.sp) as 0|1|2|3));
  t.querySelectorAll<HTMLElement>(".mbtn").forEach(b => b.onclick = () => A.togglePanel(b.dataset.p!));
}
const mbtn = (p: string, ic: string, s: GameState) => '<button class="mbtn' + (s.ui.panel === p ? " on" : "") + '" data-p="' + p + '">' + ic + '</button>';

function bar(label: string, v: number) {
  return '<div class="barrow"><span class="bl">' + label + '</span><div class="bt"><div class="bf" style="width:' + Math.round(v) + '%"></div></div><span class="bv">' + Math.round(v) + '</span></div>';
}

function renderPanel(s: GameState, A: Actions) {
  const o = document.getElementById("overlay")!;
  if (s.ui.panel === "none") { o.className = "hide"; o.innerHTML = ""; return; }
  o.className = "drawer";
  let h = '<div class="dhead"><b>' + panelTitle(s.ui.panel) + '</b><button class="x" id="closePanel">✕</button></div><div class="dbody">';
  const you = s.firms[s.youIdx];
  if (s.ui.panel === "company") {
    const cf = monthlyCashflow(s);
    h += '<div class="card"><div class="kv"><span>현금</span><b>$' + fmt(s.cash) + 'B</b></div><div class="kv"><span>월 현금흐름</span><b class="' + (cf >= 0 ? 'gold' : 'red') + '">' + (cf >= 0 ? '+' : '') + cf.toFixed(1) + 'B</b></div><div class="kv"><span>부채</span><b>$' + fmt(s.debt) + 'B</b></div><div class="kv"><span>전 세계 점유율</span><b class="gold">' + (myShare(s) * 100).toFixed(1) + '%</b></div><div class="kv"><span>WACC(할인율)</span><b>' + (waccOf(s) * 100).toFixed(1) + '%</b></div></div>';
    h += '<div class="sect">역량</div><div class="card">' + CAPS.map(k => bar(CAPKO[k], you.caps[k])).join("") + '</div>';
    h += '<div class="sect">경쟁사</div>' + s.firms.filter(f => f.key !== you.key).map(f => '<div class="card"><div class="kv"><b style="color:' + f.col + '">' + f.name + '</b><span>' + CAPS.map(k => CAPKO[k][0] + f.caps[k]).join(" ") + '</span></div></div>').join("");
  } else if (s.ui.panel === "projects") {
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
  } else if (s.ui.panel === "strategy") {
    if (s.venture) h += '<div class="card mute small">이미 진행 중인 투자가 있습니다. [프로젝트]에서 운영·취소 후 새 투자를 시작하세요.</div>';
    else {
      h += '<div class="sect">새 투자 — NPV로 판단 후 진행</div>';
      strategyProjects(s).forEach((p: Project) => {
        const go = p.npv > 0;
        h += '<button class="proj" data-cap="' + p.cap + '"><div class="h">' + p.h + (go ? '<span class="bdg go">투자 적격</span>' : '<span class="bdg no">가치 파괴</span>') + '</div><div class="e">' + p.e + '</div><div class="fin"><span>Capex $' + p.capex + 'B</span><span class="gold">점유율 +' + (p.dShare * 100).toFixed(1) + '%p</span><span class="' + (go ? 'pos' : 'neg') + '">NPV $' + fmt(p.npv) + 'B</span><span>IRR ' + (p.irr != null ? (p.irr * 100).toFixed(0) + '%' : '-') + '</span></div></button>';
      });
      h += '<div class="mute small">※ NPV는 "지금 소비자 선호 유지" 가정. 환경이 바뀌면 실현이 달라집니다.</div>';
    }
  } else if (s.ui.panel === "codex") {
    h += CODEX.map(c => '<div class="codex"><div class="t">' + c.t + (c.en ? ' <span class="en">' + c.en + '</span>' : '') + '</div><div class="d">' + c.d + '</div></div>').join("");
  }
  h += '</div>';
  o.innerHTML = h;
  document.getElementById("closePanel")!.onclick = () => A.togglePanel(s.ui.panel);
  o.querySelectorAll<HTMLElement>(".proj").forEach(b => b.onclick = () => A.startStrategy(b.dataset.cap as Cap));
  o.querySelectorAll<HTMLElement>(".op").forEach(b => { if (!b.classList.contains("dis")) b.onclick = () => A.operate(b.dataset.op!); });
}
function opbtn(s: GameState, action: string, h: string, e: string) {
  const ok = canOperate(s, action);
  const cd = s.venture && !ok ? Math.max(0, (s.venture.cooldown[action] || 0) - s.date) : 0;
  return '<button class="op' + (ok ? '' : ' dis') + '" data-op="' + action + '"><div class="oh">' + h + '</div><div class="oe">' + (ok ? e : '쿨다운 ' + cd + '개월') + '</div></button>';
}
const panelTitle = (p: string) => ({ company: "🏢 기업 내부", projects: "🚀 진행 프로젝트", strategy: "📈 전략 실행", codex: "📖 용어집" } as Record<string, string>)[p] || "";
function ring(pct: number) { const C = 2 * Math.PI * 16, off = C * (1 - pct / 100); return '<svg class="ring" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" fill="none" stroke="#3a2c55" stroke-width="5"/><circle cx="21" cy="21" r="16" fill="none" stroke="#cbb3ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 21 21)"/><text x="21" y="25" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + Math.round(pct) + '%</text></svg>'; }

function renderSheet(s: GameState, A: Actions) {
  const el = document.getElementById("sheet")!;
  if (!s.ui.country) { el.className = "hide"; el.innerHTML = ""; return; }
  const m = s.markets[s.ui.country]; if (!m) { el.className = "hide"; return; }
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
    '<div class="mute small" style="margin-top:6px">이 시장은 <b>' + CAPKO[top] + '</b>를 가장 원합니다. 그 역량을 키우면 점유율을 늘릴 수 있어요.</div>';
  document.getElementById("closeSheet")!.onclick = () => A.selectCountry(null);
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
  el.innerHTML = '<div class="modal"><h3 class="gold">' + (s.ui.over.won ? "🏆 " + s.ui.over.msg : s.ui.over.msg) + '</h3><div class="mrow">최종 점유율 ' + (myShare(s) * 100).toFixed(0) + '%</div><div class="mbtns"><button class="btn" id="restart">다시 시작</button></div></div>';
  document.getElementById("restart")!.onclick = () => A.restart();
}
