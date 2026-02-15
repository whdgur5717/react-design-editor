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
