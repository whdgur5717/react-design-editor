# 구현 순서(체크리스트)

- [ ] 1) 타입/스키마 선행
  - [ ] 1.1 `input.types.ts`/`output.types.ts` 정의(SSOT 준수)
  - [ ] 1.2 `schema/zod/common.ts` 공통 스키마(`ValueRef`, `Geometry`)
  - [ ] 1.3 `schema/zod/input.ts`/`schema/zod/output.ts` 작성
  - [ ] 1.4 모든 필드에 `.meta()` 추가(Zod v4)

- [ ] 2) 노드 데이터 추출(Extractor)
  - [ ] 2.1 선택 노드 트리 수집(`selectionchange` 기반)
  - [ ] 2.2 트리 순회 유틸 적용(`es-toolkit` 사용)
  - [ ] 2.3 노드 타입별 추출 함수 작성(`extract*`)
  - [ ] 2.4 `boundVariables` deep traversal 수집
  - [ ] 2.5 `variableId → variableName` 조회
  - [ ] 2.6 inputSchema 형태로 출력

- [ ] 3) 정규화(Normalizer)
  - [ ] 3.1 Geometry 정규화(px, rotation)
  - [ ] 3.2 Paint 정규화(SOLID/GRADIENT/IMAGE)
  - [ ] 3.3 Effect 정규화(shadow/blur)
  - [ ] 3.4 Layout/ChildLayout 정규화
  - [ ] 3.5 Text 정규화(font, lineHeight, letterSpacing)
  - [ ] 3.6 Zod v4 검증(입력 스키마)

- [ ] 4) AI SDK 연결
  - [ ] 4.1 Vercel AI SDK 클라이언트 구성
  - [ ] 4.2 `transformInputToOutput` 구현
  - [ ] 4.3 OutputSchema 검증 실패 시 재요청

- [ ] 5) 매핑 규칙 적용
  - [ ] 5.1 `layoutMode` → flex
  - [ ] 5.2 `layoutGrow/layoutAlign/layoutPositioning` → flex/position
  - [ ] 5.3 `fills/strokes/effects` → CSS 매핑
  - [ ] 5.4 `constraints` → left/right/top/bottom/transform 계산
  - [ ] 5.5 변환 불가 항목 `meta.issues` 기록

- [ ] 6) 코드 생성
  - [ ] 6.1 OutputSchema → React element 객체 트리 생성
  - [ ] 6.2 스타일은 `props.style`만 사용

- [ ] 7) 테스트
  - [ ] 7.1 노드 타입별 단위 테스트
  - [ ] 7.2 정규화 규칙 테스트
  - [ ] 7.3 Zod 스키마 검증 테스트
  - [ ] 7.4 샘플 Figma 스냅샷 테스트

## 진행 규칙
- 작업 완료 후 체크 박스를 `[x]`로 표시하고 다음 단계로 이동한다.
- Plugma HMR 사용 중이므로 메인 엔트리 파일은 수정하지 않는다(`src/main/main.ts`, `src/ui/App.tsx`, `src/ui/ui.tsx`).
