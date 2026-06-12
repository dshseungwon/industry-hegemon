# 산업 패권 (Industry Hegemon)

실시간 경영 그랜드 전략 게임 — Vite + TypeScript.

## 실행
```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입체크 + 프로덕션 빌드 -> dist/
npm run preview  # 빌드 결과 미리보기
```

## 구조
- `src/state.ts` — 게임 상태·데이터(기업·시장·용어집)
- `src/engine.ts` — KSF 적합도·점유율, 재무(NPV/IRR/WACC), 실시간 tick, 환경 변화
- `src/ui.ts` — 세계지도 렌더, 상단바, 오버레이 패널, 확인 모달, 국가 시트
- `src/main.ts` — 부팅 + 실시간 클럭(일시정지·배속) + 액션 와이어링
- `src/mapdata.ts` — 내장 세계지도 좌표(오프라인)
- `src/style.css` — 스타일

## 설계 원칙(현재 반영)
1. 전략 실행 시 **확인 모달**(NPV/IRR 표시 + 정말 진행?).
2. 운영 행동에 **쿨다운**(무한 클릭 방지).
3. **실시간 흐름**(턴 대신 시간이 흐르고 환경/소비자가 계속 변함, 일시정지·배속).
4. **세계지도 상시 표시** + 나머지는 **오버레이 패널**(문명식 탭).

## 다음 단계(로드맵)
국가별 경쟁사 거점·진입장벽, 재무 심화(부채/증자/배당), M&A·동맹·로비·테크트리,
The Industry Brief 데이터 주입, 점령 연출·효과음, Tauri로 Steam 빌드.
