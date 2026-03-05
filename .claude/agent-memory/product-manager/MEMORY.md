# PM Memory Index

## Files

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| [product.md](product.md)     | Product definition, vision, user understanding |
| [roadmap.md](roadmap.md)     | Product roadmap (Phase-level direction)        |
| [backlog.md](backlog.md)     | Prioritized feature backlog                    |
| [decisions.md](decisions.md) | Product decision log                           |

## Routing

- **"What should we build next?"** -> Check roadmap.md for current Phase -> backlog.md for priorities
- **Proposing a feature** -> Check product.md for vision alignment -> Add to backlog.md
- **Feature shipped** -> Update backlog.md status -> Update product.md -> Check roadmap.md Phase progress
- **Product direction discussion** -> Read product.md + roadmap.md
- **Previous decisions** -> Read decisions.md
- **Re-prioritize** -> Use roadmap.md current Phase as anchor for backlog.md

## Current Phase

Phase 1: Core Editing. P0 narrowed to 2 items (2026-03-05): Per-Side Spacing, Extended Style Properties.

## Prioritization Principle (decided 2026-03-05)

P0 = capability gap ("cannot do X at all"). P1 = efficiency gap ("can do X but slowly/painfully"). See decisions.md for full reasoning.

## Key Facts (verified 2026-03-05)

- Shape tool has a shortcut (R) and toolbar button but NO implementation (no ShapeTool class)
- Code generation handles all three node types (element, text, instance) in serialize.ts
- Properties panel supports: size, display/flex layout, CSS position, overflow, single-value padding/margin, backgroundColor, border, typography (size/weight/color/align)
- Missing from properties panel: opacity, box-shadow, per-side spacing, per-corner border-radius, min/max dimensions, line-height, letter-spacing, font-family, flex child props, gradients
- No copy/paste, no group/ungroup, no alignment/distribution, no context menu, no image element
- Only click-to-create (fixed size); no drag-to-create
- Code component system roadmap exists at docs/prd/code-component-system-roadmap.md (separate from Phase 1 core editing)
