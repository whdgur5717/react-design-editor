# Packages

## Architecture Invariants

These are fixed architectural decisions. Do NOT violate or work around them. If a task seems to require breaking one, stop and confirm with the user before proceeding.

1. **Shell/Canvas iframe separation**: Canvas only renders inside an iframe for CSS/JS isolation. Never remove or bypass the iframe boundary.

2. **No event handlers in Canvas**: Canvas is a pure renderer. Pointer/keyboard events are captured by Shell's `canvas-event-target`. Never add `onClick`, `onMouseDown`, etc. to Canvas components.

3. **Unidirectional data flow**: Shell's Zustand store is the single source of truth. Shell mutates state, then pushes to Canvas via `syncState()`. Canvas never mutates the store or requests state changes from Shell.

4. **State changes via Commands only**: Document mutations from user actions must go through the Command pattern. Direct store mutation breaks undo/redo.

See `spec.md` for detailed architecture and extension points.
