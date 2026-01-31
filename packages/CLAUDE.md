# Packages

## Utilities

Use `es-toolkit` for common operations (isEqual, cloneDeep, debounce, etc).

## TypeScript

Avoid type assertions (`as`, `any`, `as unknown as`). Omit return types when inference is sufficient.

When a type error occurs, analyze why the types don't match and fix the type definitions or logic accordingly.

### Type as Single Source of Truth

- Treat TypeScript types as the authoritative contract for domain rules; avoid duplicating value lists manually.
- Prefer existing platform/library types (e.g., React's `CSSProperties`) to inherit the canonical value set and auto‑update when upstream specs change.
- The goal is to block invalid input at compile time, not to patch errors at runtime.
- Not everything must share one source: if a runtime value space intentionally diverges from the platform spec (e.g., design tokens, product-level enums), document the split and keep the custom type local to that boundary.

Example: constrain cursor values without hand‑maintaining a union.

```ts
import type { CSSProperties } from "react"

// Accept only standard CSS cursor tokens; stays in sync with React's DOM types.
type Cursor = CSSProperties["cursor"]

function applyCursor(cursor: Cursor) {
	document.body.style.cursor = cursor
}
```
