# Draft: Editor Shell Naming Unification (Pattern-Aligned)

## Goal

Unify naming so roles are obvious and consistent with common design-pattern terminology, while keeping existing architecture (Shell/Canvas boundary, Zustand SSOT, Commands for document mutations).

## Current Building Blocks (What they do + what patterns call them)

### `EditorService` (`packages/editor-shell/src/services/EditorService.ts`)

- **Role in this repo**: Creates and owns all subsystems; provides the single runtime/facade instance used by React (`useEditor()`);
  routes inputs (pointer/key/wheel) and coordinates Canvas sync.
- **Pattern names**:
  - _Facade_ (single entry for multiple subsystems)
  - _Composition Root_ (wires dependencies)
  - _Application Service / Orchestrator_ (coordinates workflows)
- **Naming note**: `EditorService` is OK if you accept "service" meaning "runtime facade".
  If you want pattern-purer naming, `EditorRuntime` or `EditorFacade` is clearer.

### Editor Store (`packages/editor-shell/src/store/editor.ts`)

- **Role**: SSOT for document model + editor UI/runtime state + actions (mutations).
- **Pattern names**:
  - _State Store_ (Zustand store)
  - _Reducer-ish action set_ (actions mutate state)
- **Naming note**: file name `editor.ts` is vague; `editorStore.ts` / `editorStateStore.ts` is clearer.

### `Command` / `CommandHistory` (`packages/editor-shell/src/commands/types.ts`, `packages/editor-shell/src/commands/CommandHistory.ts`)

- **Role**:
  - `Command` is classic Command pattern (execute/undo).
  - `CommandHistory` stores executed commands, supports undo/redo, transactions, merge.
- **Pattern names**:
  - `Command` = _Command_
  - `CommandHistory` = _Invoker + History_ (often called `UndoManager`)
- **Rename candidates**:
  - `CommandHistory` -> `UndoManager` (common editor naming) OR keep `CommandHistory` but treat it as the UndoManager.

### `EditorReceiver` / `EditorReceiverImpl` (`packages/editor-shell/src/commands/types.ts`, `packages/editor-shell/src/commands/EditorReceiverImpl.ts`)

- **Role**: The mutation surface that Commands call (thin adapter over store actions; also provides query helpers used by Commands).
- **Pattern names**:
  - _Receiver_ (in Command pattern)
  - also _Gateway/Adapter_ (adapts commands to store)
- **Naming issues**:
  - It mixes document mutations with selection APIs (`getSelection/setSelection`) which are editor UI state, not strictly document.
- **Rename candidates (optional)**:
  - Keep `EditorReceiver` if you want explicit Command-pattern language.
  - If you want domain clarity: `DocumentReceiver` / `EditorModelReceiver`.

### `ShortcutRegistryImpl` (`packages/editor-shell/src/commands/ShortcutRegistry.ts`)

- **Role**: Map `id -> handler` and execute by id.
- **Pattern names**:
  - _Registry_ (identifier to handler)
  - also _Command Dispatcher_ (but careful: "command" conflicts with Command pattern)
- **Rename candidates**:
  - Prefer `ActionRegistry` / `ShortcutRegistry` (drop Impl if only one implementation)
  - If multiple implementations later: `InMemoryShortcutRegistry`

### `KeybindingRegistryImpl` (`packages/editor-shell/src/keybindings/KeybindingRegistry.ts`)

- **Role**: Match keyboard events to a string id (currently named `command`) with optional conditions.
- **Pattern names**:
  - _Keymap_ (data)
  - _Keybinding Matcher/Resolver_ (logic)
- **Naming issues**:
  - It returns a string called `command`, which is easy to confuse with Command-pattern `Command`.
- **Rename candidates**:
  - `KeybindingRegistryImpl` -> `KeybindingMatcher` or `KeybindingResolver`
  - Rename returned id concept: `command` -> `actionId` (or `shortcutId`) across keybinding types.

### `ToolRegistryImpl` (`packages/editor-shell/src/tools/ToolRegistry.ts`)

- **Role**: Holds Tool instances and routes input events to the active tool; also manages activation/deactivation.
- **Pattern names**:
  - _Strategy Context_ (your own comment: line 7)
  - also an _Event Router_ / _Tool Manager_
- **Naming issue**: it does more than a registry; it is a router/controller.
- **Rename candidates**:
  - `ToolRegistryImpl` -> `ToolController` (emphasize event routing + active tool)
  - or `ToolManager` / `ToolRouter`

### `ToolService` / `ToolServiceImpl` (`packages/editor-shell/src/tools/ToolService.ts`, `packages/editor-shell/src/tools/ToolServiceImpl.ts`)

- **Role**: Narrow interface provided to Tools so Tools don’t depend on full EditorService.
- **Pattern names**:
  - _Context_ / _Host_ (for Strategies)
  - _Port_ (dependency inversion)
- **Rename candidates**:
  - `ToolService` -> `ToolContext` (more standard in Strategy pattern)
  - `ToolServiceImpl` -> `DefaultToolContext`

## Root Naming Confusion to Fix

The word `command` currently means 2 different things:

1. `Command` (execute/undo) in Command pattern
2. string ids returned by `KeybindingRegistryImpl.match()` and executed by `ShortcutRegistryImpl.execute()`

Recommendation: rename string ids to `actionId` everywhere in keybinding/shortcut layers.

## Proposed Naming Conventions (Decision-Complete)

### 1) Suffix rules

- Use `Impl` only when there is a public interface + multiple likely implementations.
- Otherwise export a single concrete class without `Impl`.
- For a default concrete implementation, prefer `DefaultX` or `InMemoryX`.

### 2) Pattern-aligned nouns

- `Registry`: stores mappings (id -> handler / id -> object). Does not route events.
- `Controller`: translates external events into domain actions (pointer, keyboard, tool routing).
- `Bridge`/`Adapter`: crosses boundaries (Canvas RPC boundary, store adapter).
- `Receiver`: reserved for Command-pattern receiver (mutation target for Commands).
- `UndoManager`: a clearer name than `CommandHistory` (optional change).

### 3) Repo-wide term for string identifiers

- Use `actionId` for keybinding/shortcut ids.
- Reserve `Command` for execute/undo objects only.

## Concrete Rename Map (low-risk, incremental)

- `ShortcutRegistryImpl` -> `ActionRegistry` (or `ShortcutRegistry`)
- `KeybindingRegistryImpl` -> `KeybindingMatcher` (or `KeymapResolver`)
- In keybinding types: rename field `command` -> `actionId`
- `ToolRegistryImpl` -> `ToolController` (or `ToolRouter`)
- `ToolService` -> `ToolContext`
- `ToolServiceImpl` -> `DefaultToolContext`
- Optional: `CommandHistory` -> `UndoManager`
- Optional: `EditorService` -> `EditorRuntime` (if you want to avoid the overloaded word "Service")

## Notes on What NOT to Rename

- Keep `EditorReceiver` if you like explicit Command-pattern vocabulary; it’s accurate.
- Keep `Command` as-is (it matches the pattern perfectly).

## Open Questions (preference-driven)

- Do you prefer domain language (`ActionRegistry`, `UndoManager`, `EditorRuntime`) or pattern language (`ShortcutRegistry`, `CommandHistory`, `EditorService`)?
- Are you okay renaming the string id `command` -> `actionId` (touches more files but removes the biggest ambiguity)?
