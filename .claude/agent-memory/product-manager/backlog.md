# Feature Backlog

> **Current Phase: Phase 1 -- Core Editing**

## Prioritization Criteria

P0 = "without this, users CANNOT construct certain layouts or styles" (capability gap).
P1 = "without this, users CAN do it but it's significantly harder or slower" (efficiency gap).
P2 = nice to have, not required for Phase 1 gate.

---

## Current State Summary

**What works today:**

- Node creation: Frame (click-to-create), Text (click-to-create), Code Component instances
- Selection: Click, shift-click multi-select
- Movement: Drag to move root nodes, arrow key nudge, drag-to-reparent
- Resize: 8-handle resize on selection
- Styling: Size, display/flex layout, CSS position, overflow, padding (single value), margin (single value), background color, border (width/radius/color/style), typography (size/weight/color/align)
- Organization: Layer panel with visibility toggle, lock, reorder (drag), pages
- Code generation: ElementNode JSX, TextNode text extraction, InstanceNode JSX
- History: Undo/redo
- Canvas: Zoom (ctrl+wheel), pan (wheel)
- Shortcuts: Undo, redo, delete, duplicate, select all, tool switching

---

## P0 -- Must complete for Phase 1

### 1. Properties Panel: Full Style Coverage

- **WHY**: The properties panel is missing many common CSS properties. Users cannot set per-side spacing, opacity, box-shadow, per-corner border-radius, min/max dimensions, extended typography, or flex child properties. Without these, users cannot construct real-world UI layouts in the editor.
- **Status**: proposed
- **Full spec**: See below (Properties Panel Spec)

---

## P1 -- Next priority after P0

### 3. Copy / Paste

- **WHY**: Copy and paste is one of the most fundamental editing operations. Without it, users must duplicate in place and then move, or recreate elements from scratch. This is a baseline expectation in any editor.
- **User story**: As a user, I want to copy selected elements and paste them (on the same page or a different page) so that I can efficiently reuse layout structures.
- **Success criteria**:
  - Cmd+C copies the selected node(s) to an internal clipboard
  - Cmd+V pastes the copied node(s) at a sensible position (offset from original, or at cursor position)
  - Pasting works across pages
  - Cut (Cmd+X) removes the original after copying
  - Pasted nodes get new unique IDs (no ID conflicts)
- **Scope**:
  - IN: Copy, cut, paste within the editor; cross-page paste
  - OUT: Paste from external sources (e.g., pasting HTML from browser), paste as image
- **Status**: proposed

---

### 4. Drag-to-Create with Custom Size

- **WHY**: Currently Frame and Text tools create elements at a fixed default size on click. Users cannot draw a rectangle to define the initial size. This makes layout construction slower -- users must always create then resize -- but it is not a capability blocker.
- **User story**: As a user, I want to click and drag on the canvas to create a new frame (or text box) whose size matches the area I drew, so that I can place elements precisely without a separate resize step.
- **Success criteria**:
  - Click-and-drag with Frame tool creates a frame matching the drawn rectangle
  - Click-and-drag with Text tool creates a text box matching the drawn rectangle
  - Click without drag still creates a default-sized element (backward compatible)
- **Scope**:
  - IN: Frame tool, Text tool
  - OUT: Shape tool (separate item)
- **Status**: proposed

---

### 5. Shape Tool Implementation

- **WHY**: The toolbar shows a Shape tool (circle icon, shortcut "R") but it has no implementation. Users expect to create basic shapes like rectangles and ellipses. However, rectangles can be approximated with Frames, so this is efficiency/completeness, not a hard blocker.
- **User story**: As a user, I want to draw basic shapes (rectangle, ellipse) on the canvas so that I can create visual elements like icons, decorations, and background shapes.
- **Success criteria**:
  - Shape tool creates a rectangle by default
  - Option to create an ellipse (e.g., hold Shift, or a sub-menu)
  - Shapes are ElementNodes with appropriate styling (border-radius: 50% for ellipse)
  - Shapes support all styling properties (fill, border, shadow, opacity)
  - Shapes appear correctly in generated code
- **Scope**:
  - IN: Rectangle, ellipse
  - OUT: Polygon, star, line, arrow, custom vector paths
- **Status**: proposed

---

### 6. Alignment & Distribution

- **WHY**: Manually positioning elements to be visually aligned is tedious and imprecise. Every design tool provides alignment and distribution controls. Without these, constructing clean layouts takes much longer than it should -- but it is still possible via manual positioning.
- **User story**: As a user, I want to align or distribute multiple selected elements so that I can create visually precise layouts quickly.
- **Success criteria**:
  - When 2+ root-level nodes are selected, alignment buttons appear (in toolbar or properties panel)
  - Align left/center/right/top/middle/bottom works correctly
  - Distribute horizontally/vertically with equal spacing works correctly
  - Alignment is undoable
- **Scope**:
  - IN: 6 alignment options, 2 distribution options, root-level nodes only
  - OUT: Align to parent/artboard, smart spacing guides, auto-alignment on drag
- **Status**: proposed

---

### 7. Image Element Support

- **WHY**: Images are a core building block of any UI. Currently there is no way to add an image to the canvas. Without image support, users cannot construct realistic page layouts (hero sections, cards with images, avatars, etc.).
- **User story**: As a user, I want to add images to the canvas (by URL or file upload) so that I can create realistic UI layouts with visual content.
- **Success criteria**:
  - User can create an image element on the canvas
  - Image can be set via URL input or file upload (stored as data URL or blob URL)
  - Image element has standard styling (size, border-radius, opacity, object-fit)
  - Image renders in generated code as `<img src="..." />` with appropriate attributes
