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
