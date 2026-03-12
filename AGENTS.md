# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-12 Asia/Seoul
**Commit:** `558f89a`
**Branch:** `main`

## OVERVIEW

Design editor monorepo. Shell owns state, events, commands, and UI; Canvas renders inside an iframe and only answers RPC from Shell.

Primary guidance lives in `CLAUDE.md`. Package-level invariants live in `packages/CLAUDE.md` and `packages/AGENTS.md`.

## STRUCTURE

```text
.
|- packages/            # editor runtime and shared packages
|- config/              # shared ESLint and TS config packages
|- e2e/                 # Playwright fixture + page object + specs
|- docs/                # architecture, deployment, plans, reports
|- .github/workflows/   # CI, deploy, AI automation
|- .claude/             # Claude-specific adapters and settings
|- .codex/              # Codex-specific adapters and config
`- .agents/             # shared AI skills, memory, and role prompts
```

## WHERE TO LOOK

| Task                          | Location                          | Notes                          |
| ----------------------------- | --------------------------------- | ------------------------------ |
| Repo commands and conventions | `CLAUDE.md`                       | Root source of truth           |
| Cross-package architecture    | `packages/AGENTS.md`              | Shell/Canvas/Core relationship |
| Shell architecture            | `packages/editor-shell/AGENTS.md` | Main runtime boundary          |
| Deployment details            | `docs/deployment.md`              | Cross-origin deployment        |

## CONVENTIONS

- pnpm workspace only; packages live under `packages/*` and `config/*`
- Formatting is non-default: tabs, double quotes, no semicolons, `printWidth: 120`
- Type-checking runs through `tsgo --noEmit`, not `tsc`
- React versions come from workspace catalog entries
- Tests use Korean descriptions; unit tests are `*.test.ts`, E2E tests are `*.spec.ts`

## ANTI-PATTERNS (THIS PROJECT)

- Do not bypass the Shell/Canvas iframe split
- Do not add pointer or keyboard handlers inside Canvas-rendered components
- Do not mutate editor state from UI code without going through commands or store APIs that the architecture already owns

## UNIQUE STYLES

- `packages/` is the real product code; `.claude/`, `.codex/`, and `.agents/` are support systems, not app runtime
- Portable AI assets live in `.agents/`; `.claude/` and `.codex/` should stay thin platform adapters
- Claude-only custom commands should be mirrored as shared skills when Codex needs the same workflow
- Deploy flow is two-step: Canvas first, then Shell with `VITE_CANVAS_URL` injected

## COMMANDS

```bash
pnpm install
pnpm dev
pnpm build
pnpm build:shell
pnpm build:canvas
pnpm lint
pnpm type-check
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm format
```

## NOTES

- Shell dev server is `:3000`; Canvas dev server is `:3001`
- Root `pnpm dev` starts both apps in parallel
- `packages/spec.md` is the detailed architecture reference when high-level docs are not enough
