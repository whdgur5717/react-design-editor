# 제품 결정 기록

<!--
각 결정 구조:
## YYYY-MM-DD: [결정 제목]
- **맥락**: 왜 이 결정이 필요했는지
- **선택지**: 고려한 옵션들
- **결정**: 선택한 것
- **근거**: 왜 이것을 선택했는지
- **영향**: 이 결정이 미치는 범위
-->

## 2026-03-05: Drag-to-Create를 P0에서 P1으로 강등

- **맥락**: 개발자가 "drag-to-create가 꼭 P0인가? 클릭 생성 + 리사이즈로 충분하지 않나?"라고 질문함.
- **선택지**:
  1. P0 유지 -- 디자인 도구의 기본 인터랙션이므로 필수
  2. P1로 강등 -- 클릭 + 리사이즈로 동일 결과를 만들 수 있으므로 효율성 개선일 뿐
- **결정**: P1으로 강등
- **근거**: Phase 1 완료 기준은 "any UI layout can be constructed." 핵심은 "가능/불가능"이지 "효율"이 아님. 클릭 생성 + 리사이즈로 어떤 크기든 만들 수 있으므로 capability gap이 아닌 efficiency gap. 같은 논리로 Copy/Paste, Shape Tool, Alignment도 P1로 재분류. 진짜 P0은 "이게 없으면 해당 스타일/레이아웃을 아예 만들 수 없는 것" -- Per-Side Spacing과 Extended Style Properties만 해당.
- **영향**: P0이 6개에서 2개로 축소. 개발 착수 순서가 Per-Side Spacing -> Extended Style Properties로 변경. Phase 1 완료까지의 경로가 명확해짐.

## 2026-03-05: Per-Side Spacing + Extended Style Properties를 하나의 작업으로 통합

- **맥락**: 개발자가 "이건 결국 프로퍼티 패널을 한번 제대로 손보는 작업이다. PM은 별개 기능으로 보겠지만 구현 관점에서는 같은 작업이다"라고 제안.
- **선택지**:
  1. 분리 유지 -- PM 관점에서 별개 기능이므로 별도 추적
  2. 통합 -- 구현 단위로 합쳐서 "Properties Panel: Full Style Coverage"로 진행
- **결정**: 통합. 백로그에서 P0 #1 하나로 합침.
- **근거**: 구현 단위를 결정하는 것은 개발자 영역. 같은 패널 코드를 두 번 만지는 것보다 한 번에 하는 게 합리적. 단, 스코프는 합의된 속성 목록으로 한정 -- gradient, transform, 패널 전면 재설계는 OUT.
- **영향**: P0이 2개에서 1개로. "Properties Panel: Full Style Coverage"가 Phase 1의 유일한 P0 블로커.

## 2026-03-09: NumberInput UX 전략 -- Figma-style Hybrid (Option D)

- **맥락**: Properties Panel에서 NumberInput이 onChange로 동작해, 키 입력마다 즉시 스타일에 반영됨. 중간값(400→40→4)이 캔버스에 모두 반영되고 빈 칸 입력이 불가능한 문제. Phase 1 P0(Full Style Coverage)에서 숫자 입력이 대폭 늘어나기 전에 패턴을 확정해야 함.
- **선택지**:
  1. Option A: onChange 유지 (실시간, 중간값 문제)
  2. Option B: onSubmit only (Enter/blur, 실시간 피드백 없음)
  3. Option C: debounce hybrid (두 모드 모두 어중간)
  4. Option D: Figma-style hybrid (타이핑=onSubmit, 라벨 드래그=onChange)
- **결정**: Option D. Figma-style hybrid.
- **근거**: 사용자의 숫자 입력에는 두 가지 모드가 있다: (1) 정확한 값을 아는 경우 → 타이핑 → onSubmit이 적합, (2) 시각적으로 탐색하는 경우 → 드래그/스크럽 → onChange가 적합. 하나의 전략으로 둘 다 커버할 수 없으므로 모드별로 다른 커밋 전략을 적용. 이 에디터는 Design=Code이므로 중간값이 실제 코드에 반영되는 부작용이 더 크고, label drag는 슬라이더 위젯 없이 시각적 탐색을 제공하는 고효율 UI 패턴.
- **구체적 동작**:
  - 타이핑: Enter/blur 시에만 커밋. 타이핑 중에는 로컬 state만 변경.
  - 빈 입력 + blur: 이전 커밋 값으로 복원 (0이나 NaN 아님).
  - 라벨 드래그: 실시간 커밋 (onChange). 드래그 시작→끝이 하나의 undo 단위.
  - Arrow Up/Down (포커스 시): 즉시 커밋. Shift+Arrow로 10단위.
  - Undo: 커밋된 값만 undo 히스토리에 기록.