- **Scope**:
  - IN: Image element on canvas, URL and file upload, basic img styling, code generation
  - OUT: SVG inline editing, video elements, asset library/management
- **Status**: proposed

---

### 8. Group / Ungroup

- **WHY**: Users need to treat a set of elements as a single unit for moving, resizing, and organizing. Currently the only container is a Frame (div), but creating a frame and manually reparenting elements into it is clunky. Group/Ungroup is a standard shortcut in every design tool.
- **User story**: As a user, I want to group selected elements so I can move and transform them as a single unit, and ungroup them to edit individually again.
- **Success criteria**:
  - Cmd+G groups selected elements into a new parent container
  - Cmd+Shift+G ungroups (moves children back to the group's parent and removes the group node)
  - Groups are just ElementNodes (divs) -- no new node type needed
  - Group/ungroup is undoable
- **Scope**:
  - IN: Group, ungroup, keyboard shortcuts
  - OUT: Boolean operations, flatten, component creation from group
- **Status**: proposed

---

### 9. Multi-Select Resize & Move

- **WHY**: When multiple elements are selected, users expect to move or resize them all at once. Currently, drag-to-move works for single nodes only. Multi-select is incomplete without batch operations.
- **User story**: As a user, I want to move or resize multiple selected elements together so that I can efficiently rearrange parts of my layout.
- **Success criteria**:
  - Dragging with multiple nodes selected moves all of them by the same delta
  - Resizing with multiple nodes selected scales all of them proportionally
  - Arrow key nudge works on all selected nodes (currently only works on root nodes)
- **Scope**:
  - IN: Multi-move, multi-nudge
  - OUT: Multi-resize (can be deferred -- it's complex and less frequently needed)
- **Status**: proposed

---

### 10. Context Menu

- **WHY**: Right-click context menus provide quick access to common operations (copy, paste, duplicate, delete, group, lock, hide) without requiring users to remember keyboard shortcuts. It's a standard interaction pattern that improves discoverability of features.
- **User story**: As a user, I want to right-click on the canvas or a selected element to see a context menu with relevant actions, so that I can quickly perform operations without memorizing shortcuts.
- **Success criteria**:
  - Right-click on a node shows a context menu with: Copy, Paste, Duplicate, Delete, Group/Ungroup, Lock/Unlock, Hide/Show, Move to front/back
  - Right-click on empty canvas shows: Paste, Select All
  - Menu items are disabled when not applicable (e.g., "Paste" when clipboard is empty)
- **Scope**:
  - IN: Context menu with common operations
  - OUT: Custom menu items, plugin-provided menu entries
- **Status**: proposed

---

## P2 -- Later

### 11. Gradient Fills

- **WHY**: Gradients are a common design element. Currently only solid background colors are supported. While not strictly required for "any layout," many modern UIs use gradients extensively.
- **User story**: As a user, I want to apply linear or radial gradient backgrounds to elements so that I can create visually rich designs.
- **Success criteria**:
  - User can switch between solid and gradient fill
  - Linear gradient: set direction, add/remove color stops
  - Values appear correctly in generated code (CSS `linear-gradient()`)
- **Scope**:
  - IN: Linear gradient with color stops
  - OUT: Radial gradient, conic gradient, mesh gradient
- **Status**: proposed

---

### 12. Transform / Rotation

- **WHY**: Rotation is used in decorative elements and some layout patterns. Not critical for most UI layouts, but expected in a full-featured design tool.
- **User story**: As a user, I want to rotate an element to a specific angle so that I can create angled decorations or rotated text.
- **Success criteria**:
  - Rotation input in properties panel
  - Rotation handle on selected element (drag to rotate)
  - Rotation appears in generated code as CSS `transform: rotate()`
- **Scope**:
  - IN: Rotation via properties panel and handle
  - OUT: Skew, 3D transforms, perspective
- **Status**: proposed

---

### 13. Responsive Preview

- **WHY**: Users building UI will want to see how their design looks at different viewport sizes. This is not a layout construction feature, but it significantly helps validate layouts.
- **User story**: As a user, I want to preview my design at different screen widths (mobile/tablet/desktop) so that I can validate that my layout works across devices.
- **Success criteria**:
  - Preset viewport sizes available (e.g., 375px, 768px, 1440px)
  - Custom viewport width input
  - Canvas content reflows according to viewport width
- **Scope**:
  - IN: Viewport width presets, custom width
  - OUT: Breakpoint-based conditional styles, responsive layout editing
- **Status**: proposed

---

## Ice Box -- Good ideas, not now

### Smart Guides & Snapping

Visual guides that appear when dragging elements near alignment with other elements. Important for precision but requires significant coordinate math.

### Constraints (Responsive Pinning)

Figma-style constraints that pin edges to parent. Requires a constraint model and affects both rendering and code generation.

### Auto Layout Detection

Automatically suggest flex layout when user arranges elements in a row/column pattern. AI-assisted, complex heuristics.

### Keyboard Shortcut Customization

Allow users to remap keyboard shortcuts. Nice to have, not core editing.

### Canvas Grid / Ruler

Visual grid overlay and rulers on canvas edges. Helps with precision but not required for layout construction.

### Multi-Page Code Export

Export all pages as a set of React component files with routing. Depends on Phase 3 of the code component roadmap.
