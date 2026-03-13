# Codex + Claude Agent System GitHub Action

## TL;DR

> **Summary**: Build a new GitHub Action that can run either Codex or Claude as an agent, with two trigger modes (mention-driven + explicit prompt) and a safe, extensible prompt templating/injection system.
> **Deliverables**: New action package, provider adapters (Codex+Claude), configurable mention behavior, security gates, examples, tests, and CI to ensure `dist/` stays in sync.
> **Effort**: Large
> **Parallel**: YES - 3 waves
> **Critical Path**: Scaffold + config → policy/templating → provider runners → orchestrator wiring → examples/CI

## Context

### Original Request

- "나만의 이런 action에서 사용할수있는 agent시스템"을 만들고 싶다.
- Codex 기반으로 만들되, 전체 시스템은 `claude-code-action`과 유사하게.
- 특정 프롬프트 주입/확장을 쉽게.
- Claude와 Codex API/런타임 차이를 흡수할 설계 필요.

### Interview Summary

- Baseline은 OpenAI 공식 `codex-action` 패턴을 참고/확장한다.
- mention-driven 모드 동작은 전부 설정 가능해야 한다 (comment-only / diff suggestion / branch+commit+push 등).
- Provider는 1차 MVP에서 Codex + Claude 둘 다 지원.
- 프롬프트 템플릿은 단순 `{{var}}` 치환(allowlist, no-eval)로 간다.

### Repo Facts (evidence)

- Codex 공식 패턴(보안/샌드박스/프록시/권한체크): `codex-action/action.yml`, `codex-action/src/runCodexExec.ts`, `codex-action/docs/security.md`.
- Codex SDK 기반 action 구현(프롬프트 주입 inputs + sticky comment + step summary): `codex-code-action/action.yml`, `codex-code-action/src/main.js`, `codex-code-action/src/inputs.js`, `codex-code-action/src/github.js`.
- Claude reference(모드 감지/trigger 감지/댓글 lifecycle/보안): `claude-code-action/src/modes/detector.ts`, `claude-code-action/src/github/validation/trigger.ts`, `claude-code-action/docs/security.md`.
- Codex/Claude 공존 규칙: `docs/claude-codex-compat.md`.

### Metis Review (gaps addressed)

- 이벤트 안전성(특히 `pull_request_target` 위험)과 trust tier 기반 policy engine을 1급 요구사항으로 포함.
- 템플릿은 allowlisted `{{var}}`만 허용 + unknown var는 기본 hard-fail.
- mention 모드에서 기본값은 보수적으로(comment-only) 두고, commit/push는 신뢰된 actor + permissions + 정책 게이트를 통과해야만 가능.
- 동시 실행/중복 댓글 방지를 위한 idempotent sticky comment + concurrency 가드 포함.

## Work Objectives

### Core Objective

- GitHub Actions에서 "에이전트"를 실행하는 공통 오케스트레이터를 만들고, Codex/Claude 실행 엔진은 adapter로 교체 가능하게 만든다.

### Deliverables

- 새 액션 패키지(루트 하위 단독 폴더): `agent-system-action/` (결정: 이 이름으로 진행)
- Provider adapters:
  - Codex runner: `codex exec` 기반(공식 `codex-action` 스타일) + 안전 전략(safety-strategy) 재사용
  - Claude runner: Claude Code SDK/CLI 경로(claude-code-action base-action 패턴) 재사용
- Modes:
  - mention-driven: `issue_comment` + `pull_request_review_comment`에서 trigger phrase 감지
  - prompt-driven: `workflow_dispatch` 또는 action input으로 prompt 제공
- Prompt injection/templating:
  - allowlisted `{{var}}` 치환
  - prompt blocks: system preamble / injected context / user request
- Security/policy:
  - actor 권한/allowlist/bot 정책
  - fork/PR context gate
  - permissions gate(댓글/PR/contents write 등)
  - no-secret logging + redaction
- Outputs:
  - `final_message`, `execution_file` (JSON/JSONL), `structured_output`(optional), `duration_ms`, `provider`, `mode`, `comment_id`(optional)
- Examples + docs + CI:
  - 최소 2개 workflow 예시(mention-driven, workflow_dispatch)
  - `dist/` bundle sync 체크
- Tests:
  - unit tests (templating/policy/trigger/comment)
  - adapter contract tests (mock providers)

### Definition of Done (agent-executable)

