# PM/QA Role Agents With File-Backed Memory

## TL;DR

> **Summary**: Add a QA teammate role that behaves like PM/Designer roles: it reads/writes durable project memory (decisions, quality bar, test plans) stored in-repo, so answers are grounded in prior decisions instead of ad-hoc prompting.
> **Deliverables**:
>
> - `.claude/agents/qa-engineer.md`
> - `.claude/agent-memory/qa-engineer/` (MEMORY.md + quality/test-plan/decision logs)
> - `scripts/validate-claude-agents.mjs` (wiring sanity check)
>   **Effort**: Short
>   **Parallel**: YES - 2 waves
>   **Critical Path**: QA agent definition -> QA memory scaffolding -> validator -> (optional) PM handoff tweak

## Context

### Original Request

- PM/QA 같은 역할이 필요함.
- 단순히 특정 프롬프트(스킬)로 대답하는 게 아니라, 지금까지의 결정/맥락을 "기억"으로 누적해두고 그걸 기반으로 답해야 함.
- Symphony는 이 요구와 무관 (제외).

### Interview Summary

- Repo에 이미 파일 기반 역할/메모리 패턴이 존재함: PM(`.claude/agents/product-manager.md`) + Designer(`.claude/agents/design-editor-ux-expert.md`).
- 동일 패턴으로 QA 역할을 추가하면, 세션을 넘어도 결정/품질 기준을 축적하고 재사용 가능.

### Metis Review (gaps addressed)

- QA 메모리 스코프는 `project`로 고정 (공유/지속).
- QA는 "계획/기준"을 우선 책임지고, 테스트 코드 작성/수정은 요청 시 수행(기본값).
- PM/Designer와 "2중 결정 로그"가 되지 않도록, cross-link 규칙을 문서에 명시.

## Work Objectives

### Core Objective

QA 역할을 `.claude/agents/*` + `.claude/agent-memory/*` 패턴으로 추가해, (1) 품질 기준(quality bar) (2) 테스트 플랜 (3) QA 결정/회귀 로그가 파일로 누적되고, 에이전트가 이를 읽고 쓰는 운영 규칙을 갖도록 한다.

### Deliverables

- `.claude/agents/qa-engineer.md` (역할/책임/경계/메모리 규칙)
- `.claude/agent-memory/qa-engineer/MEMORY.md` (라우팅 인덱스)
- `.claude/agent-memory/qa-engineer/quality-bar.md`
- `.claude/agent-memory/qa-engineer/test-plans.md`
- `.claude/agent-memory/qa-engineer/decisions.md`
- `.claude/agent-memory/qa-engineer/regressions.md`
- `scripts/validate-claude-agents.mjs` (에이전트-메모리 wiring 검증)

### Definition of Done (verifiable)

- QA 역할/메모리 파일이 모두 존재하고, 링크/라우팅이 깨지지 않는다.
- `node scripts/validate-claude-agents.mjs` 가 exit code 0으로 종료한다.
- Repo 기본 품질 게이트가 통과한다:
  - `pnpm lint`
  - `pnpm type-check`

### Must Have

- QA 메모리는 파일 기반이며, 모든 결정/기준은 날짜/근거/영향을 남긴다.
- QA 산출물(테스트 플랜/회귀 로그)은 실행 가능한 재현/검증 커맨드를 포함한다.
- PM/Designer 결정과 충돌할 때는 "중복 기록"이 아니라 "단일 결정 + cross-link"로 정리한다.

### Must NOT Have (guardrails)

- Symphony/외부 오케스트레이션/DB/벡터스토어 도입 금지.
- QA가 제품 스코프/우선순위를 임의로 결정하는 행위 금지 (그건 PM 영역).
- QA가 아키텍처/프레임워크 선택을 지시하는 행위 금지 (그건 Dev 영역).

## Verification Strategy

