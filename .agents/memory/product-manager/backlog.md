# Feature Backlog

> **Current Phase: Phase 1 -- Core Editing**

## Prioritization Criteria

- P0 = capability gap: without this, users cannot construct certain layouts or styles
- P1 = efficiency gap: users can do it, but significantly slower or more painfully
- P2 = nice to have, not required for the current phase gate

## Current State Summary

**What works today:**

- Node creation: Frame, Text, Code Component instances
- Selection: click, shift-click multi-select
- Movement and resize: drag to move root nodes, 8-handle resize, arrow key nudge
- Styling: full properties-panel style coverage for common static UI construction
- Organization: layers panel, pages, reorder, lock, visibility
- Code generation: element, text, and instance nodes
- History: undo/redo
- Canvas: zoom and pan

## P0 -- Must complete for Phase 1

- None open

## Recently Shipped

### 1. Properties Panel: Full Style Coverage

- **WHY**: The properties panel was missing many common CSS properties, so users could not construct many real-world UI layouts.
- **Status**: shipped -> #94

## P1 -- Current next priority

### 2. Copy / Paste

- **WHY**: Core editing baseline. Without it, reuse is too slow.
- **Status**: ready -> #95

### 3. Drag-to-Create with Custom Size

- **WHY**: Improves speed and precision but is not a capability blocker.
- **Status**: ready -> #96

### 4. Shape Tool Implementation

- **WHY**: Toolbar exposes a shape tool but it has no real implementation.
- **Status**: proposed

### 5. Alignment & Distribution

- **WHY**: Manual alignment is too tedious for a design tool.
- **Status**: proposed

### 6. Image Element Support

- **WHY**: Realistic layouts need images.
- **Status**: proposed, but blocked by image server/infrastructure decision

### 7. Group / Ungroup

- **WHY**: Multi-element manipulation is clunky without grouping.
- **Status**: proposed

### 8. Multi-Select Resize & Move

- **WHY**: Multi-select is incomplete without meaningful batch transforms.
- **Status**: proposed

### 9. Context Menu

- **WHY**: Improves discoverability of common actions.
- **Status**: proposed

## P2 -- Later

- Gradient Fills
- Transform / Rotation
- Responsive Preview

## Ice Box

- Smart Guides & Snapping
- Constraints (Responsive Pinning)
- Auto Layout Detection
- Keyboard Shortcut Customization
- Canvas Grid / Ruler
- Multi-Page Code Export
