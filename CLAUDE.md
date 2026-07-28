# model-routing

Design record and implementation for the Claude/Codex model-routing methodology — which model handles which kind of work, at what reasoning effort, and how that gets enforced. See [research.md](./research.md) for the settled design.

The routing block and its agent definitions are meant to be **distributable**: written generically, with nothing business-specific in them. Keep it that way when editing.

## Agent skills

### Issue tracker

Linear — Core Builds team, `Skool Community Week 1 Drop` project, reached via the Linear MCP. Not GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
