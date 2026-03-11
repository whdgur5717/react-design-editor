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

## 2026-03-10: Example - Properties Panel: Full Style Coverage (Issue #94)

- **Context**: Add missing style properties so the Phase 1 gate is met.
- **Scope (IN)**: New style inputs in the properties panel as defined by the PM issue.
- **Scope (OUT)**: Gradients, full redesign, sliders unless explicitly required.
- **Risks**: Number input commit strategy, undo grouping, missing `data-testid` selectors.
- **Acceptance Criteria (binary)**:
  - Style edits persist and reflect on canvas.
  - Undo and redo restore committed values.
- **Verification Commands**:
  - `pnpm test:unit`
  - `pnpm test:e2e`
- **E2E Scenarios**:
  - Edit width and height inputs; verify the canvas node style changes.
  - Type a partial number then blur; verify commit strategy matches the PM decision.
- **Cross-links**:
  - See PM decision: 2026-03-09: NumberInput UX 전략 -- Figma-style Hybrid (Option D)
