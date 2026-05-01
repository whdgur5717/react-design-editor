# QA Decisions

<!--
Each decision:
## YYYY-MM-DD: [Decision title]
- **Context**:
- **Options**:
- **Decision**:
- **Rationale**:
- **Impact**:
- **Cross-links**: (PM decisions when product scope or priority is involved)
-->

## 2026-03-10: Introduce QA memory + quality bar

- **Context**: Need PM and QA roles that remember prior decisions and enforce quality gates across sessions.
- **Options**:
  1. Ad-hoc prompting (no durable memory)
  2. File-backed memory under `.claude/agent-memory/qa-engineer/`
- **Decision**: Option 2.
- **Rationale**: Durable, greppable, versioned; matches the existing PM and Designer pattern.
- **Impact**: QA policies live in-repo and can be updated with decisions.
- **Cross-links**: Product scope and priority decisions remain in PM memory.

## 2026-03-12: P0 완료 판정 기준 확정

- **Context**: Properties Panel PR #97 merge 후, P0 완료로 판정하려면 어떤 조건이 필요한지 PM과 협의.
- **Options**:
  1. PR merge만으로 P0 완료
  2. PR merge + QA 테스트 통과 + 코드 생성 반영 확인
- **Decision**: Option 2. QA Tier 1~5 통과 + 코드 생성 확인이 P0 완료 전제 조건.
- **Rationale**: "Design=Code" 원칙상, 속성이 캔버스에만 반영되고 생성 코드에 빠지면 제품 가치가 훼손됨. 구현 완료와 품질 검증은 별개.
- **Impact**: P0 판정은 QA 테스트 결과에 의존. Tier 6(기존 기능 회귀)은 P0 판정과 별개로 진행, 회귀 버그는 별도 이슈.
- **Cross-links**: See PM decision: 2026-03-12: P0 완료 판정 기준 (PM 메시지로 전달)

## 2026-03-12: NumberInput 라벨 드래그 미구현 — P0 영향 없음

- **Context**: PM 결정(Option D Figma-style Hybrid)의 4가지 모드 중 "라벨 드래그: 실시간 커밋"이 미구현 상태.
- **Options**:
  1. 라벨 드래그 미구현을 P0 블로커로 판정
  2. P0에서 제외, P1으로 별도 추적
- **Decision**: Option 2. P0 영향 없음.
- **Rationale**: P0는 "capability gap"(가능/불가능)이지 "efficiency gap"(효율)이 아님. 타이핑 + Arrow 키로 모든 숫자 값 설정 가능하므로 라벨 드래그는 효율성 개선.
- **Impact**: QA 테스트에서 라벨 드래그 시나리오 제외. NumberInput P0 기준은 타이핑/blur 복원/Arrow 키 3가지만 검증.
- **Cross-links**: See PM decision: 2026-03-12 (라벨 드래그 P1 분리)

## 2026-03-12: SliderInput onChange 동작 — 현재 허용

- **Context**: SliderInput(opacity)의 숫자 입력란이 NumberInput과 달리 onChange 즉시 반영. PM에 일관성 문제 제기.
- **Decision**: 현재 허용. opacity만 사용하므로 사용자 혼란 적음.
- **Rationale**: 슬라이더는 본질적으로 "시각적 탐색" → 실시간 반영이 적합. 숫자 입력란이 native `<input type="number">`를 사용하여 별도 커밋 정책이 적용되지 않은 상태.
- **Impact**: E2E 테스트에서 SliderInput 숫자 입력란 동작을 확인하되, 즉시 반영이면 기록만 하고 통과 처리.
