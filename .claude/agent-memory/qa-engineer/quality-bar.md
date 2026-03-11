# Quality Bar (Definition of Done)

## Baseline Gates (always)

- `pnpm lint`
- `pnpm type-check`
- `pnpm test:unit`

## When E2E Is Required

Run `pnpm test:e2e` when changes affect any of:

- editor-shell UI interactions (selection, resize, properties panel)
- editor-canvas behaviors (node rendering, hit testing, drag or resize)
- cross-frame integration (shell <-> canvas iframe)

## Evidence

- Prefer commands plus deterministic expected output.
- For E2E, attach the Playwright HTML report path (default `playwright-report/`) or trace on failures.

## Stop-Ship Conditions

- Crashes or hard errors in shell or canvas on normal flows
- Data loss (undo or redo corruption, node disappearance)
- Generated code mismatch versus editor rendering

## Notes

- Product scope decisions are logged by PM. QA only enforces and verifies.
