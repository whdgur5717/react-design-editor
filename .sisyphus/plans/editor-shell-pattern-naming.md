# Editor Shell Pattern-Aligned Naming Cleanup

## TL;DR

> **Summary**: Standardize editor-shell naming so class/interface names match actual roles, remove misleading `Impl` suffixes where they do not represent meaningful implementation variants, and eliminate the string-`command` vs Command-pattern `Command` ambiguity.
> **Deliverables**:
>
> - Exact rename map for `keybindings`, `tools`, `commands`, and wiring in `EditorService`
> - Characterization tests that protect behavior during symbol/file renames
> - Verification gates proving no stale old names remain in `packages/editor-shell/src`
>   **Effort**: Medium
>   **Parallel**: YES - 2 waves
>   **Critical Path**: T1 taxonomy + baseline -> T2 actionId rename -> T3/T4/T5 symbol renames -> T6 verification

## Context

### Original Request

Unify inconsistent naming in `packages/editor-shell/src` around objects like `Registry`, `Receiver`, `Service`, and `Impl`, using pattern-accurate terminology while preserving the current architecture.

### Interview Summary

- `EditorService` should remain the main entry / facade.
- `EditorReceiver` is accepted as accurate terminology.
- `CommandHistoryManager` is not preferred; `CommandHistory` is acceptable and should remain.
- `ToolServiceImpl` exists for DI / anti-direct-dependency reasons; the plan must preserve that role instead of flattening it away.
- The key ambiguity to fix is that keybinding/shortcut string ids use the word `command`, which conflicts with Command-pattern `Command` objects.

### Metis Review (gaps addressed)

- Guardrail: do not rename `Command`, `MergableCommand`, `CommandHistory`, or runtime string values like `history:undo`.
- Guardrail: `ToolRegistryImpl` behaves more like a manager/dispatcher than a pure registry; use a role-accurate noun.
- Guardrail: keep scope focused on naming/boundary cleanup, not deeper architectural rewrites.
- Guardrail: add characterization tests before renames so behavioral regressions are caught independently of naming churn.

## Work Objectives

### Core Objective

Make naming in `packages/editor-shell/src` internally consistent and pattern-aligned without changing behavior or violating the editor architecture.

### Deliverables

- A finalized naming taxonomy applied to the current editor-shell symbols.
- Symbol/file renames for the targeted classes/interfaces and their imports/exports.
- String-id rename from `command` to `actionId` in keybinding/shortcut flow.
- Automated tests and grep gates proving the rename is complete.

### Definition of Done (verifiable conditions with commands)

- All targeted symbols are renamed consistently across source, tests, and barrel exports.
- No stale occurrences of the retired names remain in `packages/editor-shell/src`.
- Type-check, unit tests, and build succeed.
- Behavior of keybinding match and shortcut execution is unchanged.

### Must Have

- Preserve `EditorService` as the main entry.
- Preserve `EditorReceiver` and `CommandHistory` names.
- Preserve DI boundary for tool-facing dependencies.
- Use role-accurate names for matcher/manager/registry/receiver.

### Must NOT Have

- No broad runtime refactors beyond naming-oriented boundary cleanup.
- No changes to shell/canvas separation or state ownership.
- No mutation-path changes hidden inside the rename.
- No blanket `Impl` removal without considering whether the interface/implementation split is meaningful.

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after with Vitest + type-check + build
- QA policy: Every task includes executable checks; no manual UI-only validation required
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: taxonomy + characterization + high-signal symbol renames

- T1 naming taxonomy and baseline grep gates
- T2 keybinding `command` -> `actionId` pipeline rename
- T3 `ShortcutRegistryImpl` -> `ShortcutRegistry`
- T4 `KeybindingRegistryImpl` -> `KeybindingMatcher`

Wave 2: tool-layer rename set + deferred receiver decision capture + full verification

- T5 `ToolRegistryImpl` -> `ToolManager`
- T6 `ToolServiceImpl` -> `EditorToolService`
- T7 explicitly defer `EditorReceiverImpl` rename in this pass
- T8 full verification + stale-name grep gates

### Dependency Matrix (full, all tasks)

