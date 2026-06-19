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
const colorMap: Record<string, string> = {};   // 국가명 → cap 색(렌더 시 채움)

// 한 번만 생성(처음 3D로 전환될 때). 컨테이너는 그때 보이는 상태여야 크기를 잡음.
export function ensureGlobe(
  container: HTMLElement,
  onPick: (name: string | null) => void,
): void {
  if (globe) return;
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
    .onPolygonClick((f: any) => onPick(f?.properties?.name ?? null))
    .onGlobeClick(() => onPick(null));

  // 바다(구체) 색 — 어두운 네이비-블랙
  const mat = globe.globeMaterial();
  if (mat && mat.color && mat.color.set) { mat.color.set(OCEAN); mat.shininess = 6; }

  // 카메라/컨트롤 — 살짝 자동 회전(슈퍼파워 감성), 드래그로 멈추고 돌릴 수 있음
  const c = globe.controls();
  if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.32; c.enableDamping = true; c.dampingFactor = 0.12; c.minDistance = 180; c.maxDistance = 520; }
  globe.pointOfView({ lat: 25, lng: 130, altitude: 2.2 }, 0);

  window.addEventListener("resize", resizeGlobe);
}

export function resizeGlobe(): void {
  if (globe) { globe.width(window.innerWidth); globe.height(window.innerHeight); }
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

export { FRONTIER as GLOBE_FRONTIER };
