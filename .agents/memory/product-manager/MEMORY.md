# PM Memory Index

## Files

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| [product.md](product.md)     | Product definition, vision, user understanding |
| [roadmap.md](roadmap.md)     | Product roadmap                                |
| [backlog.md](backlog.md)     | Prioritized feature backlog                    |
| [decisions.md](decisions.md) | Product decision log                           |

## Routing

- **"What should we build next?"** -> check `roadmap.md` for current phase, then `backlog.md` for priorities
- **"Propose or scope a feature"** -> check `product.md` for vision alignment, then update `backlog.md`
- **"Feature shipped"** -> update `backlog.md`, then update `product.md` or `roadmap.md` if needed
- **"Previous decisions"** -> read `decisions.md`
- **"Re-prioritize"** -> use `roadmap.md` current phase as the anchor for `backlog.md`

## Current Phase

Phase 1: Core Editing

## Rules

- Read this file first, then route to the right PM memory file before answering.
- Update memory immediately when a new product decision, reprioritization, or scope change is made.
- Product decisions stay here; QA should cross-link rather than duplicate them.

## Cross-links

- QA plans and quality gates live in `.agents/memory/qa-engineer/`.
- For risky UI or editor changes, ask QA for a plan before treating a feature as done.
