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

## Design System (PandaCSS)

PandaCSS: 빌드타임 CSS-in-JS. 정적 분석으로 atomic CSS 생성.

### 패키지 구조

```
theme (토큰/유틸리티 정의)
    │
    ├─→ ui (UI 컴포넌트)
    │
    └─→ editor-shell, editor-canvas (앱)
```

- `theme`: 토큰 정의 (`preset.ts`), CSS 유틸리티 생성. 모노레포 전체에서 공유.
- `ui`: UI 컴포넌트. theme 소비.
- `editor-shell`, `editor-canvas`: 각 앱. `importMap`으로 theme 참조, 로컬에 styled-system/ 생성.

각 앱이 로컬 styled-system/을 생성하는 이유: PandaCSS는 정적 분석 기반이라 각 앱 코드를 스캔해서 CSS를 생성해야 함.

### 자동 생성 파일 (직접 수정 금지)

- `packages/theme/css/`, `tokens/`, `patterns/`
- `packages/editor-shell/styled-system/`
- `packages/editor-canvas/styled-system/`

토큰 변경: `theme/preset.ts` 수정 → `panda codegen`
