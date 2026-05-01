# Test Plans

<!--
Template for each plan:
## YYYY-MM-DD: [Feature / Issue]
- **Context**:
- **Scope (IN)**:
- **Scope (OUT)**:
- **Risks**:
- **Acceptance Criteria (binary)**:
- **Verification Commands**:
- **E2E Scenarios**:
-->

## 2026-03-12: Properties Panel — Schema-Driven Full Style Coverage (PR #97)

- **Context**: Phase 1 유일 P0 블로커. 기존 Properties Panel을 스키마 기반으로 전면 리팩토링하면서 새로운 스타일 속성 추가. 커밋 `fe5c1c1`.
- **Scope (IN)**:
  - 새 입력 컴포넌트: NumberInput, SelectInput, ColorInput, TextInput, SliderInput, ShorthandInput, CompositeInput, CheckboxInput
  - 새 스타일 속성: per-side padding/margin, opacity, box-shadow, per-corner border-radius, min/max dimensions, extended typography (fontFamily, lineHeight, letterSpacing), flex child (flexGrow, flexShrink, flexBasis, alignSelf)
  - 기존 속성 회귀: width, height, display, flex layout, CSS position, overflow, backgroundColor, border, typography
  - UpdateStyleCommand: undo/redo, merge 동작
  - 조건부 섹션 표시: Flex Layout (display=flex일 때), Position Offsets (position=absolute/fixed/sticky일 때), Flex Child (부모 display=flex일 때)
- **Scope (OUT)**: Gradients, transforms/rotation, 라벨 드래그 (PM 결정: P1으로 별도 추적, P0 영향 없음), 패널 전면 재설계
- **Risks**: 2. ShorthandInput shorthand↔per-side 전환 시 값 손실 가능 3. CompositeInput(boxShadow) parseBoxShadow regex가 rgba() 등 복잡한 색상 포맷 파싱 실패 가능 4. SliderInput이 native `<input type="number">`를 사용하여 NumberInput의 commit strategy와 다르게 동작 (onChange 즉시 반영) 5. 조건부 섹션 visibility — 부모 스타일 변경 시 자식의 Flex Child 섹션 표시/숨김 타이밍
- **Acceptance Criteria (binary)**:
  1. [ ] 모든 새 스타일 속성 편집 시 캔버스 노드에 즉시 반영된다
  2. [ ] NumberInput 타이핑 → Enter/blur 시에만 커밋된다 (중간값 미반영)
  3. [ ] NumberInput 빈 입력 + blur → 이전 값 복원 (0이나 NaN 아님)
  4. [ ] NumberInput Arrow Up/Down → 즉시 커밋, Shift+Arrow → 10단위 증감
  5. [ ] ShorthandInput: shorthand 값 입력 → per-side 토글 → 4면 모두 같은 값 유지
  6. [ ] ShorthandInput: per-side 값 개별 수정 → shorthand로 축소 시 첫 번째 값 사용
  7. [ ] CompositeInput(boxShadow): 부분값 수정 시 나머지 값 유지, CSS 문자열 올바르게 합성
  8. [ ] Opacity 슬라이더: 0~1 범위, 캔버스 노드 투명도에 반영
  9. [ ] 조건부 섹션: display=flex 선택 시 Flex Layout 섹션 표시, 해제 시 숨김
  10. [ ] 조건부 섹션: position=absolute 선택 시 Position Offsets 표시
  11. [ ] 조건부 섹션: 부모가 display=flex일 때 자식 선택 시 Flex Child 섹션 표시
  12. [ ] 모든 스타일 변경에 Undo/Redo 정상 동작
  13. [ ] 기존 속성(width, height, backgroundColor 등) 동작 회귀 없음
  14. [ ] 새 스타일 속성이 Code 탭(serializeNode)에 올바르게 반영된다 (Design=Code 원칙)
- **Verification Commands**:
  - `pnpm lint && pnpm type-check`
  - `pnpm test:unit`
  - `pnpm test:e2e`
- **E2E Scenarios (우선순위순)**:

### Tier 1: NumberInput UX (모든 숫자 입력의 기반 패턴)

1. width 입력에 "200" 타이핑 → Enter → propW가 "200"으로 변경, 캔버스 노드 width 200px
2. width 입력에 "abc" 타이핑 → blur → 이전 값("400")으로 복원
3. width 입력 비우기 → blur → 이전 값으로 복원 (0이나 NaN 아님)
4. width 입력 포커스 → ArrowUp → 값 1 증가, 즉시 반영
5. width 입력 포커스 → Shift+ArrowUp → 값 10 증가, 즉시 반영
6. width 입력 포커스 → Escape → 이전 값 복원, blur
7. SliderInput(opacity) 숫자 입력란에 값 타이핑 → 즉시 반영 여부 확인 (PM: 현재 허용, 기록만)

### Tier 2: 새 스타일 속성

8. per-side padding: shorthand 입력 → "16" → 4면 모두 16px 확인 → per-side 토글 → paddingTop만 "24"로 변경 → 캔버스 반영
9. opacity 슬라이더: 슬라이더를 0.5로 이동 → 캔버스 노드에 opacity: 0.5 반영
10. per-corner border-radius: shorthand → per-corner 토글 → TL만 "12"로 변경 → 캔버스 반영
11. box-shadow: offsetX=2, offsetY=4, blur=8, spread=0, color=#ff0000 → 캔버스에 그림자 반영
12. box-shadow roundtrip: hex 색상으로 shadow 설정 → 다른 노드 선택 후 다시 선택 → 같은 값 표시 확인 (decompose→compose 왕복)
13. minWidth/maxWidth: 값 설정 후 캔버스 노드 스타일에 반영
14. fontFamily: "monospace" 입력 → 캔버스 텍스트 노드 폰트 변경
15. lineHeight, letterSpacing: 값 설정 → 캔버스 반영