- Test decision: tests-after (문서/스크립트 추가 중심)
- QA policy: 각 TODO마다 최소 2개 시나리오(정상/오류)를 커맨드 기반으로 제공
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.txt` (명령 출력 캡처)

## Execution Strategy

### Parallel Execution Waves

Wave 1 (role + memory scaffolding)

- Task 1, 2

Wave 2 (validator + optional handoff wiring)

- Task 3, 4

### Dependency Matrix

- Task 1 blocks Task 3 (validator가 검사할 대상이 필요)
- Task 2 blocks Task 3
- Task 4 depends on Task 1 (QA 역할이 존재해야 PM이 cross-link 할 수 있음)

## TODOs

- [ ] 1. Create QA role agent definition (`qa-engineer`)

  **What to do**:
  - Add new agent file: `.claude/agents/qa-engineer.md`.
  - Follow the existing structure used by `.claude/agents/product-manager.md` and `.claude/agents/design-editor-ux-expert.md`.
  - Hard decisions (no executor judgment):
    - Frontmatter:
      - `name: qa-engineer`
      - `model: inherit`
      - `memory: project`
      - `skills`: include `playwright` and `dogfood` (so QA can run/author E2E scenarios and do exploratory testing when asked).
    - Role boundaries:
      - Owns: quality bar, test plans, regression triage, acceptance criteria phrasing.
      - Must not: decide product scope/priority; decide architecture.
    - Operating rules:
      - Always read `.claude/agent-memory/qa-engineer/MEMORY.md` before answering.
      - When a new decision is made (quality gate, acceptance criteria policy), append to `.claude/agent-memory/qa-engineer/decisions.md` immediately.
      - When a bug/regression is found, append to `.claude/agent-memory/qa-engineer/regressions.md` with exact repro + expected/actual.

  **File Content (copy/paste)**:
  - Path: `.claude/agents/qa-engineer.md`

  ```md
  ---
  name: qa-engineer
  description: "QA — quality bar, test plans, regression triage. Decisions are durable and file-backed.\n\nExamples: \"이 기능 테스트 플랜 만들어줘\", \"회귀 버그 재현 절차 써줘\", \"이 PR의 Definition of Done 점검해줘\", \"Playwright로 재현 시나리오 작성해줘\""
  model: inherit
  memory: project
  skills:
   - playwright
   - dogfood
  ---

  # QA Engineer Agent

  ## Role

  You are the QA owner for this product.

  - You own QUALITY: what must be true for a change to be considered done.
  - You turn product scope into testable acceptance criteria and executable verification steps.
  - You maintain durable QA memory so we do not relitigate the same decisions twice.

  ## Boundaries

  - You do NOT decide product scope, priority, or roadmap. That is the PM's domain.
  - You do NOT decide architecture, libraries, or performance tradeoffs. That is the developer's domain.
  - If quality constraints conflict with scope/timeline, escalate and force a decision log (do not silently relax gates).

  ## Responsibilities

  - **QUALITY BAR**: Define and evolve Definition of Done and when E2E is required.
  - **TEST PLANS**: For each feature/issue, produce a test plan with happy/edge/failure scenarios.
  - **REGRESSIONS**: Record regressions with exact repro steps and expected vs actual.
  - **ACCEPTANCE CRITERIA**: Rewrite vague requirements into binary, verifiable checks.

  ## Memory

  Memory lives in `.claude/agent-memory/qa-engineer/`. `MEMORY.md` is always loaded and routes to the right file.

  | File           | Purpose             | Read when               | Update when     |
  | -------------- | ------------------- | ----------------------- | --------------- |
  | quality-bar.md | Quality gates / DoD | before sign-off         | gate changes    |
  | test-plans.md  | Test plan ledger    | planning tests          | new plan added  |
  | regressions.md | Regression ledger   | bug triage              | new repro found |
  | decisions.md   | QA decisions log    | similar decision arises | decision made   |

  ### Memory Rules

  - **Read first**: Before answering, read the relevant memory file(s) via MEMORY.md routing.
  - **Update immediately**: If you make a decision (gate, policy, definition), log it right away.
  - **Cross-link with PM**: Product scope/priority decisions belong in PM memory. QA memory should link, not duplicate.

  ## How to operate

  1. Start from `quality-bar.md` (what must be true).
  2. Convert requirements into acceptance criteria (binary + commands).
  3. For UI/editor flows, prefer Playwright E2E patterns in `e2e/` and reuse `e2e/pom/EditorPage.ts`.
  4. When evidence exists, include how to reproduce and where artifacts live (e.g. Playwright HTML report).
  5. If you discover a regression, log it in `regressions.md` with minimal repro.
  ```

  **Must NOT do**:
  - Do not introduce new tooling beyond files listed in deliverables.
  - Do not change existing PM/Designer memory text except minimal cross-link additions (Task 4).

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: role doc + operational policy writing
  - Skills: none
  - Omitted: `playwright` — Reason: not needed to write the agent definition itself

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3 | Blocked By: none

  **References**:
  - Pattern: `.claude/agents/product-manager.md` — role structure + memory rules
  - Pattern: `.claude/agents/design-editor-ux-expert.md` — memory routing section/table

  **Acceptance Criteria**:
  - [ ] `test -f .claude/agents/qa-engineer.md`
  - [ ] `.claude/agents/qa-engineer.md` frontmatter includes `memory: project`
  - [ ] `.claude/agents/qa-engineer.md` explicitly references `.claude/agent-memory/qa-engineer/`

  **QA Scenarios**:

  ```
  Scenario: Agent definition exists and declares project memory
    Tool: Bash
    Steps:
      1) test -f .claude/agents/qa-engineer.md
      2) grep -n "^memory: project" .claude/agents/qa-engineer.md
    Expected: command 1 succeeds; command 2 finds exactly one match
    Evidence: .sisyphus/evidence/task-1-qa-agent-definition.txt

  Scenario: Missing memory declaration fails fast
    Tool: Bash
    Steps:
      1) node scripts/validate-claude-agents.mjs
    Expected: (before Task 3 is implemented) command fails; (after Task 3) command passes and reports qa-engineer OK
    Evidence: .sisyphus/evidence/task-1-pre-validator-behavior.txt
  ```

  **Commit**: NO (unless user explicitly requests)

- [ ] 2. Add QA file-backed memory (index + quality/test/decision logs)

  **What to do**:
  - Create directory `.claude/agent-memory/qa-engineer/`.
  - Add the following files with the same conventions as PM/Designer memory:
    - `.claude/agent-memory/qa-engineer/MEMORY.md` (routing index)
    - `.claude/agent-memory/qa-engineer/quality-bar.md` (Definition of Done + when to require unit/e2e)
    - `.claude/agent-memory/qa-engineer/test-plans.md` (feature/issue test plan template + filled examples)
    - `.claude/agent-memory/qa-engineer/decisions.md` (QA decisions only; product decisions are cross-links to PM)
    - `.claude/agent-memory/qa-engineer/regressions.md` (bug/regression ledger)
  - Hard decisions for initial content (no executor judgment):
    - `quality-bar.md` must include these baseline gates:
      - Always: `pnpm lint`, `pnpm type-check`, `pnpm test:unit`
      - If editor UX/interaction changes (shell/canvas): `pnpm test:e2e`
    - E2E references to anchor test writing:
      - Use `playwright.config.ts` base URLs and webServer behavior.
      - Reuse the existing Page Object `e2e/pom/EditorPage.ts` patterns (selectors: `data-testid`, `data-node-id`).
    - Cross-link policy:
      - If a QA decision impacts product scope/priority, record the decision in PM memory (`.claude/agent-memory/product-manager/decisions.md`) and in QA memory store only a link: `See PM decision: YYYY-MM-DD: Title`.

  **File Content (copy/paste)**:
  - Path: `.claude/agent-memory/qa-engineer/MEMORY.md`

  ```md
  # QA Memory Index

  ## Files

  | File                             | Purpose                            |
  | -------------------------------- | ---------------------------------- |
  | [quality-bar.md](quality-bar.md) | Quality gates / Definition of Done |
  | [test-plans.md](test-plans.md)   | Test plan ledger                   |
  | [regressions.md](regressions.md) | Regression repro ledger            |
  | [decisions.md](decisions.md)     | QA decision log                    |

  ## Routing

  - **"Is this change done?"** -> quality-bar.md
  - **"Write a test plan"** -> test-plans.md
  - **"Repro a bug"** -> regressions.md
  - **"Did we decide this already?"** -> decisions.md (and cross-link to PM decisions when product scope is involved)

  ## Cross-link Policy

  - Product scope/priority decisions live in PM memory: `.claude/agent-memory/product-manager/decisions.md`.
  - QA memory stores only a link: `See PM decision: YYYY-MM-DD: Title`.

  ## Test Infra Pointers (repo truth)

  - Unit tests: `pnpm test:unit` (Vitest)
  - E2E tests: `pnpm test:e2e` (Playwright) using `playwright.config.ts`
  - E2E helpers: `e2e/fixtures.ts`, `e2e/pom/EditorPage.ts`
  ```

  - Path: `.claude/agent-memory/qa-engineer/quality-bar.md`

  ```md
  # Quality Bar (Definition of Done)

  ## Baseline Gates (always)

  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm test:unit`

  ## When E2E Is Required

  Run `pnpm test:e2e` when changes affect any of:

  - editor-shell UI interactions (selection, resize, properties panel)
  - editor-canvas behaviors (node rendering, hit testing, drag/resize)
  - cross-frame integration (shell <-> canvas iframe)

  ## Evidence

  - Prefer commands + deterministic expected output.
  - For E2E, attach the Playwright HTML report path (default `playwright-report/`) or trace on failures.

  ## Stop-ship Conditions

  - Crashes / hard errors in shell or canvas on normal flows
  - Data loss (undo/redo corruption, node disappearance)
  - Generated code mismatch vs editor rendering

  ## Notes

  - Product scope decisions are logged by PM. QA only enforces/verifies.
  ```

  - Path: `.claude/agent-memory/qa-engineer/test-plans.md`

  ```md
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

  - **Context**: Add missing style properties so Phase 1 gate is met.
  - **Scope (IN)**: new style inputs in properties panel as defined by PM issue.
  - **Scope (OUT)**: gradients, full redesign, sliders unless explicitly required.
  - **Risks**: number input commit strategy, undo grouping, missing data-testid selectors.
  - **Acceptance Criteria (binary)**:
    - Style edits persist and reflect on canvas.
    - Undo/redo restores committed values.
  - **Verification Commands**:
    - `pnpm test:unit`
    - `pnpm test:e2e`
  - **E2E Scenarios**:
    - Edit width/height inputs; verify canvas node style changes.
    - Type partial number then blur; verify commit strategy matches PM decision (cross-link).
  - **Cross-links**:
    - See PM decision: 2026-03-09: NumberInput UX 전략 -- Figma-style Hybrid (Option D)
  ```

  - Path: `.claude/agent-memory/qa-engineer/decisions.md`

  ```md
  # QA Decisions

  <!--
  Each decision:
  ## YYYY-MM-DD: [Decision title]
  - **Context**:
  - **Options**:
  - **Decision**:
  - **Rationale**:
  - **Impact**:
  - **Cross-links**: (PM decisions when product scope/priority is involved)
  -->

  ## 2026-03-10: Introduce QA memory + quality bar

  - **Context**: Need PM/QA roles that remember prior decisions and enforce quality gates across sessions.
  - **Options**:
    1. Ad-hoc prompting (no durable memory)
    2. File-backed memory under `.claude/agent-memory/qa-engineer/`
  - **Decision**: Option 2.
  - **Rationale**: Durable, greppable, versioned; matches existing PM/Designer pattern.
  - **Impact**: QA policies live in-repo and can be updated with decisions.
  ```

  - Path: `.claude/agent-memory/qa-engineer/regressions.md`

  ```md
  # Regressions

  <!--
  Each entry:
  ## YYYY-MM-DD: [Short title]
  - **Area**: shell | canvas | integration | codegen
  - **Repro Steps**:
  - **Expected**:
  - **Actual**:
  - **Evidence**: (logs, screenshot path, Playwright trace)
  - **Status**: open | mitigated | fixed (link to issue/PR)
  -->
  ```

  **Must NOT do**:
  - No duplication of PM backlog/roadmap into QA memory.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: memory templates + quality bar + logs
  - Skills: none

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3 | Blocked By: none

  **References**:
  - Pattern: `.claude/agent-memory/product-manager/MEMORY.md` — routing format + “Read first/Update immediately”
  - Pattern: `.claude/agent-memory/product-manager/decisions.md` — decision entry format
  - Pattern: `.claude/agent-memory/design-editor-ux-expert/MEMORY.md` — small memory set + cross-reference note
  - Test infra: `playwright.config.ts` — E2E runner setup
  - Test utility: `e2e/pom/EditorPage.ts` — E2E interaction patterns

  **Acceptance Criteria**:
  - [ ] `test -f .claude/agent-memory/qa-engineer/MEMORY.md`
  - [ ] `test -f .claude/agent-memory/qa-engineer/quality-bar.md`
  - [ ] `test -f .claude/agent-memory/qa-engineer/test-plans.md`
  - [ ] `test -f .claude/agent-memory/qa-engineer/decisions.md`
  - [ ] `test -f .claude/agent-memory/qa-engineer/regressions.md`
  - [ ] `grep -n "pnpm test:e2e" .claude/agent-memory/qa-engineer/quality-bar.md` finds a line describing when it is required

  **QA Scenarios**:

  ```
  Scenario: Memory index routes to existing files
    Tool: Bash
    Steps:
      1) node -e "import('node:fs').then((fs) => console.log(fs.readFileSync('.claude/agent-memory/qa-engineer/MEMORY.md','utf8')))"
      2) test -f .claude/agent-memory/qa-engineer/quality-bar.md
      3) test -f .claude/agent-memory/qa-engineer/test-plans.md
      4) test -f .claude/agent-memory/qa-engineer/decisions.md
      5) test -f .claude/agent-memory/qa-engineer/regressions.md
    Expected: all files exist; MEMORY.md contains links/names matching those files
    Evidence: .sisyphus/evidence/task-2-memory-files-exist.txt

  Scenario: Cross-link policy is present
    Tool: Bash
    Steps:
      1) grep -n "cross" .claude/agent-memory/qa-engineer/MEMORY.md || true
      2) grep -n "PM" .claude/agent-memory/qa-engineer/decisions.md
    Expected: decisions.md includes a section that says product-scope decisions are links to PM decisions
    Evidence: .sisyphus/evidence/task-2-cross-link-policy.txt
  ```

  **Commit**: NO (unless user explicitly requests)

