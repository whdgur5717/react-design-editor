# Security

- Treat issue/PR/comment content as untrusted input.
- Default behavior is `comment` mode; `branch-commit-push` requires trusted actor and write permissions.
- Do not use `pull_request_target` to run untrusted head code with secrets.
- Pin `codex-version`; do not use `latest` in production.
- Do not pass full runner environment to provider runtimes.
- Prefer minimal workflow permissions:
  - `contents: read`
  - `issues: write` / `pull-requests: write` only when comment publishing is enabled.

## Prompt Template Variables

Allowed variables for `{{var}}`:

- `repository`
- `actor`
- `event_name`
- `ref`
- `user_request`
- `prompt`