- `pnpm -C agent-system-action install` (or equivalent) succeeds.
- `pnpm -C agent-system-action check` succeeds (TypeScript noEmit).
- `pnpm -C agent-system-action build` produces `agent-system-action/dist/main.js` referenced by `agent-system-action/action.yml`.
- `pnpm -C agent-system-action test` succeeds (unit + contract).
- Integration tests simulate GitHub context and prove:
  - a single sticky comment updated from running → completed, and
  - action outputs populated (`final_message`, `execution_file`).

### Must Have

- Provider abstraction with capability flags (Codex vs Claude parity 강요 금지)
- Safe prompt templating (`{{var}}` allowlist, no eval)
- mention-trigger gating + actor permission checks
- deterministic logging + secret redaction

### Must NOT Have

- `pull_request_target` 기반으로 secrets 있는 상태에서 untrusted head 코드를 checkout/run 하는 설계
- 템플릿 엔진(조건/루프/인클루드/eval) 도입
- mention 모드에서 기본적으로 branch push/PR 생성이 켜져있는 상태

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after (package-local). Framework: Node `node:test` + TS via `tsx` loader (decision).
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

Wave 1: package scaffold + config inputs/outputs + templating + policy + trigger detection + comment lifecycle
Wave 2: prompt context builders + Codex runner + Claude runner + adapter contracts
Wave 3: orchestrator wiring + step summary/reporting + docs/examples + CI dist sync

### Dependency Matrix (full)

- Wave 1 tasks block all provider work.
- Provider runners (Wave 2) block orchestrator integration (Wave 3).
- Docs/examples can parallelize late once inputs/outputs stabilize.

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Scaffold new action package `agent-system-action/`

  **What to do**:
  - Create standalone action folder at repo root (NOT pnpm workspace package): `agent-system-action/`.
  - Add: `agent-system-action/action.yml` (composite), `agent-system-action/src/main.ts`, `agent-system-action/dist/main.js` (bundled), `agent-system-action/package.json`, `agent-system-action/tsconfig.json`, `agent-system-action/docs/`, `agent-system-action/examples/`.
  - Build tooling decision (copy `codex-action/`): TypeScript + esbuild bundle to CommonJS `dist/main.js`.
  - Add scripts (decision):
    - `pnpm -C agent-system-action install` (standard)
    - `pnpm -C agent-system-action check` → `tsc --noEmit`
    - `pnpm -C agent-system-action build` → esbuild bundle
    - `pnpm -C agent-system-action test` → `node --import tsx --test test/**/*.test.ts`
  - Add dev dependency (decision): `tsx` for TS tests.
  - Ensure `action.yml` runs Node 20 and runs `node dist/main.js` (decision: `dist/` is fully bundled; no runtime install).

  **Must NOT do**:
  - Do not add `agent-system-action/` to `pnpm-workspace.yaml`.
  - Do not require Bun.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: scaffolding + wiring small files.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2-15 | Blocked By: none

  **References**:
  - Pattern (action scaffold + dist sync): `codex-action/package.json`, `codex-action/action.yml`, `codex-action/.github/workflows/ci.yml`
  - Pattern (rich input mapping): `codex-code-action/action.yml`

  **Acceptance Criteria**:
  - [ ] `pnpm -C agent-system-action check` exits 0
  - [ ] `pnpm -C agent-system-action build` produces `agent-system-action/dist/main.js`

  **QA Scenarios**:

  ```
  Scenario: Local build produces dist entrypoint
    Tool: Bash
    Steps: pnpm -C agent-system-action install && pnpm -C agent-system-action check && pnpm -C agent-system-action build
    Expected: dist/main.js exists and `action.yml` references it
    Evidence: .sisyphus/evidence/task-1-scaffold.txt

  Scenario: Dist is reproducible
    Tool: Bash
    Steps: pnpm -C agent-system-action build && git status --short -- agent-system-action/dist
    Expected: no diff in dist after build (once dist committed)
    Evidence: .sisyphus/evidence/task-1-dist-clean.txt
  ```

  **Commit**: YES | Message: `chore(agent-system-action): scaffold action package` | Files: `agent-system-action/*`

