# PACKAGES KNOWLEDGE BASE

**Generated:** 2026-03-30 Asia/Seoul
**Commit:** `a4e0b8f`
**Branch:** `99-scroll-jitter-ux-mitigation`

## OVERVIEW

`packages/` contains the editor runtime. The important boundary is not package independence; it is the Shell/Canvas contract enforced across the whole editor.

Primary invariants live in `packages/CLAUDE.md`.

## STRUCTURE

```text
packages/
|- editor-core/        # shared types, protocol, schema, codegen
|- editor-components/  # component registry and primitives
|- editor-canvas/      # iframe renderer only
|- editor-shell/       # state, commands, tools, overlays, panels
|- CLAUDE.md           # package-wide architecture invariants
`- spec.md             # detailed architecture reference
```

## WHERE TO LOOK

| Task                      | Location                             | Notes                       |
| ------------------------- | ------------------------------------ | --------------------------- |
| Shared types and protocol | `editor-core/`                       | Shared by Shell and Canvas  |
| Rendering runtime         | `editor-canvas/`                     | Render only                 |
| Editor runtime            | `editor-shell/`                      | State and interaction owner |
| Shared component registry | `editor-components/`                 | Used across runtimes        |
| Package invariants        | `CLAUDE.md`                          | Architectural rules         |
| Detailed architecture     | `spec.md`                            | Deeper reference            |
| Shell boundary guide      | `editor-shell/ARCHITECTURE-GUIDE.md` | Runtime boundary rules      |
