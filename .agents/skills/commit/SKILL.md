---
name: commit
description: Analyze local changes, propose atomic commit boundaries, and produce emoji conventional commit messages. Use when the user asks to commit changes or wants a commit strategy.
---

# Commit

Use this skill when preparing git commits.

## Workflow

1. Run the project's pre-commit checks unless the user explicitly skips them.
2. Inspect the full working tree before staging anything.
3. Propose atomic commit boundaries and concise messages focused on why.
4. Stage and commit only after the user explicitly asks for the commit to be created.

## Message Format

Use `{emoji} {type}({scope}): {description}` with a short, imperative subject.