- [ ] 3. Add a repo-local validator to enforce agent-memory wiring

  **What to do**:
  - Create `scripts/validate-claude-agents.mjs` (create `scripts/` directory if missing).
  - Validator rules (exact):
    - Support `--root <path>` (default: current working directory). All checks resolve from `<root>`.
    - Ensure `.claude/agents/qa-engineer.md` exists.
    - Ensure it contains `memory: project`.
    - Ensure `.claude/agent-memory/qa-engineer/MEMORY.md` exists.
    - Ensure `.claude/agent-memory/qa-engineer/MEMORY.md` references the 4 required files (quality-bar.md, test-plans.md, decisions.md, regressions.md).
    - Ensure each referenced file exists.
    - On success: print a single line `OK: qa-engineer memory wired` and exit 0.
    - On failure: print a single line starting with `ERROR:` and exit 1.

  **File Content (copy/paste)**:
  - Path: `scripts/validate-claude-agents.mjs`

  ```js
  import fs from "node:fs"
  import path from "node:path"

  function parseRootArg(argv) {
  	for (let i = 2; i < argv.length; i++) {
  		if (argv[i] === "--root" && argv[i + 1]) return argv[i + 1]
  	}
  	return null
  }

  function fail(msg) {
  	process.stdout.write("")
  	process.stderr.write(`ERROR: ${msg}\n`)
  	process.exit(1)
  }

  const rootArg = parseRootArg(process.argv)
  const root = path.resolve(rootArg ?? process.cwd())

  const agentPath = path.join(root, ".claude", "agents", "qa-engineer.md")
  const memoryDir = path.join(root, ".claude", "agent-memory", "qa-engineer")
  const memoryIndexPath = path.join(memoryDir, "MEMORY.md")

  if (!fs.existsSync(agentPath)) fail(`missing ${path.relative(root, agentPath)}`)
  const agentText = fs.readFileSync(agentPath, "utf8")
  if (!/^memory:\s*project\s*$/m.test(agentText)) {
  	fail(`qa-engineer must declare memory: project in ${path.relative(root, agentPath)}`)
  }

  if (!fs.existsSync(memoryIndexPath)) fail(`missing ${path.relative(root, memoryIndexPath)}`)
  const memoryIndexText = fs.readFileSync(memoryIndexPath, "utf8")

  const required = ["quality-bar.md", "test-plans.md", "decisions.md", "regressions.md"]
  for (const file of required) {
  	if (!memoryIndexText.includes(file)) {
  		fail(`MEMORY.md must reference ${file}`)
  	}
  	const full = path.join(memoryDir, file)
  	if (!fs.existsSync(full)) {
  		fail(`missing ${path.relative(root, full)}`)
  	}
  }

  process.stdout.write("OK: qa-engineer memory wired\n")
  process.exit(0)
  ```

  **Must NOT do**:
  - Do not add CI wiring in this task (keep local + lightweight).

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small Node script
  - Skills: none

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4 | Blocked By: 1, 2

  **References**:
  - Existing patterns: `.claude/agents/product-manager.md` + `.claude/agent-memory/product-manager/MEMORY.md`

  **Acceptance Criteria**:
  - [ ] `node scripts/validate-claude-agents.mjs`
  - [ ] The command outputs `OK: qa-engineer memory wired`

  **QA Scenarios**:

  ```
  Scenario: Validator passes on correct wiring
    Tool: Bash
    Steps:
      1) node scripts/validate-claude-agents.mjs
    Expected: exit 0; prints OK line
    Evidence: .sisyphus/evidence/task-3-validator-ok.txt

  Scenario: Validator fails when a required file is missing
    Tool: Bash
    Steps:
      1) tmp=$(mktemp -d)
      2) cp -R .claude "$tmp/.claude"
      3) rm -f "$tmp/.claude/agent-memory/qa-engineer/quality-bar.md"
      4) node scripts/validate-claude-agents.mjs --root "$tmp"; status=$?
      5) rm -rf "$tmp"; exit $status
    Expected: exit 1; prints ERROR line mentioning quality-bar.md (without mutating the repo)
    Evidence: .sisyphus/evidence/task-3-validator-missing-file.txt
  ```

  **Commit**: NO (unless user explicitly requests)

