# Product Decisions

<!--
Each decision:
## YYYY-MM-DD: [Decision title]
- **Context**:
- **Options**:
- **Decision**:
- **Rationale**:
- **Impact**:
-->

## 2026-03-05: Drag-to-Create demoted from P0 to P1

- **Context**: Developer questioned whether drag-to-create is a true Phase 1 blocker.
- **Options**:
  1. Keep P0 because it is a standard design-tool interaction
  2. Demote to P1 because click-to-create plus resize still allows any layout to be built
- **Decision**: Demote to P1.
- **Rationale**: Phase 1 is about capability, not efficiency. Click plus resize is slower, but not a capability gap.
- **Impact**: P0 narrowed and sequencing became clearer.

## 2026-03-05: Per-side spacing + extended style properties merged into one P0

- **Context**: The implementation reality is one larger properties-panel effort, not two separate workstreams.
- **Options**:
  1. Track separately as PM features
  2. Merge into a single implementation unit
- **Decision**: Merge into one P0: Properties Panel: Full Style Coverage.
- **Rationale**: Same surface area, same implementation pass, clearer execution path.
- **Impact**: Phase 1 has one clear P0 blocker.

## 2026-03-09: NumberInput UX strategy -> Figma-style hybrid

- **Context**: Immediate commit-on-change caused bad intermediate values and poor UX.
- **Options**:
  1. Keep onChange
  2. Submit-only
  3. Debounce hybrid
  4. Figma-style hybrid: typing commits on submit, dragging commits live
- **Decision**: Option 4.
- **Rationale**: It supports both precise entry and visual exploration while keeping undo semantics sane.
- **Impact**: Sets the baseline UX pattern for numeric style inputs.

## 2026-03-08: Image support deferred pending infrastructure

- **Context**: Image support needs durable asset handling, not just temporary local workarounds.
- **Options**:
  1. Use data URLs or blob URLs now
  2. Defer until image infrastructure exists
- **Decision**: Defer.
- **Rationale**: Temporary approaches are not viable product-grade solutions.
- **Impact**: Image support remains proposed, not active implementation scope.
