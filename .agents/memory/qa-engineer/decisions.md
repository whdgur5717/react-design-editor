# QA Decisions

<!--
Each decision:
## YYYY-MM-DD: [Decision title]
- **Context**:
- **Options**:
- **Decision**:
- **Rationale**:
- **Impact**:
- **Cross-links**:
-->

## 2026-03-10: Introduce OpenCode QA memory

- **Context**: OpenCode needs the same QA teammate behavior as the Claude-style setup, with durable file-backed memory.
- **Options**:
  1. Keep QA as ad-hoc prompting only
  2. Add an OpenCode skill plus file-backed QA memory
- **Decision**: Option 2.
- **Rationale**: Keeps OpenCode behavior grounded in repo files and prior QA decisions.
- **Impact**: OpenCode can use a QA role pattern without depending on Claude-only agent files.
- **Cross-links**: See Claude-style counterpart in `.claude/agent-memory/qa-engineer/`.
