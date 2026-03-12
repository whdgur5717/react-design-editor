---
name: skill-creator
description: Guide for creating or updating reusable agent skills with the open agent skills structure. Use when the user wants to create a new skill, refactor an existing skill, or package skill resources such as scripts, references, and assets.
---

# Skill Creator

This is the shared source of truth for skill-authoring guidance used across Claude Code and Codex.

## Goal

Help the agent create effective, portable skills that follow the open agent skills layout and keep platform-specific behavior out of the skill itself.

## Workflow

1. Clarify the target skill's purpose and trigger conditions with concrete examples.
2. Decide what belongs in `SKILL.md` versus `scripts/`, `references/`, and `assets/`.
3. Initialize the skill structure if it does not exist.
4. Write or refine the skill instructions.
5. Package and validate when distribution is needed.

## References

- For workflow composition patterns, read `references/workflows.md`.
- For output-shaping patterns, read `references/output-patterns.md`.

## Scripts

- `scripts/init_skill.py` scaffolds a new skill directory.
- `scripts/quick_validate.py` performs lightweight frontmatter validation.
- `scripts/package_skill.py` packages a skill for distribution.

## Rules

- Keep the main `SKILL.md` concise and push details into references when needed.
- Prefer portable conventions that both Claude Code and Codex can understand.
- Avoid adding platform-specific command syntax to the skill itself.
