# EDITOR SHELL KNOWLEDGE BASE

**Generated:** 2026-03-30 Asia/Seoul
**Commit:** `a4e0b8f`
**Branch:** `99-scroll-jitter-ux-mitigation`

## OVERVIEW

`editor-shell` is the real editor application: it captures events, owns state, executes commands, drives tool behavior, and synchronizes the document to Canvas.

## STRUCTURE

```text
editor-shell/
|- src/components/   # panels, overlays, code editor, toolbar
|- src/commands/     # undoable mutations and command history
|- src/hooks/        # view and draft helpers
|- src/interaction/  # pointer state machine
|- src/keybindings/  # keyboard mapping registry and defaults
|- src/services/     # Editor facade, ClipboardRuntime, compiler, context
|- src/store/        # Zustand store and tree mutation helpers
`- src/tools/        # active tool implementations and contracts
```

## WHERE TO LOOK

| Task                          | Location                         | Notes                              |
| ----------------------------- | -------------------------------- | ---------------------------------- |
| State and long-lived services | `src/services/`, `src/store/`    | Source of truth lives here         |
| Interaction flow              | `src/interaction/`, `src/tools/` | Input handling and tool behavior   |
| UI chrome                     | `src/components/`                | Panels, overlays, toolbar          |
| State-changing behavior       | `src/commands/`                  | Mutation layer                     |
| Boundary and naming rules     | `ARCHITECTURE-GUIDE.md`          | Editor/usecase/runtime conventions |

## CONVENTIONS

- UI-originated document changes should become commands unless the existing architecture already models them as store-only view state
- Preserve the split between state, mutation, interaction, and UI layers

## ANTI-PATTERNS

- Do not add ad hoc mutation logic inside panels when a command belongs in `src/commands/`
- Do not mix state ownership into render-only UI

## NOTES

- Keep this file architectural; implementation details belong in code or tests
- Edit permission gate: do not modify files in `editor-shell` unless the user explicitly asks for that edit in the current conversation; analysis-only requests stay read-only