- [ ] 2. Define inputs/outputs contract + config normalization

  **What to do**:
  - Define action inputs in `agent-system-action/action.yml` (decision-complete set):
    - `mode`: `mention` | `prompt` | `auto` (default `auto`)
    - `provider`: `codex` | `claude` | `auto` (default `codex`)
    - Prompt sources (mutually exclusive): `prompt`, `prompt-file`, `prompt-template`, `prompt-template-file`
    - Prompt injection: `append-system-prompt`, `custom-instructions`
    - Mention trigger: `trigger-phrase` (default `@agent`), `require-trigger` (default true)
    - Behavior: `behavior` = `comment` | `patch-suggestion` | `branch-commit-push` (default `comment`)
    - GitHub: `github-token`, `github-comment-mode` = off|pr|issue, `use-sticky-comment`, `track-progress`, `display-report`, `show-full-output`
    - Actor gates: `allow-users`, `allow-bots`, `allowed-non-write-users`
    - Codex auth: `openai-api-key`, `responses-api-endpoint`, `codex-version`, `codex-args`, `sandbox`, `safety-strategy`, `codex-home`
    - Claude auth: `anthropic-api-key`, `claude-code-oauth-token`, `claude-code-version`, `claude-args`
    - Limits: `max-prompt-chars`, `max-diff-chars`, `timeout-minutes`
  - Implement `src/config.ts` to read `INPUT_*` env (GitHub Actions style), validate exclusivity, and produce `NormalizedConfig`.
  - Implement unit tests for validation and defaults.

  **Must NOT do**:
  - Do not silently ignore invalid combinations; fail fast with actionable error messages.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: contract design + validation matrix.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 7-15 | Blocked By: 1

  **References**:
  - Pattern (inputs validation): `codex-action/action.yml`, `codex-code-action/src/inputs.js`, `claude-code-action/src/github/context.ts`

  **Acceptance Criteria**:
  - [ ] `pnpm -C agent-system-action test` includes config validation tests covering mutual exclusivity + defaults

  **QA Scenarios**:

  ```
  Scenario: Reject invalid prompt combinations
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/config.test.ts
    Expected: tests cover prompt vs prompt_file vs templates and fail on invalid combos
    Evidence: .sisyphus/evidence/task-2-config-tests.txt

  Scenario: Defaults are stable
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/config-defaults.test.ts
    Expected: snapshot-like assertions pass for default NormalizedConfig
    Evidence: .sisyphus/evidence/task-2-defaults.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add inputs contract and config normalization` | Files: `agent-system-action/action.yml`, `agent-system-action/src/config.*`, `agent-system-action/test/*`

- [ ] 3. Implement safe `{{var}}` prompt templating (allowlist, no-eval)

  **What to do**:
  - Implement `src/prompt/template.ts`:
    - Only supports `{{var}}` (var = `[a-zA-Z0-9_]+`).
    - Allowlist vars by mode (mention vs prompt) and by provider.
    - Unknown var default = hard-fail.
    - Add escaping rule: `\{{` renders literal `{{` (decision) and is covered by tests.
  - Implement `src/prompt/blocks.ts` to assemble:
    - `append_system_prompt` (top)
    - security/policy preamble
    - context blocks (UNTRUSTED)
    - `custom_instructions`
    - user request
  - Add unit tests for substitution/escaping/unknown vars/size caps.

  **Must NOT do**:
  - No conditionals/loops/includes.
  - No environment-variable expansion.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: correctness + security.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 7-15 | Blocked By: 2

  **References**:
  - Prompt injection primitives pattern: `codex-code-action/src/inputs.js`
  - Security prompt injection warning: `claude-code-action/docs/security.md`

  **Acceptance Criteria**:
  - [ ] `pnpm -C agent-system-action test` passes template tests (unknown var fails, escaping works)

  **QA Scenarios**:

  ```
  Scenario: Unknown var hard-fails
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/template-unknown-var.test.ts
    Expected: exit 0; test asserts thrown error includes var name
    Evidence: .sisyphus/evidence/task-3-unknown-var.txt

  Scenario: Escaping renders literal braces
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/template-escape.test.ts
    Expected: output contains literal {{...}} as expected
    Evidence: .sisyphus/evidence/task-3-escape.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add safe prompt templating and block assembly` | Files: `agent-system-action/src/prompt/*`, `agent-system-action/test/*`

- [ ] 4. Implement policy engine (trust tiers, forks, permissions → allowed behavior)

  **What to do**:
  - Implement `src/policy/engine.ts`:
    - Determine `TrustTier`: `untrusted` | `trusted` | `maintainer`.
    - Inputs: event info, actor, repo visibility, fork status, requested `behavior`, workflow permissions availability.
    - Output: `PolicyDecision` including: `allowedBehavior`, `allowComments`, `allowWrites`, `allowNetwork`, `codexSandbox`, `claudeToolPolicy`, `redactionPolicy`.
    - Default mapping:
      - Untrusted → force `comment` or `patch_suggestion`, disallow `branch_commit_push`.

