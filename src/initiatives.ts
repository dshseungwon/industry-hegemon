// 산업 특화 전략 이니셔티브 — 산업마다 "그 판의 실제 전략" 메뉴(다중 선택). 액션명만(기업명 미포함).
// kind: steady(확실한 소폭 영구 보너스) / gamble(성공 확률 — 대박/실패) / scale(생산능력 증설형).
// 해소 순서: gics(마퀴) → sector(섹터 템플릿) → generic(최후 폴백). 효과는 engine이 완성 시 적용.
import { Cap } from "./state";

export type InitKind = "steady" | "gamble" | "scale";
export interface InitEffect { caps?: Partial<Record<Cap, number>>; marginAdd?: number; overheadCut?: number; capacityBonus?: number; }
export interface Initiative {
  id: string; name: string; desc: string; kind: InitKind;
  cap: Cap;                 // 대표 KSF(벤처 슬롯·진행 표시)
  capex: number; months: number;
  successProb?: number;     // gamble 전용
  effect: InitEffect;       // 완성(또는 gamble 성공) 효과
  failEffect?: InitEffect;  // gamble 실패 효과(주로 소폭 후퇴 — 비용은 이미 매몰)
}

const G = (id: string, name: string, desc: string, cap: Cap, capex: number, months: number, successProb: number, effect: InitEffect, failEffect: InitEffect): Initiative =>
  ({ id, name, desc, kind: "gamble", cap, capex, months, successProb, effect, failEffect });
const S = (id: string, name: string, desc: string, cap: Cap, capex: number, months: number, effect: InitEffect): Initiative =>
  ({ id, name, desc, kind: "steady", cap, capex, months, effect });
const C = (id: string, name: string, desc: string, cap: Cap, capex: number, months: number, effect: InitEffect): Initiative =>
  ({ id, name, desc, kind: "scale", cap, capex, months, effect });

