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

- Prefer executable commands and deterministic expected results.
- For E2E, include the Playwright HTML report path or trace when available.

## Stop-Ship Conditions

- Crashes or hard errors in shell or canvas during normal flows
- Data loss (undo or redo corruption, node disappearance)
- Generated code mismatch versus editor rendering