- Trusted/Maintainer → allow requested behavior only if `github-token` present and permissions sufficient.
  - Implement `src/github/actor.ts` to check write permissions via octokit (pattern from `codex-action` + `claude-code-action`).
  - Unit tests: matrix of fork/unfork + bot/user + allowlists.

  **Must NOT do**:
  - No privileged behavior in forks by default.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: security logic.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6-15 | Blocked By: 2

  **References**:
  - Write-access check: `codex-action/action.yml` (check-write-access step), `codex-action/src/checkActorPermissions.ts`
  - Allowed bots/users patterns: `codex-action/action.yml`, `claude-code-action/docs/security.md`

  **Acceptance Criteria**:
  - [ ] Unit tests cover: fork PR forces comment-only; allow_users overrides; bot default-deny unless allow_bots

  **QA Scenarios**:

  ```
  Scenario: Fork PR forces safe behavior
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/policy-fork.test.ts
    Expected: policyDecision.allowedBehavior != branch_commit_push
    Evidence: .sisyphus/evidence/task-4-policy-fork.txt

  Scenario: Maintainer can enable branch mode
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/policy-maintainer.test.ts
    Expected: allowedBehavior == branch_commit_push when permissions simulated as write
    Evidence: .sisyphus/evidence/task-4-policy-maintainer.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add trust-tier policy engine` | Files: `agent-system-action/src/policy/*`, `agent-system-action/src/github/actor.*`, `agent-system-action/test/*`

- [ ] 5. Implement mention trigger detection + user request extraction

  **What to do**:
  - Implement `src/trigger/detect.ts`:
    - For comment events, check `trigger_phrase` exists with word-boundary/punctuation rules.
    - If `require_trigger` is true and not found, exit early (set outputs accordingly).
  - Implement `src/trigger/extract.ts`:
    - Extract user request from comment body: prefer fenced block after trigger; else take remainder of comment with trigger removed.
  - Unit tests: boundary cases, punctuation, multiple mentions.

  **Must NOT do**:
  - Do not treat any text in issue/PR body as a command unless trigger is present (v1 decision).

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small logic + tests.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 11-15 | Blocked By: 2

  **References**:
  - Trigger regex patterns: `claude-code-action/src/github/validation/trigger.ts`

  **Acceptance Criteria**:
  - [ ] Unit tests cover exact trigger detection and extraction

  **QA Scenarios**:

  ```
  Scenario: Trigger phrase detected with punctuation
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/trigger-punctuation.test.ts
    Expected: detectTrigger() returns true
    Evidence: .sisyphus/evidence/task-5-trigger.txt

  Scenario: Extraction prefers fenced block
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/trigger-extract-fence.test.ts
    Expected: extracted request equals fenced content only
    Evidence: .sisyphus/evidence/task-5-extract.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add mention trigger detection and request extraction` | Files: `agent-system-action/src/trigger/*`, `agent-system-action/test/*`

- [ ] 6. Implement GitHub comment lifecycle (sticky comment + running/completed/failed)

  **What to do**:
  - Implement `src/github/comments.ts`:
    - `resolveCommentTarget(mode)` like `codex-code-action/src/github.js`.
    - `publishOrUpdateStickyComment(marker, body)`.
    - `renderCommentBody(status, payload)` with stable formatting.
  - Implement throttling for progress updates (decision): at most 1 update per 10s.
  - Add unit tests with mocked octokit (use `nock` or a simple stub object).

  **Must NOT do**:
  - Do not spam new comments when sticky mode is enabled.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: idempotency + API correctness.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 11-15 | Blocked By: 2,4

  **References**:
  - Sticky comment pattern: `codex-code-action/src/github.js`
  - Claude comment update pattern: `claude-code-action/src/entrypoints/update-comment-link.ts`

  **Acceptance Criteria**:
  - [ ] Tests prove: existing marker comment is updated, not duplicated

  **QA Scenarios**:

  ```
  Scenario: Sticky comment reused
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/comments-sticky.test.ts
    Expected: test asserts update path is used when marker found
    Evidence: .sisyphus/evidence/task-6-sticky.txt

  Scenario: Non-sticky creates new
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/comments-nonsticky.test.ts
    Expected: createComment called when sticky disabled
    Evidence: .sisyphus/evidence/task-6-nonsticky.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add sticky GitHub comment lifecycle` | Files: `agent-system-action/src/github/comments.*`, `agent-system-action/test/*`