### Tier 3: 조건부 섹션 & Flex

16. display를 "flex"로 변경 → Flex Layout 섹션 표시 → flexDirection, gap, alignItems, justifyContent 편집 가능
17. Flex Child 전체 플로우: 부모 Frame을 display: flex로 설정 → 자식 노드 선택 → "Flex Child" 섹션 표시 확인 → flexGrow 편집 → 부모를 display: block으로 변경 → 자식 재선택 → "Flex Child" 섹션 숨김 확인
18. position을 "absolute"로 변경 → Position Offsets 섹션 표시 → top/left 편집 가능
19. display를 "block"으로 변경 → Flex Layout 섹션 숨김

### Tier 4: Undo/Redo

20. 스타일 변경 후 Cmd+Z → 이전 값 복원, Cmd+Shift+Z → 다시 적용
21. 연속 ArrowUp 3회 후 Cmd+Z → 하나의 undo 단위로 복원 (merge key 동작 검증)

### Tier 5: 코드 생성 (Design=Code)

22. opacity 설정 후 Code 탭에서 `opacity: 0.5` 포함 확인
23. per-side padding 설정 후 Code 탭에서 `paddingTop: 16` 등 개별 키 포함 확인
24. box-shadow 설정 후 Code 탭에서 `boxShadow: "2px 4px 8px 0px #ff0000"` 포함 확인
25. 숫자값(width: 200)이 코드에서 단위 없이 순수 숫자로 출력 확인 (React inline style 규칙)

### Tier 6: 기존 기능 회귀 (P0 판정 별도, 회귀 버그는 별도 이슈로 추적)

26. width/height 편집 → 캔버스 반영 (기존 동작 유지)
27. backgroundColor 색상 변경 → 캔버스 반영
28. border width/style/color 변경 → 캔버스 반영

- **data-testid 매핑** (StyleControlRenderer 기준):
  - `style-width`, `style-height`, `style-minWidth`, `style-maxWidth`, `style-minHeight`, `style-maxHeight`
  - `style-display`, `style-flexDirection`, `style-gap`, `style-alignItems`, `style-justifyContent`
  - `style-position`, `style-top`, `style-left`, `style-bottom`, `style-right`
  - `style-overflow`
  - `style-padding` (shorthand), `style-margin` (shorthand)
  - `style-backgroundColor`, `style-opacity`, `style-boxShadow`
  - `style-borderWidth`, `style-borderRadius` (shorthand), `style-borderColor`, `style-borderStyle`
  - `style-fontFamily`, `style-fontSize`, `style-fontWeight`, `style-lineHeight`, `style-letterSpacing`, `style-color`, `style-textAlign`
  - `style-flexGrow`, `style-flexShrink`, `style-flexBasis`, `style-alignSelf`
  - `position-x`, `position-y` (Canvas Position, 스키마 밖)
- **Cross-links**:
  - See PM decision: 2026-03-09: NumberInput UX 전략 -- Figma-style Hybrid (Option D)
  - See PM decision: 2026-03-05: Properties Panel 통합 (P0 #1)

---

## 2026-03-12: 리팩토링 회귀 테스트 (EditorService → Editor 전환)

- **Context**: 커밋 `558f89a`, `16495ed`, `d453a12` — EditorService → Editor 이름 변경, CanvasBridge/ActionRegistry 추출, keybinding defaults를 as const로 전환. 기능 변경 없이 내부 구조만 변경.
- **Scope (IN)**: 기본 편집 플로우 회귀 확인
- **Scope (OUT)**: 새 기능 테스트, 성능 테스트
- **Risks**: 이름 변경 시 import 누락, 런타임 undefined 참조
- **Acceptance Criteria (binary)**:
  1. [ ] 노드 생성 (Frame, Text) 정상 동작
  2. [ ] 노드 선택 (클릭, 레이어 패널) 정상 동작
  3. [ ] 노드 이동 (드래그, 화살표 키) 정상 동작
  4. [ ] 노드 리사이즈 (8방향 핸들) 정상 동작
  5. [ ] 키보드 단축키 (Undo, Redo, Delete, Duplicate) 정상 동작
  6. [ ] 캔버스 Pan/Zoom 정상 동작
  7. [ ] `pnpm type-check` 통과
  8. [ ] 기존 E2E 테스트 전체 통과
- **Verification Commands**:
  - `pnpm type-check`
  - `pnpm test:e2e`

---

## 2026-03-12: 코드 위생 — DEBUG 코드 정리 필요

- **Context**: uncommitted 변경사항에 jitter 측정용 debug 코드가 3개 파일에 남아있음
- **영향 파일**:
  - `packages/editor-canvas/src/App.tsx`: frame counter IIFE, syncState console.log
  - `packages/editor-shell/src/components/Overlay/ToolManagerOverlay.tsx`: frame counter, console.log
  - `packages/editor-shell/src/interaction/pointerMachine.ts`: frame counter, wheelSeq, console.log
- **판정**: merge/커밋 전에 반드시 제거해야 함 (Stop-Ship: 프로덕션 콘솔 스팸)
- **Acceptance Criteria**:
  1. [ ] 위 3개 파일에서 DEBUG 주석 블록 및 console.log 제거
  2. [ ] 제거 후 `pnpm type-check` 통과
  3. [ ] 제거 후 기존 E2E 테스트 통과
