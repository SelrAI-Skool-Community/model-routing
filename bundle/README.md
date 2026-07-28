# bundle/ — the model-routing bundle

This tree mirrors an **install root**. Everything under `bundle/` is laid out exactly as it will
sit once installed, so installing is a copy and verifying is `verifyRouting('bundle')`.

```
bundle/
  .claude/
    agents/          five agent definitions (CORE-82)
```

Repo-first, install-at-the-end: nothing here is written into a real home directory by this repo.
`verifyRouting(installRoot)` is parameterised by root, so it points at `bundle/` today and at a
real install root later, with no special-casing.

Later tickets add to this same tree:

- `.claude/CLAUDE.md` — the canonical routing section (CORE-84)
- `.claude/skills/delegate-to-codex/` — the one Codex delegation skill (CORE-85)
- `.codex/config.toml` — `model_reasoning_effort = "high"` (CORE-83)

## Agent definitions

Five files, each pinning only `model` and `effort` (plus the `name` Claude Code keys the agent by,
and a neutral one-line `description`). No prompt body and no role framing, so each behaves exactly
like the default general-purpose agent.

| agent | model | effort |
|---|---|---|
| `opus-medium` | opus-5 | medium |
| `opus-high` | opus-5 | high |
| `fable-medium` | fable-5 | medium |
| `fable-high` | fable-5 | high |
| `sonnet-high` | sonnet-5 | high |

Names are model + effort deliberately, never roles — roles would bake routing into agent files and
go stale. There is deliberately no `fable-low` (Fable at low is the interactive session, never a
subagent) and no Sol agent (Sol is reached by `sonnet-high` running the Codex delegation skill).

The ceiling is `high`, never above.
