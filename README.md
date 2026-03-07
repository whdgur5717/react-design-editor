# Symphony Design Editor

A DOM/React-based visual design editor that renders actual React components directly—what you see in the editor becomes the actual React code. No conversion step, no AI translation, no loss of design intent.

**[Live Demo](https://design-editor-shell.pages.dev)**

## Why Symphony?

Traditional design tools like Figma require a separate translation step to convert designs into code. Symphony eliminates this gap by building a design editor where **visual editing IS code editing**. The editor renders real React components, so the design and code are the same thing.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
# Run both Shell (port 3000) & Canvas (port 3001) in parallel
pnpm dev

# Or run individually
cd packages/editor-shell && pnpm dev   # Shell at http://localhost:3000
cd packages/editor-canvas && pnpm dev  # Canvas at http://localhost:3001
```

### Code Quality

```bash
pnpm format      # Format with Prettier
pnpm lint        # Lint all packages
pnpm type-check  # TypeScript check all packages
```

### Testing

```bash
npx vitest           # Watch mode
npx vitest run       # Single run
npx playwright test  # E2E tests
```

### Production Build

```bash
pnpm build  # Build to dist/
```

## Project Structure

This is a pnpm monorepo with the following packages:

```
packages/
├── editor-core/        # Shared types (SceneNode, EditorState) & codegen
├── editor-shell/       # Main shell app (Vite, port 3000) - toolbar, panels, state
├── editor-canvas/      # Canvas iframe app (Vite, port 3001) - renders nodes
├── editor-components/  # Component registry (maps node types → React components)
└── figma-plugin/       # (Legacy) Originally started as Figma plugin

config/
├── eslint-config/      # Shared ESLint flat config
└── tsconfig/           # Shared TypeScript base config
```

## Architecture

### Key Concepts

- **Shell**: Main application handling state management, user interactions, toolbar, and panels
- **Canvas**: Pure renderer running in an iframe, renders the actual React components
- **One-way data flow**: Shell mutates state and pushes to Canvas; Canvas never mutates state

### Data Model

```
DocumentNode (root)
 └── PageNode[] (workspaces/artboards)
      └── SceneNode[] (visual nodes)
           ├── ElementNode (HTML: div, span, etc.)
           ├── InstanceNode (component instance)
           └── TextNode (rich text)
```

For detailed architecture, see `packages/spec.md`.

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Build commands and coding conventions |
| [packages/spec.md](./packages/spec.md) | Detailed architecture specification |
| [docs/architecture-flow.md](./docs/architecture-flow.md) | Visual flow diagrams |
| [docs/deployment.md](./docs/deployment.md) | Deployment guide |

## License

MIT
