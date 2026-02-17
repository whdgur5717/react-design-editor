# Packages

## Exports & Module Boundaries

모듈이 실제로 제공하는 고유한 값만 export한다.

- **Re-export 금지**: 외부 라이브러리를 그대로 re-export하지 않는다. 소비자가 원본 패키지에서 직접 import하면 된다.
- **Barrel 파일 최소화**: `index.ts`에 모든 것을 모아 re-export하는 barrel 패턴을 만들지 않는다. 소비자가 필요한 모듈을 직접 import한다.
- **판단 기준**: "이 export를 제거하면 소비자가 원본에서 직접 가져올 수 있는가?" — 그렇다면 re-export할 이유가 없다.

## Utilities

Use `es-toolkit` for common operations (isEqual, cloneDeep, debounce, etc).

## TypeScript

Avoid type assertions (`as`, `any`, `as unknown as`).

### Let Inference Work

Annotate types only when inference is insufficient or misleading:

- **Annotate** when the inferred type is wider/different than the intended domain type, or when the compiler requires it (e.g., recursive functions).
- **Omit** when inference already produces the correct type—this includes React component return types and straightforward expressions.
- The same rule applies to variables: don't annotate what the compiler already knows.
- When you need compile-time validation without widening the inferred type, prefer `satisfies`.

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
