# Draft: EditorService / Store Architecture Improvements

## Requirements (assumed from discussion)

- Keep `EditorService` as the single main entry / facade for React (`useEditor()` stays the access point).
- Preserve architecture invariants:
  - Shell/Canvas iframe separation; Canvas is a pure renderer.
  - Shell Zustand store is single source of truth.
  - Document mutations from user actions should go through Commands.
- Prefer incremental changes with minimal API breakage.

## Observed Pain Points (repo-grounded)

- Overexposed internals: `EditorService` publicly exposes `store`, `receiver`, `commandHistory`, registries, etc. (`packages/editor-shell/src/services/EditorService.ts`).
- Direct store mutation exists from UI call sites (e.g. code components + layers), which makes Commands-only hard to enforce consistently.
- Canvas sync responsibilities are split between `packages/editor-shell/src/App.tsx` (subscription + rect cache writes) and `packages/editor-shell/src/services/EditorService.ts` (payload assembly + sync).

## Improvement Options

### Option 1 (Recommended): Narrow Facade Type + Ports (keep one entry, reduce coupling)

Goal: Keep `EditorService` as the instance, but ensure _callers only see a restricted interface_.

Decisions:

- Change the React context type from `EditorService` to an `EditorFacade` interface that does NOT expose `store` / `receiver` / `commandHistory` directly.
- Expose only explicit methods needed by UI:
  - input entrypoints: `sendPointerDown/move/up`, `sendKeyDown`, `handleWheel`
  - command entrypoint: `executeCommand`, `beginTransaction`, `commitTransaction`
  - history UX: `undo/redo`, `subscribeHistory`, `getHistorySnapshot` (or a small `HistoryFacade`)
  - read-only accessors: `getReceiver()` (or narrower read API), `getSelection/getZoom/getPan`, etc.
- Keep `useEditorStore()` as the only way to read state.

Why this helps:

- Prevents casual `editor.store.getState()` usage at compile time.
- Makes it structurally clearer what is UI runtime state vs document mutation paths.
- Minimal refactor: mostly typing + routing calls through facade methods.

### Option 2: Internal Subsystems Behind the Facade (CanvasBridge / CommandBus / InputController)

Goal: `EditorService` stays composition root, but heavy logic moves to collaborators.

Internal collaborators (names are suggestions):

- `CanvasBridge`: owns canvas ref, RPC methods, and sync payload assembly; can absorb App.tsx subscription.
- `CommandBus`: the only place that calls CommandHistory; shortcuts/tools depend on this.
- `InputController`: owns the XState actor lifecycle; `EditorService` delegates pointer/key methods.
- `ViewportController`: owns pan/zoom math and updates UI state.

Why this helps:

- Reduces size/complexity of `EditorService.ts` without removing the main entry concept.
- Shortcuts/tools/pointer machine depend on narrow ports instead of whole `EditorService`.

### Option 3: Store Domain Split (doc vs UI) + Enforce Commands-only at the API boundary

Goal: Reduce `store/editor.ts` from being the entire editor domain.

Decisions:

- Keep UI runtime state mutations (selection/hover/zoom/pan/rect-cache) as direct store actions.
- Move document mutations behind the receiver/commands boundary:
  - expose document mutation only through `EditorReceiver` used by commands
  - UI call sites must invoke Commands, not store actions, for document changes

Why this helps:

- Aligns with Commands-only invariant; improves undo/redo correctness.
- Makes it harder to accidentally bypass command history.

### Option 4: Enforcement Layer (lint/tests) with minimal architecture changes

Goal: Keep current structure but prevent regressions.

Examples:

- Lint rule / code review rule: ban `editor.store.getState()` outside approved modules.
- Unit test: assert that specific UI interactions use commands for doc mutations.

## Suggested Sequencing (incremental)

1. Option 1 first (narrow facade type) to stop new direct usages.
2. Decide between Option 2 vs Option 3 based on your primary pain:
   - If change blast radius / readability: Option 2.
   - If undo/redo correctness / invariants: Option 3.
3. Add Option 4 regardless (cheap guardrails).

## Open Questions

- Primary driver: correctness (Commands-only), maintainability (blast radius), or testability?
- Tolerance for API change: can we change `useEditor()` return type to `EditorFacade`?
- Do you want to migrate existing direct doc mutations now, or only prevent new ones?
