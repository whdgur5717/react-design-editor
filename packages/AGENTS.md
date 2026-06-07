# PACKAGES KNOWLEDGE BASE

**Generated:** 2026-03-30 Asia/Seoul
**Commit:** `a4e0b8f`
**Branch:** `99-scroll-jitter-ux-mitigation`

## OVERVIEW

`packages/` contains the public SDK package, SDK runtime modules, and SDK demo app.

## TERMINOLOGY

- `shell`: editor control runtime. It owns editor state, editing intent, command flow, tools, panels, overlays, and user interaction handling.
- `canvas`: editor rendering runtime. It turns editor documents into visible output and provides rendered geometry back to the editor runtime.
- `overlay`: editor-only control layer rendered above the canvas output. It represents editing affordances such as selection, hover, resize, drag preview, and interaction targets without becoming part of the document output.

`shell`, `canvas`, and `overlay` are responsibility terms inside the SDK runtime. They do not mean standalone product apps.

## RUNTIME MODEL

The SDK separates editor output from editor control.

The canvas renders the editor document as visible DOM/React output. This output is isolated in a Shadow DOM environment so canvas styles, registered component styles, and host application styles do not accidentally depend on each other.

The canvas output is the document result, not the primary editor interaction layer. Editor-only controls are rendered above the canvas as overlay, so selection, hover, resize, drag preview, and interaction targets do not become part of the document output.

Canvas output may avoid receiving pointer events directly. Editor input can be handled by the control layer above the rendered document instead.

The canvas reports rendered geometry back to the editor runtime. The shell uses that geometry to align overlays and interpret interactions against what the user actually sees.

## STRUCTURE

```text
packages/
|- sdk/                # public SDK package
|- demo/               # demo app for SDK usage
|- editor-core/        # shared module for editor, e.g. model, schema, types
|- editor-components/  # shared component module for editor
|- editor-canvas/      # editor canvas runtime, renders document as visible canvas output
`- editor-shell/       # editor control runtime, e.g. state, commands, interaction, panels, overlays
```

## WHERE TO LOOK

| Task                    | Location             |
| ----------------------- | -------------------- |
| Public SDK package      | `sdk/`               |
| SDK usage demo          | `demo/`              |
| Shared editor module    | `editor-core/`       |
| Shared component module | `editor-components/` |
| Editor canvas runtime   | `editor-canvas/`     |
| Editor control runtime  | `editor-shell/`      |

## CODE ORGANIZATION RULES

- Do not add meaningless barrel files or convenience re-export layers.
- Re-export is allowed only from the single package entry file prepared for SDK packaging, such as `src/index.ts` or `src/index.tsx`.
- Internal code should import directly from the module that owns the implementation.
- Public exports must be intentional package surface decisions, not a default pattern for every folder.