- **영향**: Properties Panel의 모든 숫자 입력에 적용되는 기반 UX 패턴. P0 작업(Full Style Coverage) 전에 확정되어야 함. 슬라이더 위젯은 scope out.

## 2026-03-12: 라벨 드래그 미구현을 P0 완료 판정에서 제외

- **맥락**: QA에서 NumberInput의 라벨 드래그가 미구현임을 발견. P0 완료 판정에 영향이 있는지 논의.
- **선택지**:
  1. 라벨 드래그 구현 완료까지 P0 미완으로 판정
  2. 라벨 드래그를 P0에서 분리하여 별도 P1로 추적
- **결정**: P0 완료 판정에서 제외. 별도 P1 항목으로 추적.
- **근거**: P0 기준은 capability gap. 라벨 드래그 없이도 타이핑 + Arrow 키로 모든 숫자 값을 설정할 수 있으므로 efficiency gap.
- **영향**: P0 완료 기준 변경 없음. backlog에 "NumberInput 라벨 드래그" P1 항목 추가.

## 2026-03-12: P0 완료 판정 기준 확정

- **맥락**: Properties Panel 구현 완료 후 P0 완료 조건을 정의할 필요.
- **결정**: 다음 3가지 모두 충족 시 P0 완료:
  1. 구현 완료 (충족됨)
  2. QA 검증 — 테스트 통과, blocking bug 없음
  3. 코드 생성 반영 — 새 속성들이 생성 코드에 올바르게 반영되는지 확인
- **근거**: "Design = Code" 원칙상, 속성을 설정해도 코드에 반영되지 않으면 제품 가치가 없음. QA 검증 없이 완료 판정하면 사용자가 깨진 기능을 만남.
- **영향**: P1 착수는 P0 QA 완료 후. QA 테스트에서 버그 발견 시 수정 우선.

## 2026-03-12: 스크롤/줌 시 Selection 동기화 전략 -- Hide during interaction

- **맥락**: Shell(selection overlay)과 Canvas iframe(실제 노드) 간 통신 지연으로, 스크롤/줌 시 selection과 노드 위치가 일시적으로 어긋남. 현재 아키텍처가 성능을 위해 이렇게 설계된 것이라 구조적으로 불가피한 딜레이.
- **선택지**:
  1. 아키텍처 리팩터링 — Shell/Canvas 간 동기 통신 구조로 변경하여 딜레이 자체를 제거
  2. 스크롤/줌 중 selection overlay를 숨기고, 완료 후 다시 표시
- **결정**: Option 2. 스크롤/줌 중 selection 숨김.
- **근거**: (1) 아키텍처 리팩터링은 성능 regression 리스크가 높고, 현재 설계는 성능을 위해 의도적으로 분리한 것임. 해결하려는 문제(시각적 딜레이)에 비해 리스크가 과도함. (2) 스크롤/줌은 짧은 순간이라 selection이 잠시 사라져도 사용자가 인지하지 못함. 오히려 어긋나는 게 더 눈에 띔. (3) 즉시 구현 가능하여 P0 QA 중인 현 일정에 영향 없음.
- **주의사항**: selection이 다시 나타나는 시점에 위치가 정확해야 함. 사라지는 건 자연스럽지만 복귀 시 위치가 튀면 오히려 더 부자연스러움.
- **영향**: 별도 백로그 항목 불필요. 버그 수정/UX 폴리시 수준의 작업.

## 2026-03-08: Image 요소 지원 보류

- **맥락**: P1 이슈 생성 중 개발자가 "이미지는 이미지 서버가 있어야 가능해서 지금 구현 못 한다"고 피드백.
- **선택지**:
  1. data URL / blob URL로 서버 없이 구현
  2. 이미지 서버 인프라가 준비될 때까지 보류
- **결정**: 보류. 이미지 서버 인프라 준비 후 재검토.
- **근거**: data URL은 번들 크기 폭발, blob URL은 세션 한정이라 실용적이지 않다. 프로덕션에서 쓸 수 있는 이미지 기능은 서버 인프라가 전제 조건.
- **영향**: Image Element (#7)은 backlog에 proposed로 유지하되 서버 인프라 의존성 명시. 당장 P1 작업 대상에서 제외.
