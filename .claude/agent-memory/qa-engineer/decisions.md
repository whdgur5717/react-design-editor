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
