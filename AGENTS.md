# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-12 Asia/Seoul
**Commit:** `558f89a`
**Branch:** `main`

## OVERVIEW

monorepo for building a Design Editor SDK, its editor runtime packages, and a demo consumer.

## STRUCTURE

```text
.
|- packages/            # public SDK package, editor-* runtime packages, and demo consumer
|- config/              # shared ESLint and TS config packages
|- e2e/                 # Playwright fixture + page object + specs
|- docs/                # architecture, deployment, plans, reports
|- .github/workflows/   # CI, deploy, AI automation
```

## NOTES

- `packages/sdk` is the public SDK entry package and export surface.
- `packages/editor-*` packages are SDK runtime packages split by responsibility, not standalone product apps.
- `packages/demo` is the SDK consumer app for demo.