- [ ] 7. Build safe GitHub context blocks (diff/title/body/comment) + truncation

  **What to do**:
  - Implement `src/context/builders.ts`:
    - Gather minimal, bounded context:
      - repo/actor/event
      - issue/PR title/body
      - triggering comment body
      - PR file list + patch hunks OR compare summary (bounded)
    - Mark all GitHub-derived content as UNTRUSTED in the prompt.
    - Add truncation strategy:
      - `max_prompt_chars` hard cap
      - `max_diff_chars` hard cap
      - include an "omitted" notice.
  - Unit tests using fixture JSON payloads (store under `agent-system-action/test/fixtures/`).

  **Must NOT do**:
  - Do not include raw workflow env or secrets.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: context correctness strongly affects outcomes.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11-15 | Blocked By: 2,3,5

  **References**:
  - Context selection patterns: `claude-code-action/src/github/data/fetcher.ts`, `claude-code-action/src/github/data/formatter.ts`

  **Acceptance Criteria**:
  - [ ] Fixture-based tests assert truncation + omitted notice

  **QA Scenarios**:

  ```
  Scenario: Large diff is truncated deterministically
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/context-truncation.test.ts
    Expected: output includes "(omitted" notice and stays under max chars
    Evidence: .sisyphus/evidence/task-7-truncation.txt

  Scenario: UNTRUSTED labeling present
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/context-untrusted.test.ts
    Expected: prompt contains explicit UNTRUSTED delimiter lines
    Evidence: .sisyphus/evidence/task-7-untrusted.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add bounded GitHub context builders` | Files: `agent-system-action/src/context/*`, `agent-system-action/test/*`

- [ ] 8. Implement Codex adapter (official `codex-action` execution model)

  **What to do**:
  - Implement `src/providers/codex.ts` using the same operational model as `codex-action/`:
    - Install `@openai/codex@<version>` CLI.
    - Install `@openai/codex-responses-api-proxy@<version>`.

- If `openai-api-key` provided, start proxy and write server info; ensure key minimization patterns (no extra copies in env).
  - Run `codex exec` with:
    - `--cd <workingDir>`
    - `--output-last-message <file>`
    - `--sandbox <sandbox>`
    - `--output-schema <schema>` when provided
    - `--model`/`--config model_reasoning_effort=...` when provided
    - `codex_args` forwarded (JSON array or shell string parsing)
  - Return `final_message` and `execution_file` (decision: JSONL log file capturing invoked command + stdout/stderr + last message file path).
  - Implement OS safety gates from `codex-action` (Windows: only allow `unsafe`).
  - Add unit tests that validate command construction (spawn mocked).

  **Must NOT do**:
  - Must not log API keys.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: process spawning + security.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11-15 | Blocked By: 2,4

  **References**:
  - CLI/proxy install + safety strategy: `codex-action/action.yml`, `codex-action/src/runCodexExec.ts`, `codex-action/docs/security.md`
  - Extra args parsing: `codex-action/src/main.ts` (`string-argv` usage)

  **Acceptance Criteria**:
  - [ ] Unit tests assert expected `spawn()` args for codex install/proxy/exec paths

  **QA Scenarios**:

  ```
  Scenario: Codex command construction
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/codex-spawn.test.ts
    Expected: test asserts codex exec called with --output-last-message and sandbox
    Evidence: .sisyphus/evidence/task-8-codex-spawn.txt

  Scenario: API key never appears in logs
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/codex-redaction.test.ts
    Expected: log strings do not include fake key
    Evidence: .sisyphus/evidence/task-8-redaction.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add Codex provider adapter` | Files: `agent-system-action/src/providers/codex.*`, `agent-system-action/test/*`

- [ ] 9. Implement Claude adapter (Claude Code SDK/CLI model)

  **What to do**:
  - Implement `src/providers/claude.ts` mirroring the `claude-code-action` base-action approach:
    - Install Claude Code CLI (pinned version input default) and add to PATH.
    - Use `@anthropic-ai/claude-agent-sdk` `query()` streaming to run the session.
    - Prompt format decision:
      - Write a prompt file containing system/context blocks.
      - Optionally write a `claude-user-request.txt` next to it to enable multi-block message semantics (pattern from `claude-code-action/base-action/src/run-claude-sdk.ts`).

