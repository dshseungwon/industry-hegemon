# Industry Hegemon — 프로젝트 메모리 (Claude Code용)

실시간 **경영 그랜드 전략 게임**. 한 기업을 운영해 세계 시장을 점령(시장점유율 1위 또는 dominate).
장르 감각: Victoria/HOI/문명의 "지도+시스템+실시간" + 기업 경영·재무. 웹(Vite+TS)으로 MVP, 이후 **Tauri로 Steam** 빌드 목표.

## 실행
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit 타입체크 + vite build
```

## 아키텍처 (모듈 책임)
- `src/state.ts` — 타입·초기상태·데이터(기업 FIRM_DEFS, 시장 MARKET_DEFS, 용어집 CODEX). `newGame()`이 상태 팩토리.
- `src/engine.ts` — 순수 로직: `matchScore/leaderOf/recomputeLeaders/myShare`(KSF 적합도→점유율), 재무 `npv/irr/waccOf`, `strategyProjects`(투자 후보+NPV), `tick`(1개월 실시간 진행: 트렌드·소비자 선호 드리프트·벤처 진행·이자·승리체크), `canOperate/setCooldown`(운영 쿨다운).
- `src/ui.ts` — DOM 렌더: `mount`(지도 1회 생성), `render`(매 변화 시 지도 recolor + 상단바 + 오버레이 패널 + 국가 시트 + 확인모달). 프레임워크 없이 innerHTML 재구성 + onclick 바인딩.
- `src/main.ts` — 부팅, 실시간 클럭(setTimeout, speed 0~3, `stepMs`), `Actions` 구현(전략 착수·운영·확인·배속·재시작) + `flash` 토스트.
- `src/mapdata.ts` — 내장 세계지도 좌표(geoNaturalEarth1로 미리 투영, 177개국, 오프라인). 외부 CDN/라이브러리 없음.
- `src/style.css` — 스타일.

## 핵심 모델
- 각 **시장(국가)** 은 소비자 선호 `pref:{tech,brand,scale,global}`(KSF 가중치, 합=1)과 규모를 가짐.
- 기업의 **역량(caps)** 이 그 시장 pref에 얼마나 맞는지(`matchScore`, 역량은 `gcap`로 체감수익 적용)로 **점령자**가 정해짐 → 점유율.
- **환경/소비자는 시간에 따라 계속 변함**(트렌드 bias로 pref 드리프트). 그래서 "지금 어디가 무엇을 원하는지" 읽고 맞춰야 함.
- **전략 = 투자 프로젝트**: 역량을 키우는 벤처를 NPV/IRR로 판단해 착수하고, 시간이 흐르며 **운영**(가속·리스크대응·대상변경·취소)으로 완성시킴.

## 설계 원칙 (반드시 유지)
1. 전략 실행 = **확인 모달**(투자 케이스 NPV/IRR + "정말 진행?").
2. 운영 행동에 **쿨다운**(무한 클릭 금지). `canOperate/setCooldown` 사용.
3. **실시간 흐름**(턴 아님). 일시정지·배속. 환경 계속 변화.
4. **세계지도 상시 표시** + 나머지는 **오버레이 패널**(드로어). 전체화면 탭 전환 금지.

## 규칙/관례
- TypeScript strict. 빌드는 `tsc --noEmit`(타입체크) + vite. src에 .js 산출물 만들지 말 것.
- 상태는 `state.ts`의 `GameState` 한 곳에. 엔진은 가급적 순수 함수. UI는 상태를 읽어 다시 그림.
- 새 시장/기업/이벤트/용어는 `state.ts` 데이터에 추가. 지도 국가명은 `mapdata.ts`의 `properties.name`과 일치해야 함(예: "South Korea","United States of America").

## 밸런스 메모(주의)
- 점유율은 적합도의 **거듭제곱(민감도)** 으로 계산해야 투자가 의미 있음(선형이면 투자가 점유율을 못 움직여 "정직한 투자가 손해"가 됨 — 과거 MVP의 함정). 현재 `gcap` 체감수익 + 상대 비교로 처리. 추가 튜닝 필요.
- 환경 변동폭이 너무 크면 "최고 NPV 추종"이 근시안 함정이 됨. 적당히.
- AI는 가볍게 드리프트만. 추후 경쟁사도 동일 메뉴(투자/ M&A 등)로 두도록 확장.

## 로드맵(우선순위)
1. **밸런스 튜닝** — 실제 플레이로 난이도/재미 조정(점유율 민감도, 환경 변동, 벤처 속도/쿨다운, 승리조건).
2. **국가 심화** — 국가별 경쟁사 거점·진입장벽·규제/정치 성향, 클릭 시 풍부한 패널.
3. **재무 심화** — 부채/증자/배당, WACC가 금리·레버리지에 연동, 파산 리스크.
4. **전략 확장** — M&A(약체 인수·제거), 전략적 동맹/JV, 해외진출(시장 확대), 로비(환경에 영향), 테크트리.
5. **콘텐츠 주입** — 자매 파이프라인 "The Industry Brief"(GitHub: dshseungwon/daily-industry-report)가 매일 산업 KSF·규제·밸류체인·1위 기업 데이터를 생성. 이걸 시나리오로 변환해 실제 산업/국가 수치 주입.
6. **연출** — 점령 애니메이션·효과음·승리 연출.
7. **저장/로드, i18n(한/영), 튜토리얼**.
8. **Tauri 패키징** → Steam(도전과제·클라우드세이브는 steamworks 연동).

## 좋은 첫 작업 후보
- 국가 시트에서 그 시장의 "현재 경합 점수(기업별)" 표시.
- 벤처 완성 시 지도에서 점령된 국가가 잠깐 번쩍이는 연출(CSS).
- 전략 패널에 "해외진출/ M&A" 프로젝트 타입 추가(엔진 `strategyProjects` 확장).