- T1 blocks T2-T8
- T2 blocks T4 and T8
- T3 blocks T8
- T4 blocks T8
- T5 blocks T8
- T6 blocks T8
- T7 blocked by T1; does not block T2-T6
- T8 blocked by T2-T7

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 -> 4 tasks -> writing / quick / unspecified-low
- Wave 2 -> 4 tasks -> quick / unspecified-low / deep (verification)

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Lock The Naming Taxonomy And Baseline Search Gates

  **What to do**: Add a short developer-facing taxonomy note to the implementation branch context or PR notes before renaming begins. The taxonomy for this plan is fixed: keep `EditorService`, `EditorReceiver`, `CommandHistory`, `ShortcutRegistry`; rename `KeybindingRegistryImpl` to `KeybindingMatcher`, `ToolRegistryImpl` to `ToolManager`, `ToolServiceImpl` to `EditorToolService`; keep `ToolService` interface; rename keybinding string field `command` to `actionId`. Run baseline search commands to capture current occurrences of all old names before any edit.
  **Must NOT do**: Do not rename symbols ad hoc during exploration. Do not introduce new pattern terms outside this taxonomy. Do not rename runtime action string values like `history:undo`.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: This task fixes vocabulary and prevents drift before code edits.
  - Skills: `[]` — No extra skill required.
  - Omitted: `git-master` — No git operation needed for this task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T2, T3, T4, T5, T6, T7, T8 | Blocked By: none

  **References**:
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:32` — Main facade entry that should remain named `EditorService`.
  - Pattern: `packages/editor-shell/src/commands/types.ts:43` — `EditorReceiver` is valid Receiver-pattern vocabulary.
  - Pattern: `packages/editor-shell/src/commands/CommandHistory.ts:12` — Keep `CommandHistory` stable.
  - Pattern: `packages/editor-shell/src/tools/ToolRegistry.ts:7` — Current comment already says Strategy Context; rename must respect actual behavior.
  - Pattern: `packages/editor-shell/src/keybindings/KeybindingRegistry.ts:27` — `match()` behavior drives the matcher rename.

  **Acceptance Criteria**:
  - [ ] A checked-in or PR-visible taxonomy note exists for implementers with the exact keep/rename list from this plan.
  - [ ] Baseline searches are recorded for `ToolRegistryImpl`, `ToolServiceImpl`, `KeybindingRegistryImpl`, `ShortcutRegistryImpl`, and keybinding field `command`.
  - [ ] No source file is renamed before the taxonomy is fixed.

  **QA Scenarios**:

  ```text
  Scenario: Baseline old-name inventory
    Tool: Bash
    Steps: Run grep searches for `ToolRegistryImpl|ToolServiceImpl|KeybindingRegistryImpl|ShortcutRegistryImpl|\bcommand\b` under `packages/editor-shell/src`.
    Expected: Concrete baseline counts are captured for later comparison.
    Evidence: .sisyphus/evidence/task-1-taxonomy-baseline.txt

  Scenario: Taxonomy consistency check
    Tool: Bash
    Steps: Search for conflicting proposed names (for example `ToolController`, `UndoManager`, `EditorFacade`) inside the work branch notes and changed files.
    Expected: Only the approved naming taxonomy remains in scope.
    Evidence: .sisyphus/evidence/task-1-taxonomy-consistency.txt
  ```

  **Commit**: YES | Message: `refactor(shell): define naming taxonomy for editor-shell` | Files: `.sisyphus/*` or implementation note only

- [ ] 2. Rename Keybinding String Field From `command` To `actionId`

  **What to do**: Rename the keybinding data field `command` to `actionId` across `packages/editor-shell/src/keybindings/types.ts`, `packages/editor-shell/src/keybindings/defaults.ts`, `packages/editor-shell/src/keybindings/KeybindingRegistry.ts`, and every consumer. Keep runtime values unchanged (`history:undo`, `tool:select`, etc.). Update local variable names that still imply Command-pattern objects where they refer only to string ids.
  **Must NOT do**: Do not rename the `Command` interface or any execute/undo class. Do not change string values used by shortcuts. Do not change matching behavior.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: This is a bounded rename set with strong type-check feedback.
  - Skills: `[]` — LSP rename and grep are sufficient.
  - Omitted: `git-master` — No git operation required inside the task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4, T8 | Blocked By: T1

  **References**:
  - API/Type: `packages/editor-shell/src/keybindings/types.ts:4` — `Keybinding` currently owns the conflicting string field.
  - Pattern: `packages/editor-shell/src/keybindings/defaults.ts` — Default bindings must adopt the new field name without changing values.
  - Pattern: `packages/editor-shell/src/keybindings/KeybindingRegistry.ts:27` — `match()` should return `actionId`, not `command`.
  - Pattern: `packages/editor-shell/src/interaction/pointerMachine.ts:221` — The result of keybinding matching flows into shortcut execution.
  - Test: `packages/editor-shell/src/keybindings/KeybindingRegistry.test.ts` — Add or update coverage for match semantics.

  **Acceptance Criteria**:
  - [ ] `Keybinding` type uses `actionId` instead of `command`.
  - [ ] Default keybindings compile and still resolve to the same runtime action ids.
  - [ ] `KeybindingRegistry` logic still returns the same string ids for the same key events.
  - [ ] No `command:` property remains in `packages/editor-shell/src/keybindings` except comments describing the old term.

  **QA Scenarios**:

  ```text
  Scenario: Matching returns existing runtime action id
    Tool: Bash
    Steps: Run the relevant Vitest file for keybinding matching after the rename.
    Expected: Meta/Ctrl+Z still resolves to `history:undo`; selection-gated bindings still return null when no selection exists.
    Evidence: .sisyphus/evidence/task-2-keybinding-match.txt

  Scenario: Old field name is fully removed
    Tool: Bash
    Steps: Grep `packages/editor-shell/src/keybindings` for `\bcommand\b` after the rename.
    Expected: No stale keybinding field usages remain.
    Evidence: .sisyphus/evidence/task-2-keybinding-grep.txt
  ```

  **Commit**: YES | Message: `refactor(shell): rename keybinding command ids to actionId` | Files: `packages/editor-shell/src/keybindings/*`, `packages/editor-shell/src/interaction/*`

- [ ] 3. Drop The Unnecessary `Impl` Suffix From Shortcut Registry

  **What to do**: Rename `ShortcutRegistryImpl` to `ShortcutRegistry` because there is no companion interface and the class is already the concrete registry used by the system. Update all imports/exports and any constructor wiring in `EditorService`.
  **Must NOT do**: Do not change behavior, registration semantics, missing-handler warnings, or runtime shortcut ids.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single-symbol rename with predictable fallout.
  - Skills: `[]` — LSP rename + grep are enough.
  - Omitted: `git-master` — No git action needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T8 | Blocked By: T1

  **References**:
  - Pattern: `packages/editor-shell/src/commands/ShortcutRegistry.ts:3` — Concrete class currently has unnecessary `Impl` suffix.
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:14` — Constructor wiring imports and stores the registry.
  - Pattern: `packages/editor-shell/src/commands/historyShortcuts.ts:3` — Registration call sites should update cleanly.
  - Test: `packages/editor-shell/src/commands/ShortcutRegistry.ts` — Behavior is simple enough for focused registry tests if absent.

  **Acceptance Criteria**:
  - [ ] The concrete class name is `ShortcutRegistry`.
  - [ ] All imports compile with the new name.
  - [ ] `execute(id)` still returns `true` for registered ids and `false` for missing ids.

  **QA Scenarios**:

  ```text
  Scenario: Registered shortcut still executes
    Tool: Bash
    Steps: Run the unit test that registers a handler and executes it by id.
    Expected: Execution returns true and the handler side effect occurs exactly once.
    Evidence: .sisyphus/evidence/task-3-shortcut-registry.txt

  Scenario: Missing shortcut still warns and returns false
    Tool: Bash
    Steps: Run the unit test that executes an unregistered shortcut id.
    Expected: Execution returns false and warning behavior matches pre-rename semantics.
    Evidence: .sisyphus/evidence/task-3-shortcut-missing.txt
  ```

  **Commit**: YES | Message: `refactor(shell): drop impl suffix from shortcut registry` | Files: `packages/editor-shell/src/commands/ShortcutRegistry.ts`, related imports/exports

- [ ] 4. Rename `KeybindingRegistryImpl` To `KeybindingMatcher`

  **What to do**: Rename the concrete class and file from `KeybindingRegistryImpl` / `KeybindingRegistry.ts` to `KeybindingMatcher` / `KeybindingMatcher.ts`. Update imports/exports and `EditorService` wiring. Keep its behavior as state-aware matching from key events to action ids.
  **Must NOT do**: Do not turn it into a registry abstraction unless needed by the rename. Do not broaden its responsibilities.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Name change is local but touches constructor wiring and exports.
  - Skills: `[]` — LSP rename plus file rename is sufficient.
  - Omitted: `git-master` — No git action needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T8 | Blocked By: T1, T2

  **References**:
  - Pattern: `packages/editor-shell/src/keybindings/KeybindingRegistry.ts:27` — Core responsibility is `match()`, not generic registration.
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:17` — Constructor wiring imports the class today.
  - Pattern: `packages/editor-shell/src/interaction/pointerMachine.ts:222` — Consumer expects a match result and then dispatches execution.
  - Test: `packages/editor-shell/src/keybindings/KeybindingRegistry.test.ts` — Update/rename the test file to match the new concept if needed.

  **Acceptance Criteria**:
  - [ ] Concrete class/file/export names use `KeybindingMatcher`.
  - [ ] Matching behavior is unchanged apart from using `actionId` terminology.
  - [ ] No stale `KeybindingRegistryImpl` symbol remains anywhere in the repo.

  **QA Scenarios**:

  ```text
  Scenario: Keybinding matcher still honors conditional binding
    Tool: Bash
    Steps: Run the keybinding unit tests after the rename.
    Expected: `hasSelection` conditions still gate matches correctly.
    Evidence: .sisyphus/evidence/task-4-keybinding-matcher.txt

  Scenario: Old symbol is fully removed
    Tool: Bash
    Steps: Grep the repo for `KeybindingRegistryImpl`.
    Expected: Zero matches.
    Evidence: .sisyphus/evidence/task-4-keybinding-old-name.txt
  ```

  **Commit**: YES | Message: `refactor(shell): rename keybinding registry to matcher` | Files: `packages/editor-shell/src/keybindings/*`, `packages/editor-shell/src/services/*`, consumers

- [ ] 5. Rename `ToolRegistryImpl` To `ToolManager`

  **What to do**: Rename `ToolRegistryImpl` to `ToolManager` because the class does more than registration: it stores tools, tracks the active tool through `ToolService`, delegates input events, and manages activation/deactivation. Update file name, imports/exports, constructor wiring, and shortcut/tool consumer code.
  **Must NOT do**: Do not rename active tool ids or change tool lifecycle semantics. Do not convert it into a passive data-only registry.

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: Moderate rename surface with multiple consumers.
  - Skills: `[]` — LSP rename + grep are sufficient.
  - Omitted: `git-master` — No git action needed.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T1

  **References**:
  - Pattern: `packages/editor-shell/src/tools/ToolRegistry.ts:7` — Existing comment already frames the class as Strategy context.
  - Pattern: `packages/editor-shell/src/tools/ToolRegistry.ts:46` — Active tool switching and lifecycle handling justify `Manager`.
  - Pattern: `packages/editor-shell/src/tools/ToolRegistry.ts:65` — Event delegation is central behavior.
  - Pattern: `packages/editor-shell/src/commands/toolShortcuts.ts:5` — Tool-selection shortcuts depend on this API.
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:36` — Stored as a subsystem on the editor runtime.

  **Acceptance Criteria**:
  - [ ] Concrete class/file/export names use `ToolManager`.
  - [ ] Tool activation/deactivation behavior is unchanged.
  - [ ] Event delegation methods (`handleClick`, `handleDragEnd`, `handleKeyDown`) continue to dispatch to the active tool.
  - [ ] No stale `ToolRegistryImpl` symbol remains anywhere in the repo.

  **QA Scenarios**:

  ```text
  Scenario: Tool switching still routes to the active strategy
    Tool: Bash
    Steps: Run the relevant tool-layer unit tests or add a focused test that registers two tools, activates one, and triggers an event.
    Expected: Only the active tool receives the event and activation/deactivation hooks preserve prior behavior.
    Evidence: .sisyphus/evidence/task-5-tool-manager.txt

  Scenario: Old symbol is fully removed
    Tool: Bash
    Steps: Grep the repo for `ToolRegistryImpl`.
    Expected: Zero matches.
    Evidence: .sisyphus/evidence/task-5-tool-manager-old-name.txt
  ```

  **Commit**: YES | Message: `refactor(shell): rename tool registry to tool manager` | Files: `packages/editor-shell/src/tools/*`, `packages/editor-shell/src/services/*`, `packages/editor-shell/src/commands/toolShortcuts.ts`

- [ ] 6. Rename `ToolServiceImpl` To `EditorToolService` While Keeping `ToolService`

  **What to do**: Keep the `ToolService` interface as the tool-facing contract, but rename the concrete `ToolServiceImpl` class to `EditorToolService` to make its role explicit: it is the editor-backed implementation of the tool-facing API. Update wiring in `EditorService` and imports/exports across the tool layer.
  **Must NOT do**: Do not rename the `ToolService` interface unless a second pass is explicitly scoped. Do not collapse the interface and implementation into one class.

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: Low-risk rename with DI significance.
  - Skills: `[]` — LSP rename is sufficient.
  - Omitted: `git-master` — No git action needed.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T1

  **References**:
  - API/Type: `packages/editor-shell/src/tools/ToolService.ts:8` — Keep this interface stable as the tool-facing contract.
  - Pattern: `packages/editor-shell/src/tools/ToolServiceImpl.ts:7` — Current implementation is explicitly an `EditorService` wrapper.
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:23` — Constructor wiring instantiates the implementation.
  - Pattern: `packages/editor-shell/src/tools/ToolRegistry.ts:12` — The manager stores a `ToolService`-typed dependency.

  **Acceptance Criteria**:
  - [ ] `ToolService` interface remains the tool-facing abstraction.
  - [ ] Concrete implementation name becomes `EditorToolService`.
  - [ ] All tools continue to depend on the interface, not directly on `EditorService`.
  - [ ] No stale `ToolServiceImpl` symbol remains anywhere in the repo.

  **QA Scenarios**:

  ```text
  Scenario: Tool DI boundary remains intact
    Tool: Bash
    Steps: Run type-check after the rename and inspect that tools still import `ToolService` rather than `EditorService`.
    Expected: Compilation succeeds and no tool directly requires `EditorService` because of this rename.
    Evidence: .sisyphus/evidence/task-6-tool-service-typecheck.txt

  Scenario: Old symbol is fully removed
    Tool: Bash
    Steps: Grep the repo for `ToolServiceImpl`.
    Expected: Zero matches.
    Evidence: .sisyphus/evidence/task-6-tool-service-old-name.txt
  ```

  **Commit**: YES | Message: `refactor(shell): rename tool service impl to editor tool service` | Files: `packages/editor-shell/src/tools/*`, `packages/editor-shell/src/services/*`

- [ ] 7. Record The Deferred Decision For `EditorReceiverImpl`

  **What to do**: Keep `EditorReceiver` and `EditorReceiverImpl` unchanged in this pass. Add an explicit note in implementation context and PR summary that the receiver naming pair is deferred intentionally because the current name is pattern-correct enough and renaming it would widen churn without resolving the project’s primary ambiguity. Preserve all receiver behavior and keep verification aware that this symbol is intentionally retained.
  **Must NOT do**: Do not rename the `EditorReceiver` interface. Do not rename `EditorReceiverImpl` in this pass. Do not expand scope into receiver API redesign.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: This task resolves ambiguity by recording an intentional non-change.
  - Skills: `[]` — LSP rename is enough.
  - Omitted: `git-master` — No git action needed.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T1

  **References**:
  - API/Type: `packages/editor-shell/src/commands/types.ts:43` — `EditorReceiver` stays the stable interface.
  - Pattern: `packages/editor-shell/src/commands/EditorReceiverImpl.ts:8` — Current class is explicitly a store wrapper for command execution.
  - Pattern: `packages/editor-shell/src/services/EditorService.ts:46` — Constructor wiring uses the concrete implementation.

  **Acceptance Criteria**:
  - [ ] `EditorReceiver` interface name remains unchanged.
  - [ ] `EditorReceiverImpl` concrete class name remains unchanged in this pass.
  - [ ] Implementation notes state that this is an intentional defer, not an accidental omission.
  - [ ] All command behavior remains unchanged.

  **QA Scenarios**:

  ```text
  Scenario: Deferred decision is explicit
    Tool: Bash
    Steps: Search implementation notes / PR notes / task log for `EditorReceiverImpl` and the word `deferred`.
    Expected: The non-rename is documented explicitly.
    Evidence: .sisyphus/evidence/task-7-receiver-defer.txt

  Scenario: Receiver-backed commands still execute and undo
    Tool: Bash
    Steps: Run command unit tests, especially clipboard/history tests that instantiate `EditorService` and use the receiver indirectly.
    Expected: Command execution and undo/redo remain unchanged.
    Evidence: .sisyphus/evidence/task-7-receiver-tests.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: note only

- [ ] 8. Run Full Verification And Enforce No-Old-Names Gates

  **What to do**: Run workspace type-check, relevant unit tests, and the editor-shell build. Then run grep gates for all retired names and confirm the final naming set is present. Verify that the retained `EditorReceiverImpl` name is intentionally documented as deferred.
  **Must NOT do**: Do not merge additional refactors into this verification step. Do not ignore failed grep gates because “behavior still works.”

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: This is the correctness gate that validates both behavior and rename completeness.
  - Skills: `[]` — Standard verification commands and grep are enough.
  - Omitted: `git-master` — Verification only.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Final Verification Wave | Blocked By: T2, T3, T4, T5, T6, T7

  **References**:
  - Pattern: `vitest.config.ts` — Root test project wiring.
  - Pattern: `packages/editor-shell/vitest.config.ts` — Shell test environment.
  - Test: `packages/editor-shell/src/commands/test/ClipboardCommands.test.ts:26` — High-signal runtime integration test through `EditorService`.
  - Test: `packages/editor-shell/src/keybindings/KeybindingRegistry.test.ts:37` — High-signal keybinding state-based test.

  **Acceptance Criteria**:
  - [ ] `pnpm -r --parallel run type-check` exits 0.
  - [ ] Targeted unit test suite for editor-shell exits 0.
  - [ ] `pnpm --filter @design-editor/shell build` exits 0.
  - [ ] Grep finds zero matches for retired symbols: `ShortcutRegistryImpl`, `KeybindingRegistryImpl`, `ToolRegistryImpl`, and `ToolServiceImpl`.
  - [ ] Grep confirms the final canonical names are present in expected files.

  **QA Scenarios**:

  ```text
  Scenario: Full verification sweep
    Tool: Bash
    Steps: Run type-check, targeted tests, and shell build after all renames.
    Expected: All commands succeed without manual intervention.
    Evidence: .sisyphus/evidence/task-8-full-verification.txt

  Scenario: No-old-names gate
    Tool: Bash
    Steps: Grep the repo for all retired symbols and, separately, grep for the final canonical names.
    Expected: Retired names return zero matches; canonical names appear in the expected modules.
    Evidence: .sisyphus/evidence/task-8-grep-gates.txt
  ```

  **Commit**: YES | Message: `test(shell): verify naming cleanup and stale symbol removal` | Files: tests or none

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Prefer atomic commits matching T2-T8 so blame stays aligned with rename intent.
- Do not batch unrelated symbol renames into one “misc cleanup” commit.
- If T7 is skipped, note that explicitly in commit/PR context so `EditorReceiverImpl` staying behind is intentional rather than accidental.

## Success Criteria

- Naming becomes explainable by role without additional tribal knowledge.
- `Command` means execute/undo object only; string ids use `actionId` terminology.
- Tool layer retains DI separation from `EditorService` while gaining clearer implementation naming.
- No stale `Impl` symbols remain except intentionally retained names.
- Behavior remains unchanged under automated verification.
