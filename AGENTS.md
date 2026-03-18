# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-12 Asia/Seoul
**Commit:** `558f89a`
**Branch:** `main`

## OVERVIEW

monorepo for making Design editor product.

## STRUCTURE

```text
.
|- packages/            # feature about editor (runtime and shared packages)
|- config/              # shared ESLint and TS config packages
|- e2e/                 # Playwright fixture + page object + specs
|- docs/                # architecture, deployment, plans, reports
|- .github/workflows/   # CI, deploy, AI automation
|- .claude/             # Claude-specific adapters and settings
|- .codex/              # Codex-specific adapters and config
`- .agents/             # shared AI skills, memory, and role prompts
```

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
- Edit permission gate: do not modify files unless the user explicitly asks for the edit in the current conversation; analysis-only requests stay read-only