// ── 마퀴(손수 작성) — 실제 gics 코드 + 빌트인 ──
const BY_GICS: Record<string, Initiative[]> = {
  "453010": [ // 반도체
    G("hbm", "HBM 개발", "차세대 고대역폭 메모리에 사활. 성공하면 기술 패권, 실패하면 막대한 매몰.", "tech", 95, 20, 0.55, { caps: { tech: 28 }, marginAdd: 0.003 }, { caps: { tech: -4 } }),
    S("nodeshrink", "차세대 공정 미세화", "공정 미세화로 점진적 기술 우위 확보(확실).", "tech", 55, 14, { caps: { tech: 12 } }),
    C("foundry", "파운드리 증설", "대규모 생산능력 확장으로 물량 패권.", "scale", 75, 12, { capacityBonus: 110, caps: { scale: 8 } }),
  ],
  "352020": [ // 제약
    G("blockbuster", "블록버스터 신약", "대형 신약 임상에 베팅. 성공 시 시장 재편, 실패 시 파이프라인 타격.", "tech", 100, 24, 0.45, { caps: { tech: 30, brand: 10 }, marginAdd: 0.004 }, { caps: { tech: -5 } }),
    S("biosimilar", "바이오시밀러", "특허 만료 의약품 복제로 안정적 원가·물량.", "scale", 55, 14, { overheadCut: 1, caps: { scale: 10 } }),
    S("indication", "적응증 확대", "기존 약의 적응증을 넓혀 매출 안정 확대.", "brand", 50, 12, { caps: { brand: 12 } }),
  ],
  "352010": [ // 바이오텍
    G("platform", "신약 플랫폼 기술", "혁신 모달리티 플랫폼에 도박. 성공 시 기술 도약.", "tech", 90, 22, 0.5, { caps: { tech: 30 } }, { caps: { tech: -4 } }),
    S("license", "라이선스 아웃", "초기 파이프라인을 기술수출해 안정 수익.", "global", 45, 10, { caps: { global: 10 }, marginAdd: 0.002 }),
  ],
  "352030": [ // 생명과학 도구
    S("instruments", "분석장비 고도화", "정밀 분석장비로 기술 차별화.", "tech", 55, 14, { caps: { tech: 12 } }),
    C("capacity", "소모품 대량생산", "소모품·시약 대량 공급망 구축.", "scale", 65, 12, { capacityBonus: 90, caps: { scale: 8 } }),
  ],
  "251020": [ // 자동차
    C("ev", "EV 전환", "전기차 전용 플랫폼·생산으로 대전환.", "scale", 90, 18, { capacityBonus: 120, caps: { scale: 10, tech: 6 } }),
    G("autonomy", "자율주행 개발", "자율주행 기술에 베팅. 성공 시 기술 선도.", "tech", 95, 22, 0.45, { caps: { tech: 28 }, marginAdd: 0.003 }, { caps: { tech: -5 } }),
    S("brandprestige", "프리미엄 브랜드화", "고급 라인업으로 브랜드 가치↑.", "brand", 55, 14, { caps: { brand: 12 } }),
  ],
  "251010": [ // 자동차 부품(모비스 시나리오)
    S("electrify", "전동화 부품 전환", "구동·배터리 부품으로 포트폴리오 전환(확실).", "tech", 55, 14, { caps: { tech: 12 } }),
    C("module", "모듈 통합 공급", "통합 모듈 대량 공급으로 규모 우위.", "scale", 70, 12, { capacityBonus: 100, caps: { scale: 8 } }),
    G("battery", "차세대 배터리 부품", "차세대 셀·소재 부품에 베팅.", "tech", 90, 20, 0.5, { caps: { tech: 26 }, marginAdd: 0.003 }, { caps: { tech: -4 } }),
  ],
  "451030": [ // 소프트웨어
    G("aiplatform", "AI 플랫폼", "AI 핵심 플랫폼에 베팅. 성공 시 생태계 장악.", "tech", 90, 18, 0.5, { caps: { tech: 28 }, marginAdd: 0.004 }, { caps: { tech: -4 } }),
    S("subscription", "구독 전환", "라이선스→구독으로 마진·안정성↑(확실).", "brand", 55, 12, { marginAdd: 0.003, caps: { brand: 8 } }),
    S("globalexpand", "글로벌 확장", "다국어·리전 확장으로 글로벌 도달.", "global", 50, 12, { caps: { global: 12 } }),
  ],
  "502030": [ // 인터랙티브 미디어
    G("superapp", "슈퍼앱 전환", "단일 앱에 서비스 결집 베팅. 성공 시 락인.", "brand", 90, 18, 0.5, { caps: { brand: 26, global: 8 } }, { caps: { brand: -4 } }),
    S("adoptimize", "광고 최적화", "타게팅 고도화로 수익성↑(확실).", "tech", 55, 12, { marginAdd: 0.003, caps: { tech: 8 } }),
    S("creator", "크리에이터 생태계", "창작자 생태계로 콘텐츠 해자.", "brand", 50, 12, { caps: { brand: 12 } }),
  ],
  "401010": [ // 은행
    S("digital", "디지털 전환", "비대면·자동화로 비용 효율↑(확실).", "tech", 55, 14, { overheadCut: 1, caps: { tech: 10 } }),
    S("compliance", "리스크·규제 대응", "건전성·컴플라이언스 강화로 안정.", "scale", 45, 10, { overheadCut: 1 }),
    G("ibexpand", "글로벌 IB 확장", "투자은행·해외 진출에 베팅.", "global", 90, 18, 0.45, { caps: { global: 26 }, marginAdd: 0.003 }, { caps: { global: -4 } }),
  ],
  "101020": [ // 석유·가스
    C("upstream", "대규모 증산", "상류 개발로 생산능력 대폭 확장.", "scale", 90, 14, { capacityBonus: 140, caps: { scale: 8 } }),
    G("transition", "에너지 전환(신재생)", "신재생·수소로 전환 베팅. 성공 시 미래 선점.", "tech", 100, 24, 0.4, { caps: { tech: 28, global: 8 }, marginAdd: 0.003 }, { caps: { tech: -5 } }),
    S("costcut", "원가 절감", "효율화로 단위 원가↓(확실).", "scale", 50, 12, { overheadCut: 2 }),
  ],
  "151010": [ // 화학
    S("specialty", "스페셜티 고부가", "범용→고부가 스페셜티 전환으로 마진↑.", "tech", 60, 14, { marginAdd: 0.003, caps: { tech: 10 } }),
    C("scaleup", "대규모 증설", "기초소재 대규모 증설로 규모 우위.", "scale", 75, 12, { capacityBonus: 120, caps: { scale: 8 } }),
    G("greenmat", "친환경 소재", "친환경·바이오 소재에 베팅.", "tech", 90, 20, 0.5, { caps: { tech: 26 } }, { caps: { tech: -4 } }),
  ],
  "201010": [ // 항공우주·방산
    G("nextgen", "차세대 체계 개발", "차세대 기체·무기체계에 베팅. 성공 시 기술 도약.", "tech", 100, 24, 0.45, { caps: { tech: 30 }, marginAdd: 0.003 }, { caps: { tech: -5 } }),
    S("massprod", "양산 효율화", "양산 라인 효율로 비용·품질↑(확실).", "scale", 55, 14, { overheadCut: 1, caps: { scale: 10 } }),
    S("exportwin", "글로벌 수주", "해외 수주망 확대로 글로벌 확장.", "global", 60, 14, { caps: { global: 12 } }),
  ],
  "BUILTIN": [ // 소비자 전자·스마트폰(빌트인)
    G("flagshipchip", "차세대 칩 개발", "자체 칩·차세대 부품에 베팅. 성공 시 기술 선도.", "tech", 90, 18, 0.5, { caps: { tech: 28 }, marginAdd: 0.003 }, { caps: { tech: -4 } }),
    S("ecosystem", "생태계 구축", "기기·서비스 생태계로 락인·마진↑(확실).", "brand", 60, 14, { marginAdd: 0.003, caps: { brand: 10 } }),
    C("globalmfg", "글로벌 생산기지", "해외 대규모 생산으로 물량·원가 우위.", "scale", 75, 12, { capacityBonus: 110, caps: { scale: 8 } }),
  ],
};

