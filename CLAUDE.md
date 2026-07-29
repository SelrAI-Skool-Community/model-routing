# model-routing

Implementation of the Claude/Codex model-routing methodology — which model handles which kind of work, at what reasoning effort, and how that gets enforced. The settled design lives in the bundle it produced: `bundle/.claude/CLAUDE.md` is the routing section itself, and `bundle/README.md` explains what each part of the bundle is for and why.

The routing block and its agent definitions are meant to be **distributable**: written generically, with nothing business-specific in them. Keep it that way when editing.

## Agent skills

### Issue tracker

Linear — Core Builds team, project named in the gitignored `docs/agents/tracker-project.local.md`, reached via the Linear MCP. Not GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
