# QA Memory Index

## Files

| File                             | Purpose                            |
| -------------------------------- | ---------------------------------- |
| [quality-bar.md](quality-bar.md) | Quality gates / Definition of Done |
| [test-plans.md](test-plans.md)   | Test plan ledger                   |
| [regressions.md](regressions.md) | Regression repro ledger            |
| [decisions.md](decisions.md)     | QA decision log                    |

## Routing

- **"Is this change done?"** -> `quality-bar.md`
- **"Write a test plan"** -> `test-plans.md`
- **"Repro a bug"** -> `regressions.md`
- **"Did we decide this already?"** -> `decisions.md` (and cross-link to PM decisions when product scope is involved)

## Cross-link Policy

- Product scope and priority decisions live in PM memory: `.claude/agent-memory/product-manager/decisions.md`.
- QA memory stores only a link in this form: `See PM decision: YYYY-MM-DD: Title`.

## Test Infra Pointers

- Unit tests: `pnpm test:unit` (Vitest)
- E2E tests: `pnpm test:e2e` (Playwright) using `playwright.config.ts`
- E2E helpers: `e2e/fixtures.ts`, `e2e/pom/EditorPage.ts`