- Support auth via `anthropic-api-key` OR `claude-code-oauth-token` (mutually exclusive).
  - Capture execution log JSON to `execution_file`.
  - If `output_schema` is configured, enforce structured output presence (mirror `claude-code-action/base-action/src/run-claude-sdk.ts`).
  - Add unit tests with a mocked async iterable `query()`.

  **Must NOT do**:

- Do not print raw SDK messages unless `show-full-output` is enabled.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: streaming protocol + structured outputs.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11-15 | Blocked By: 2,3,4

  **References**:
  - SDK runner + multi-block: `claude-code-action/base-action/src/run-claude-sdk.ts`
  - SDK option shaping: `claude-code-action/base-action/src/parse-sdk-options.ts`

  **Acceptance Criteria**:
  - [ ] Unit tests cover: final message extraction; structured output enforcement when schema set

  **QA Scenarios**:

  ```
  Scenario: Final message extracted from SDK stream
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/claude-stream.test.ts
    Expected: adapter returns final_message and sets execution_file
    Evidence: .sisyphus/evidence/task-9-claude-stream.txt

  Scenario: Schema requires structured output
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/claude-schema.test.ts
    Expected: adapter throws when schema set but structured output missing
    Evidence: .sisyphus/evidence/task-9-claude-schema.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add Claude provider adapter` | Files: `agent-system-action/src/providers/claude.*`, `agent-system-action/test/*`

- [ ] 10. Define provider adapter contract + capability flags (no parity fantasy)

  **What to do**:
  - Define shared types in `src/providers/types.ts`:
    - `AgentRequest` (normalized prompt blocks, mode, behavior, limits, working dir)
    - `AgentResult` (final_message, execution_file, structured_output?, session_id?, usage_json?)
    - `ProviderCapabilities` (streaming, structuredOutput, supportsProxy, etc.)
    - `ProviderAdapter` interface with `run(request): Promise<AgentResult>` and optional `runStreamed()` for progress.
  - Add contract tests using a fake provider to prove orchestrator expectations.

  **Must NOT do**:
  - Do not encode provider-specific fields into orchestrator; keep adapters responsible.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: core abstraction.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11-15 | Blocked By: 8,9

  **References**:
  - Adapter guidance (Metis): capability-driven contract

  **Acceptance Criteria**:
  - [ ] Contract tests fail if required `AgentResult` fields missing

  **QA Scenarios**:

  ```
  Scenario: Fake provider satisfies contract
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/provider-contract.test.ts
    Expected: orchestrator can run with fake provider without branching on provider
    Evidence: .sisyphus/evidence/task-10-contract.txt

  Scenario: Missing fields are rejected
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/provider-contract-negative.test.ts
    Expected: test asserts validation error
    Evidence: .sisyphus/evidence/task-10-contract-negative.txt
  ```

  **Commit**: YES | Message: `refactor(agent-system-action): introduce provider adapter contract` | Files: `agent-system-action/src/providers/types.*`, `agent-system-action/test/*`

- [ ] 11. Wire orchestrator entrypoint (mode detect → policy → prompt → provider → publish)

  **What to do**:
  - Implement `agent-system-action/src/main.ts` (single entrypoint):
    - Parse GitHub context (event name, payload) and normalized inputs.
    - Detect `mode`:
      - `prompt` mode if explicit prompt/template is provided
      - `mention` mode if comment event and trigger phrase present
      - `auto` = prefer mention when comment event has trigger, else prompt
    - Run policy engine to compute allowed behavior and provider settings.
    - Build prompt blocks via templating + context builders.

- If `track-progress` and comment target enabled, publish sticky comment status=running.
  - Invoke provider adapter (Codex/Claude) and collect `AgentResult`.
  - If `behavior=branch_commit_push` AND policy allows:
    - run git branch/commit/push pipeline (Task 15)
  - Publish final output:
    - update sticky comment or post new comment
    - write step summary if enabled
    - set action outputs
  - Add integration tests using:
    - fixture event JSONs
    - fake provider adapter returning deterministic results
    - stub octokit

  **Must NOT do**:
  - Orchestrator must never directly access provider secrets; only adapters should.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: glue layer + correctness.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 12-15 | Blocked By: 2-10

  **References**:
  - Orchestration skeleton: `claude-code-action/src/entrypoints/run.ts`
  - Codex-code-action orchestration structure: `codex-code-action/src/main.js`

  **Acceptance Criteria**:
  - [ ] With fake provider, orchestrator writes outputs and updates comment exactly once

  **QA Scenarios**:

  ```
  Scenario: Mention-mode happy path with fake provider
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/integration/mention-happy.test.ts
    Expected: comment updated from running → completed; outputs set
    Evidence: .sisyphus/evidence/task-11-mention-happy.txt

  Scenario: Missing trigger exits early
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/integration/mention-no-trigger.test.ts
    Expected: provider not invoked; outputs indicate no-op
    Evidence: .sisyphus/evidence/task-11-no-trigger.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add orchestrator entrypoint` | Files: `agent-system-action/src/main.*`, `agent-system-action/test/integration/*`