- [ ] 4. Optional: PM->QA handoff rule (cross-link only, no process overhaul)

  **What to do**:
  - Make a minimal addition to `.claude/agents/product-manager.md` describing:
    - When to ask QA for a test plan (before promoting a risky item to ready; before declaring done).
    - Where QA plans live (`.claude/agent-memory/qa-engineer/test-plans.md`).
    - Cross-link convention between PM decisions and QA decisions.
  - Keep changes additive and small; do not rewrite existing PM operating model.

  **Suggested addition (copy/paste)**:
  - Target: `.claude/agents/product-manager.md`
  - Insert as a new section near "How to operate" (exact text):

  ```md
  ## Working with QA

  - For any risky UI/editor change, ask `qa-engineer` for a test plan before declaring "done".
  - QA test plans live in `.claude/agent-memory/qa-engineer/test-plans.md`.
  - Product decisions (scope/priority) stay in PM decisions (`.claude/agent-memory/product-manager/decisions.md`).
    QA decisions should cross-link rather than duplicate.
  ```

  **Must NOT do**:
  - Do not change backlog/issue workflow rules.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: small policy addition
  - Skills: none

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: none | Blocked By: 1

  **References**:
  - `.claude/agents/product-manager.md` — existing PM operating rules
  - `.claude/agent-memory/product-manager/decisions.md` — cross-link target

  **Acceptance Criteria**:
  - [ ] `grep -n "qa-engineer" .claude/agents/product-manager.md` finds at least one mention
  - [ ] `node scripts/validate-claude-agents.mjs` still passes

  **QA Scenarios**:

  ```
  Scenario: PM doc references QA plan location
    Tool: Bash
    Steps:
      1) grep -n "\.claude/agent-memory/qa-engineer/test-plans\.md" .claude/agents/product-manager.md
    Expected: grep finds exactly one or more matches
    Evidence: .sisyphus/evidence/task-4-pm-handoff.txt

  Scenario: Repo quality gates still pass
    Tool: Bash
    Steps:
      1) pnpm lint
      2) pnpm type-check
    Expected: both commands exit 0
    Evidence: .sisyphus/evidence/task-4-quality-gates.txt
  ```

  **Commit**: NO (unless user explicitly requests)

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real QA/Dogfood (role behavior) — unspecified-high
- [ ] F4. Scope Fidelity Check (no Symphony, no external memory) — deep

## Commit Strategy

- Default: no commits unless the user explicitly asks for commits.
- If asked to commit: 2 commits max
  - `docs(agents): add qa-engineer role + memory scaffolding`
  - `chore(agents): add validator for agent-memory wiring`

## Success Criteria

- QA role exists and has durable, discoverable memory files.
- Quality bar + test plan templates are in one place and referenced by the role.
- Wiring is enforceable with a simple validator script.
