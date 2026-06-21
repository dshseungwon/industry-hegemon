// 3D 지구본(globe.gl = three.js 기반). 평면 SVG 지도의 대안 뷰.
// 국가 폴리곤을 리더 색으로 칠하고, 드래그 회전·클릭 선택을 제공. 오프라인 위해 라이브러리·지오데이터 모두 번들.
import Globe from "globe.gl";
import { feature } from "topojson-client";
import topo from "./data/countries-110m.json";

// TopoJSON → GeoJSON Feature 배열(국가 폴리곤)
const fc = feature(topo as any, (topo as any).objects.countries) as any;
const FEATURES: any[] = fc.features;

const OCEAN = "#06121f";
const INACTIVE = "#141b22";
const FRONTIER = "#2f4a2a";

let globe: any = null;
let host: HTMLElement | null = null;
let hoverName: string | null = null;            // 커서 아래 국가(탭 선택용)
const colorMap: Record<string, string> = {};   // 국가명 → cap 색(렌더 시 채움)

// 국가명 → [lng,lat] 중심(아크 시작/끝점용) — 최대 면적 링의 bbox 중심
const CENTROIDS: Record<string, [number, number]> = {};
for (const f of FEATURES) {
  const g = f.geometry; let rings: number[][][] = [];
  if (g.type === "Polygon") rings = [g.coordinates[0]];
  else if (g.type === "MultiPolygon") rings = g.coordinates.map((p: number[][][]) => p[0]);
  let best: [number, number] | null = null, bestArea = -1;
  for (const r of rings) {
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const pt of r) { const x = pt[0], y = pt[1]; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    const area = (maxx - minx) * (maxy - miny);
    if (area > bestArea) { bestArea = area; best = [(minx + maxx) / 2, (miny + maxy) / 2]; }
  }
  if (best) CENTROIDS[f.properties.name] = best;
}

// 한 번만 생성(처음 3D로 전환될 때). 컨테이너는 그때 보이는 상태여야 크기를 잡음.
export function ensureGlobe(
  container: HTMLElement,
  onPick: (name: string | null) => void,
): void {
  if (globe) { if (host === container && container.querySelector("canvas")) return; disposeGlobe(); }   // 같은 살아있는 컨테이너면 재사용, 화면 전환으로 바뀌었으면 정리 후 재생성
  host = container;
  globe = new (Globe as any)(container, { animateIn: true })
    .backgroundColor("rgba(0,0,0,0)")
    .width(window.innerWidth)
    .height(window.innerHeight)
    .showAtmosphere(true)
    .atmosphereColor("#28c2ff")
    .atmosphereAltitude(0.16)
    .showGraticules(true)
    .polygonsData(FEATURES)
    .polygonAltitude(0.012)
    .polygonCapColor((f: any) => colorMap[f.properties.name] || INACTIVE)
    .polygonSideColor(() => "rgba(40,194,255,0.10)")
    .polygonStrokeColor(() => "#2b4a5c")
    .polygonsTransitionDuration(300)
    .arcsData([])
    .arcStartLat((d: any) => d.sLat).arcStartLng((d: any) => d.sLng)
    .arcEndLat((d: any) => d.eLat).arcEndLng((d: any) => d.eLng)
    .arcColor((d: any) => d.color)
    .arcAltitudeAutoScale(0.45)
    .arcDashLength(0.35).arcDashGap(0.12).arcDashAnimateTime(1600)
    .onPolygonHover((f: any) => { hoverName = f ? f.properties.name : null; });   // 커서 아래 국가 추적(탭 선택용)

  // 모바일 배터리/발열↓ — 레티나 풀DPR(3x) 대신 상한 2(작은 화면은 1.5)로 캡
  try {
    const r = globe.renderer();
    const cap = window.innerWidth < 640 ? 1.5 : 2;
    if (r && r.setPixelRatio) r.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  } catch { /* noop */ }

  // 바다(구체) 색 — 어두운 네이비-블랙
  const mat = globe.globeMaterial();
  if (mat && mat.color && mat.color.set) { mat.color.set(OCEAN); mat.shininess = 6; }

  // 카메라/컨트롤 — 살짝 자동 회전(슈퍼파워 감성), 드래그로 멈추고 돌릴 수 있음
  const c = globe.controls();
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (c) {
    c.autoRotate = !reduceMotion; c.autoRotateSpeed = 0.15; c.enableDamping = true; c.dampingFactor = 0.12; c.minDistance = 180; c.maxDistance = 520;
    // 조작/클릭 중엔 자동회전 정지 → 회전 중 클릭이 빗나가는 문제 방지(유휴 후 재개)
    let resume: ReturnType<typeof setTimeout> | null = null;
    let dx0 = 0, dy0 = 0, t0 = 0;
    container.addEventListener("pointerdown", (e) => { c.autoRotate = false; if (resume) clearTimeout(resume); dx0 = e.clientX; dy0 = e.clientY; t0 = e.timeStamp; });
    container.addEventListener("pointerup", (e) => {
      if (resume) clearTimeout(resume); resume = setTimeout(() => { c.autoRotate = !reduceMotion; }, 4000);
      // 자체 탭 판정: 거의 안 움직이고 빠르게 뗐으면 선택(관성 회전 중에도 동작 — 라이브러리의 drag-중 클릭무시 우회)
      if (Math.abs(e.clientX - dx0) + Math.abs(e.clientY - dy0) < 6 && e.timeStamp - t0 < 400) onPick(hoverName);
    });
  }
  globe.pointOfView({ lat: 25, lng: 130, altitude: 2.2 }, 0);

  window.addEventListener("resize", resizeGlobe);
}

export function resizeGlobe(): void {
  if (globe) { globe.width(window.innerWidth); globe.height(window.innerHeight); }
}

// 새 게임 등으로 #globe DOM이 교체될 때 인스턴스 정리(다음 ensureGlobe가 새 컨테이너에 재생성)
export function disposeGlobe(): void {
  if (!globe) return;
  try {
    const r = globe.renderer && globe.renderer();
    if (r) { if (r.forceContextLoss) r.forceContextLoss(); if (r.dispose) r.dispose(); }   // WebGL 컨텍스트 명시 해제(재생성 누수 방지)
    if (globe._destructor) globe._destructor();
  } catch { /* noop */ }
  window.removeEventListener("resize", resizeGlobe);
  globe = null; host = null;
  for (const k in colorMap) delete colorMap[k];
}

// 리더 색 갱신 — 실제로 바뀐 경우에만 폴리곤 색 재적용(매 틱 호출돼도 가벼움)
export function paintGlobe(getColor: (name: string) => string | null): void {
  if (!globe) return;
  let changed = false;
  for (const f of FEATURES) {
    const n = f.properties.name;
    const col = getColor(n) || INACTIVE;
    if (colorMap[n] !== col) { colorMap[n] = col; changed = true; }
  }
  if (changed) globe.polygonCapColor(globe.polygonCapColor());   // 동일 접근자 재설정 = 색만 갱신
}

// 자원 할당 아크 갱신 — {from,to,color,level} 목록을 lat/lng로 변환해 적용
export function setGlobeArcs(list: { from: string; to: string; color: string; level: number }[]): void {
  if (!globe) return;
  const arcs: any[] = [];
  for (const a of list) {
    const s = CENTROIDS[a.from], e = CENTROIDS[a.to];
    if (!s || !e) continue;
    arcs.push({ sLng: s[0], sLat: s[1], eLng: e[0], eLat: e[1], color: a.color, level: a.level });
  }
  globe.arcsData(arcs);
}

export { FRONTIER as GLOBE_FRONTIER };
