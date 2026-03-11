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
- **"Did we decide this already?"** -> `decisions.md`

## Rules

- Read this file first, then route to the right QA memory file before answering.
- Update memory immediately when a new QA decision, regression, or test plan is created.
- If a decision is really about scope or priority, store only a cross-link instead of duplicating it as QA policy.

## Test Infra Pointers

- Unit tests: `pnpm test:unit` (Vitest)
- E2E tests: `pnpm test:e2e` (Playwright)
- E2E helpers: `e2e/fixtures.ts`, `e2e/pom/EditorPage.ts`
