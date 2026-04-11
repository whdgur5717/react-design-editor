# Editor Shell Architecture Guide

This document is a practical guide for contributors working in `packages/editor-shell`.
Its goal is to keep the codebase maintainable by enforcing clear boundaries and naming rules.

## The Core Principle

**UI must not reach into editor internals.**

In concrete terms:

- React components and hooks must not access:
  - `editor.store`
  - `editor.receiver`
  - `editor.commandHistory`
  - `editor.getReceiver()`
- UI should call **Editor public methods** and/or a **Usecase/Runtime**.

Rationale:

- Reduces coupling and prevents "logic leakage" into UI.
- Keeps undo/redo (CommandHistory) and mutations (Commands) consistent.
- Avoids helper/utility duplication across layers.

This rule is enforced by ESLint in `packages/editor-shell/eslint.config.js`.

## Mental Model (Layers)

Think in layers. Each layer has one job.

1. **Editor (Facade / Entry Point)**

- File: `packages/editor-shell/src/services/Editor.ts`
- Owns the subsystems and wires actions.
- Provides the stable API used by UI.
- OK to contain forwarding methods (e.g. input event forwarding).
- NOT OK to accumulate feature policies directly in `Editor.ts`.

2. **Usecase (Application Service)**

- Folder: `packages/editor-shell/src/usecases/`
- Rule: **Usecase is stateless** (no long-lived internal state).
- Contains feature policies and orchestration.
- Naming: `*Usecase` with a single entry method `run()`.

3. **Runtime (Stateful Coordinator)**

- Folder: `packages/editor-shell/src/services/` (or `src/runtimes/` if created later)
- Rule: **Runtime is stateful**.
- Example: `ClipboardRuntime` stores clipboard payload and paste count.
- Naming: `*Runtime` with domain verbs (e.g. `copy/cut/paste`).

4. **Command (Undoable Mutation Unit)**

- Folder: `packages/editor-shell/src/commands/`
- Rule: One command = one undoable unit.
- Must implement `execute()` and `undo()`.
- Must call the Receiver, not mutate store directly.

5. **CommandHistory (Invoker / Undo-Redo Engine)**

- File: `packages/editor-shell/src/commands/CommandHistory.ts`
- Executes commands and maintains undo/redo stacks.
- UI reads snapshot via `Editor` wrappers, not by accessing `commandHistory` directly.

6. **Receiver (Mutation Port)**

- Files:
  - Interface: `packages/editor-shell/src/commands/types.ts`
  - Impl: `packages/editor-shell/src/commands/EditorReceiverImpl.ts`
- Commands talk to the Receiver.
- Receiver talks to the store.

7. **Store (Source of Truth)**

- File: `packages/editor-shell/src/store/editor.ts`
- Holds document state + view state.
- Provides low-level mutation primitives.
- Must not embed feature policies; those live in Usecases/Runtimes.

## Naming Rules (Design-Pattern Based)

- `Editor`: facade/entry point. Don’t suffix it.
- `*Usecase`: stateless feature policy + orchestration.
- `*Runtime`: stateful feature coordinator.
- `*Command`: undoable mutation unit.
- `*Registry`: mapping (id -> handler/definition).
- `*Bridge`: boundary integration (e.g. iframe RPC).

Function prefix rules:

- `find*`: lookup, returns null if missing.
- `resolve*`: policy decision (choose a target).
- `build*`: assemble a payload/DTO.
- `apply*`: pure transformation.
- `run/execute`: side-effecting action.

Avoid:

- `Util`, `Helper`, `Manager` (they hide responsibility).

## Where To Put New Code

Decision table:

| You are adding...                         | Put it in...                                | Notes                                         |
| ----------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| A new keyboard/pointer action mapping     | `Editor.ts` (wiring) + Usecase/Runtime      | `Editor.ts` should only register and delegate |
| A policy/decision (e.g. “top-level only”) | `src/usecases/*` or `src/services/*Runtime` | Usecase if stateless, Runtime if needs memory |
| An undoable document change               | `src/commands/*Command.ts`                  | Command must use Receiver                     |
| A new document tree traversal algorithm   | `src/document/*` (create if absent)         | Keep traversal centralized                    |
| A UI interaction that needs a mutation    | Call Editor public method                   | Don’t call store/receiver directly            |

## Practical Examples

### Example: Delete Selection

Correct structure:

- UI triggers action `node:delete`
- `Editor.ts` routes it to `DeleteSelectionUsecase.run()`
- Usecase decides top-level nodes + transaction boundaries
- Usecase executes `RemoveNodeCommand` via `CommandHistory`
- Command calls `receiver.removeNode(...)`

### Example: Clipboard

Correct structure:

- UI triggers `clipboard:copy/cut/paste`
- `Editor.ts` routes to `ClipboardRuntime.copy/cut/paste`
- Runtime keeps clipboard payload in memory
- Mutation operations use `CutNodesCommand` / `PasteNodesCommand`

## Verification Expectations

When you change architecture-critical paths (Editor, commands, store, usecases):

- `pnpm type-check`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:e2e`