// ── 섹터 템플릿(마퀴 외 폴백) — 그 섹터 색에 맞춘 3종 ──
const BY_SECTOR: Record<string, Initiative[]> = {
  "Information Technology": [S("it-rnd", "R&D 가속", "핵심 기술 역량 강화(확실).", "tech", 55, 14, { caps: { tech: 12 } }), G("it-bet", "차세대 기술 베팅", "신기술에 도박 — 성공 시 도약.", "tech", 90, 18, 0.5, { caps: { tech: 26 }, marginAdd: 0.003 }, { caps: { tech: -4 } }), C("it-scale", "데이터센터 증설", "인프라 증설로 규모 우위.", "scale", 70, 12, { capacityBonus: 100, caps: { scale: 8 } })],
  "Health Care": [G("hc-drug", "신약·치료제 개발", "임상 베팅 — 대박/실패.", "tech", 95, 22, 0.45, { caps: { tech: 28, brand: 8 } }, { caps: { tech: -5 } }), S("hc-quality", "품질·규제 대응", "품질·인허가 강화(확실).", "scale", 50, 12, { overheadCut: 1, caps: { scale: 8 } }), S("hc-brand", "전문가 신뢰 구축", "임상·브랜드 신뢰↑.", "brand", 55, 14, { caps: { brand: 12 } })],
  "Consumer Discretionary": [S("cd-brand", "브랜드 캠페인", "브랜드 가치 강화(확실).", "brand", 55, 12, { caps: { brand: 12 } }), C("cd-scale", "생산·유통 확장", "물량·채널 확장.", "scale", 70, 12, { capacityBonus: 100, caps: { scale: 8 } }), G("cd-newcat", "신카테고리 진출", "신제품군 베팅.", "tech", 85, 16, 0.5, { caps: { tech: 22, brand: 8 } }, { caps: { brand: -3 } })],
  "Consumer Staples": [S("cs-cost", "원가 절감", "공급망 효율로 원가↓(확실).", "scale", 50, 12, { overheadCut: 2 }), S("cs-brand", "브랜드 확장", "라인업·브랜드 확장.", "brand", 55, 12, { caps: { brand: 10 } }), C("cs-supply", "공급망 증설", "대량 생산·유통망.", "scale", 65, 12, { capacityBonus: 90, caps: { scale: 8 } })],
  "Industrials": [C("in-cap", "생산능력 증설", "설비 증설로 규모 우위.", "scale", 70, 12, { capacityBonus: 110, caps: { scale: 8 } }), S("in-auto", "공장 자동화", "자동화로 고정비↓(확실).", "scale", 55, 14, { overheadCut: 2 }), G("in-nextgen", "차세대 제품 개발", "신제품 베팅.", "tech", 90, 18, 0.5, { caps: { tech: 26 } }, { caps: { tech: -4 } })],
  "Materials": [C("ma-scale", "대규모 증설", "기초소재 증설.", "scale", 75, 12, { capacityBonus: 120, caps: { scale: 8 } }), S("ma-spec", "고부가 소재", "스페셜티 전환으로 마진↑.", "tech", 60, 14, { marginAdd: 0.003, caps: { tech: 10 } }), S("ma-cost", "원가 절감", "효율화로 원가↓.", "scale", 50, 12, { overheadCut: 2 })],
  "Energy": [C("en-prod", "대규모 증산", "생산능력 확장.", "scale", 90, 14, { capacityBonus: 140, caps: { scale: 8 } }), G("en-clean", "에너지 전환", "신재생 전환 베팅.", "tech", 95, 22, 0.4, { caps: { tech: 26, global: 8 } }, { caps: { tech: -5 } }), S("en-cost", "원가 절감", "효율화.", "scale", 50, 12, { overheadCut: 2 })],
  "Financials": [S("fi-digital", "디지털 전환", "비대면·자동화로 효율↑.", "tech", 55, 14, { overheadCut: 1, caps: { tech: 10 } }), S("fi-risk", "리스크 관리", "건전성 강화로 안정.", "scale", 45, 10, { overheadCut: 1 }), G("fi-global", "글로벌 확장", "해외 진출 베팅.", "global", 90, 18, 0.45, { caps: { global: 26 } }, { caps: { global: -4 } })],
  "Communication Services": [G("co-platform", "플랫폼 베팅", "플랫폼·콘텐츠 베팅.", "brand", 90, 18, 0.5, { caps: { brand: 26, global: 8 } }, { caps: { brand: -4 } }), S("co-ad", "수익화 최적화", "광고·구독 수익성↑.", "tech", 55, 12, { marginAdd: 0.003, caps: { tech: 8 } }), S("co-global", "글로벌 확장", "리전 확장.", "global", 55, 12, { caps: { global: 12 } })],
  "Utilities": [C("ut-grid", "설비·망 확충", "발전·송배전 확충.", "scale", 80, 14, { capacityBonus: 120, caps: { scale: 8 } }), S("ut-eff", "운영 효율화", "고정비 절감(확실).", "scale", 50, 12, { overheadCut: 2 }), G("ut-renew", "신재생 전환", "친환경 발전 베팅.", "tech", 90, 20, 0.45, { caps: { tech: 24, global: 6 } }, { caps: { tech: -4 } })],
  "Real Estate": [C("re-dev", "대규모 개발", "자산 개발로 규모 확장.", "scale", 80, 14, { capacityBonus: 120, caps: { scale: 8 } }), S("re-prime", "프라임 자산", "핵심 입지로 가치·마진↑.", "brand", 60, 14, { marginAdd: 0.003, caps: { brand: 10 } }), S("re-cost", "운영 효율화", "비용 절감.", "scale", 50, 12, { overheadCut: 1 })],
};

