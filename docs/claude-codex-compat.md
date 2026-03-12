# Claude Code and Codex Compatibility

This repo supports both Claude Code and Codex.

Rule: feature ownership must not live only in `.claude/`.

- Shared capability sources live in `.agents/`.
- `.claude/` and `.codex/` are adapters for runtime-specific syntax, policy, and entrypoints.
- If something exists only in `.claude/`, it is incomplete until there is a shared source or a Codex-native equivalent.

## Canonical Layout

| Capability           | Canonical location       | Claude adapter                                                | Codex adapter                                                   |
| -------------------- | ------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Shared skills        | `.agents/skills/`        | `.claude/skills/` may keep Claude-native copies when required | Codex discovers `.agents/skills/`                               |
| Durable memory       | `.agents/memory/`        | Claude agents should read shared memory                       | Codex roles should read shared memory                           |
| Role guidance        | `.agents/roles/`         | Claude agents remain markdown wrappers                        | `.codex/agents/*.toml` loads role-specific instructions         |
| Project instructions | `AGENTS.md`, `CLAUDE.md` | Claude reads `CLAUDE.md` directly                             | `.codex/config.toml` adds `CLAUDE.md` as a fallback project doc |
| Runtime policy       | platform-specific        | `.claude/settings*.json`                                      | `.codex/config.toml`                                            |

## Capability Mapping

### Skills

- Claude Code skills may be exposed from `.claude/skills/`, but the portable source convention is `.agents/skills/`.
- Shared workflows that both tools must understand should exist in `.agents/skills/`.
- Codex should not rely on `.codex/skills/` as the long-term source of truth.

### Agents

- Claude agents remain defined in `.claude/agents/*.md`.
- Codex agent roles are declared in `.codex/config.toml` and use `.codex/agents/*.toml` wrappers.
- Portable role intent lives in `.agents/roles/*.md`.

### Memory

- `.agents/memory/` is the durable shared store.
- Claude-only memory paths should not become the canonical writable source anymore.

### Commands

- Claude supports repo-defined command markdown like `.claude/commands/write-context.md`.
- Codex only has built-in slash commands, so repo-specific command workflows must be modeled as shared skills instead.
- In Codex, use `$write-context` or a natural-language request; do not expect a custom `/write-context` slash command.

### Skill Authoring

- Skill-authoring guidance and helper scripts are shared under `.agents/skills/create-skill/`.
- Claude may keep adapter entrypoints that reference the shared skill, but the reusable content must not be Claude-only.

### Permissions and Sandboxing

- Claude and Codex do not share the same policy model.
- Keep Claude allowlists in `.claude/settings*.json`.
- Keep Codex sandbox and agent-role policy in `.codex/config.toml`.
- Treat these as equivalent intent, not identical syntax.

## Current Conventions

- If a workflow must work in both tools, add or update the shared asset in `.agents/` first.
- If the workflow depends on a Claude-only surface, add the Codex equivalent using Codex-native conventions rather than copying syntax blindly.
- Prefer shared skills over duplicated custom command files.
- Treat `.claude/` as an adapter layer, not as a feature source.