- [ ] 12. Add logging redaction + safe output controls

  **What to do**:
  - Implement `src/logging/redact.ts`:
    - Redact known secrets from logs/comments (`openai-api-key`, `anthropic-api-key`, oauth token).
    - Redact common token patterns (best-effort) without over-redacting normal text.
  - Implement `show-full-output` behavior:
    - default false; when false, only emit high-level progress + result summary.
  - Add unit tests for redaction.

  **Must NOT do**:
  - Do not print provider SDK raw events by default.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: bounded utility + tests.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 13-15 | Blocked By: 2

  **References**:
  - Full output warning patterns: `claude-code-action/docs/security.md`, `codex-action/docs/security.md`

  **Acceptance Criteria**:
  - [ ] Redaction tests pass and logs never include fake secrets

  **QA Scenarios**:

  ```
  Scenario: API key redacted
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/redact-api-key.test.ts
    Expected: output replaces key with [REDACTED]
    Evidence: .sisyphus/evidence/task-12-redact.txt

  Scenario: show-full-output gates verbose logs
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/logging-verbosity.test.ts
    Expected: verbose payload printed only when flag enabled
    Evidence: .sisyphus/evidence/task-12-verbosity.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add redaction and safe logging defaults` | Files: `agent-system-action/src/logging/*`, `agent-system-action/test/*`

- [ ] 13. Step summary report + execution artifacts

  **What to do**:
  - Implement `src/report/step-summary.ts`:
    - Write final message (md fenced block)
    - provider, mode, duration
    - links to execution artifact path
  - Decide artifact format:
    - Codex: JSONL file with each line = {ts,type,payload}
    - Claude: JSON array of SDK messages (mirror claude-code-action)
  - Unit tests for summary formatting.

  **Must NOT do**:
  - Do not include raw tool outputs in summary unless show-full-output.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: formatting.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 14-15 | Blocked By: 11

  **References**:
  - Step summary pattern: `codex-code-action/src/github.js` (`core.summary`), `claude-code-action/src/entrypoints/format-turns.ts`

  **Acceptance Criteria**:
  - [ ] Summary tests confirm stable format and no secret leaks

  **QA Scenarios**:

  ```
  Scenario: Step summary includes key fields
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/step-summary.test.ts
    Expected: summary contains provider/mode/duration/execution_file
    Evidence: .sisyphus/evidence/task-13-summary.txt

  Scenario: Summary omits verbose output by default
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/step-summary-redaction.test.ts
    Expected: tool logs absent when show-full-output=false
    Evidence: .sisyphus/evidence/task-13-summary-redaction.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add step summary reporting` | Files: `agent-system-action/src/report/*`, `agent-system-action/test/*`

- [ ] 14. Documentation + example workflows (secure defaults)

  **What to do**:
  - Add `agent-system-action/docs/security.md`:
    - threat model (prompt injection, forks, bots)
    - recommended workflow permissions matrix
    - safe defaults explanation
  - Add examples:
    - `examples/mention.yml`: `issue_comment` + `pull_request_review_comment` triggers, minimal permissions, safe behavior default.
    - `examples/workflow-dispatch.yml`: prompt-driven with explicit prompt inputs.
  - Document how to inject prompt templates and allowed variables list.

  **Must NOT do**:
  - Do not recommend `allow-users: "*"` without warnings.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: security docs.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 15 | Blocked By: 2,11

  **References**:
  - Codex action security guidance: `codex-action/docs/security.md`
  - Claude action security guidance: `claude-code-action/docs/security.md`

  **Acceptance Criteria**:
  - [ ] Examples reference valid inputs and minimal `permissions:` blocks

  **QA Scenarios**:

  ```
  Scenario: Example YAMLs are syntactically valid
    Tool: Bash
    Steps: python -c "import yaml,sys; [yaml.safe_load(open(p)) for p in ['agent-system-action/examples/mention.yml','agent-system-action/examples/workflow-dispatch.yml']]"
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-14-yaml-parse.txt

  Scenario: Docs enumerate allowed template vars
    Tool: Bash
    Steps: grep -n "Allowed variables" -n agent-system-action/docs/security.md
    Expected: section exists and matches implementation allowlist
    Evidence: .sisyphus/evidence/task-14-doc-vars.txt
  ```

  **Commit**: YES | Message: `docs(agent-system-action): add security docs and example workflows` | Files: `agent-system-action/docs/*`, `agent-system-action/examples/*`