// ── 최후 폴백 ──
const GENERIC: Initiative[] = [
  S("gen-rnd", "R&D 가속", "핵심 기술 역량 강화(확실).", "tech", 55, 14, { caps: { tech: 12 } }),
  S("gen-brand", "브랜드 캠페인", "브랜드 가치↑(확실).", "brand", 55, 12, { caps: { brand: 12 } }),
  C("gen-scale", "생산능력 증설", "규모 우위.", "scale", 70, 12, { capacityBonus: 100, caps: { scale: 8 } }),
  S("gen-cost", "원가 절감", "고정비 절감(확실).", "scale", 50, 12, { overheadCut: 2 }),
];

// 현 시나리오의 이니셔티브 메뉴(gics→sector→generic).
export function initiativesFor(scenario: { key: string; sector: string }): Initiative[] {
  const k = scenario.key || "";
  const gics = k.startsWith("ind-") ? k.slice(4) : (k === "consumer-electronics" ? "BUILTIN" : "");
  return BY_GICS[gics] || BY_SECTOR[scenario.sector] || GENERIC;
}
// id로 이니셔티브 조회(전 레지스트리 평탄화).
export function initiativeById(id: string): Initiative | undefined {
  for (const arr of [...Object.values(BY_GICS), ...Object.values(BY_SECTOR), GENERIC]) { const f = arr.find(x => x.id === id); if (f) return f; }
  return undefined;
}
