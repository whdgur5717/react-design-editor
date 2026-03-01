# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development
cd packages/editor-shell && pnpm dev  # Shell UI at :3000
cd packages/editor-canvas && pnpm dev # Canvas iframe at :3001

# Code quality
pnpm format                           # Format with Prettier
pnpm lint                             # Lint all packages
pnpm type-check                       # TypeScript check all packages

# Production build
pnpm build                            # Build to dist/

# Tests
npx vitest                            # Run tests (vitest/**/*.test.ts)
npx vitest run                        # Single test run
```

## Architecture Overview

This is a **DOM/React-based design editor**. The editor renders React components directly—what you see in the editor becomes the actual React code.

### Package Structure (pnpm monorepo)

```
packages/
├── editor-core/        # Shared types (SceneNode, EditorState) & codegen
├── editor-components/  # Component registry (maps node types → React components)
├── editor-canvas/      # Canvas iframe app (Vite, port 3001) - renders nodes
├── editor-shell/       # Main shell app (Vite, port 3000) - toolbar, panels, state
└── figma-plugin/       # (Legacy) Originally started as Figma plugin, currently unused

config/
├── eslint-config/      # Shared ESLint flat config
└── tsconfig/           # Shared TypeScript base config (strict mode)
```

For detailed architecture, see `packages/spec.md`.

## Coding Conventions

- **Utilities**: Use `es-toolkit` for common operations (isEqual, cloneDeep, debounce, etc).
- **No re-exports**: Don't re-export external libraries. Consumers import from the original package directly.
- **No barrel files**: Don't create `index.ts` that re-exports everything. Import from specific modules.
- **TypeScript**: Avoid `as`, `any`, `as unknown as`. Let inference work; annotate only when inference is insufficient. Prefer `satisfies` for compile-time validation without widening. Fix type errors at the type definition level, not with assertions.

## Testing Conventions

- **파일 네이밍**: E2E 테스트는 `*.spec.ts`, 그 외 단위/통합 테스트는 `*.test.ts`
- **테스트 설명은 한글로 작성**: 개발자가 아닌 이해관계자도 이해할 수 있도록, 무엇을 검증하는지를 서술한다. 구현 디테일(함수명, 내부 로직 등)은 포함하지 않는다.

```ts
// Good
describe("노드 선택", () => {
  it("캔버스에서 노드를 클릭하면 선택 상태가 된다", () => { ... })
  it("선택된 노드 바깥을 클릭하면 선택이 해제된다", () => { ... })
})

// Bad
describe("handleNodeClick", () => {
  it("sets selectedNodeId in zustand store", () => { ... })
})
```