- [ ] 15. Implement branch+commit+push behavior with strict gates (configurable mention behavior)

  **What to do**:
  - Implement `src/git/branch.ts` + `src/git/commit.ts`:
    - Create branch name template: `agent/{provider}/{issue|pr}-{number}-{timestamp}`.
    - Validate branch name (reuse whitelist rules from `claude-code-action/src/github/operations/branch.ts`).
    - Apply changes:
      - If provider wrote to workspace (Codex sandbox `workspace-write`), detect `git status --porcelain`.
      - If provider produced patch text (optional future), apply via `git apply`.
    - Commit with deterministic message including run id.
    - Push to origin.
  - Implement gating in policy:
    - `behavior=branch_commit_push` allowed only when:
      - actor trust tier >= trusted
      - repo is not fork OR explicit override enabled
      - workflow permissions include `contents: write`
      - `github-token` present
  - Update comment final body to include compare link `.../compare/base...branch?quick_pull=1` (pattern from `claude-code-action/src/entrypoints/update-comment-link.ts`).
  - Add unit tests for branch name validation + gating.

  **Must NOT do**:
  - Do not push branches for untrusted actors.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: git safety + security.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: none | Blocked By: 4,6,11

  **References**:
  - Branch name validation: `claude-code-action/src/github/operations/branch.ts`
  - Compare/PR link construction: `claude-code-action/src/entrypoints/update-comment-link.ts`

  **Acceptance Criteria**:
  - [ ] Unit tests cover: invalid branch names rejected; gating denies untrusted

  **QA Scenarios**:

  ```
  Scenario: Gating denies branch mode for untrusted
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/git-gating-untrusted.test.ts
    Expected: policyDecision forbids branch_commit_push
    Evidence: .sisyphus/evidence/task-15-gating.txt

  Scenario: Branch name validation rejects unsafe names
    Tool: Bash
    Steps: node --import tsx --test agent-system-action/test/branch-validate.test.ts
    Expected: throws on '..', leading '-', spaces, etc.
    Evidence: .sisyphus/evidence/task-15-branch-validate.txt
  ```

  **Commit**: YES | Message: `feat(agent-system-action): add gated branch/commit/push behavior` | Files: `agent-system-action/src/git/*`, `agent-system-action/src/policy/*`, `agent-system-action/test/*`

- [ ] 16. Add CI to enforce `dist/` is up to date

  **What to do**:
  - Add `agent-system-action/.github/workflows/ci.yml` mirroring `codex-action/.github/workflows/ci.yml`:
    - Checkout
    - Setup pnpm
    - Setup Node
    - Install deps (`pnpm install --frozen-lockfile` inside `agent-system-action/`)
    - Run `pnpm -C agent-system-action check`
    - Run `pnpm -C agent-system-action build`
    - Verify `git status --short -- agent-system-action/dist` is clean

  **Must NOT do**:
  - Do not auto-generate dist in CI; CI should fail and force committing bundled output.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: workflow wiring.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: none | Blocked By: 1

  **References**:
  - Dist sync workflow pattern: `codex-action/.github/workflows/ci.yml`

  **Acceptance Criteria**:
  - [ ] CI workflow exists and would fail if dist is stale

  **QA Scenarios**:

  ```
  Scenario: Local dist sync check
    Tool: Bash
    Steps: pnpm -C agent-system-action build && git status --short -- agent-system-action/dist
    Expected: no modified files (after dist committed)
    Evidence: .sisyphus/evidence/task-16-dist-sync.txt
  ```

  **Commit**: YES | Message: `ci(agent-system-action): enforce dist sync` | Files: `agent-system-action/.github/workflows/ci.yml`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Atomic commits per module boundary (scaffold → templating → policy → runners → wiring → docs).
- Do not include secrets in fixtures.

## Success Criteria

- mention-driven + prompt-driven both work.
- Codex+Claude both runnable behind a single config surface.
- Safe defaults prevent privilege escalation on untrusted input.
