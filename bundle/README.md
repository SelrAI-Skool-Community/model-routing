# bundle/ — the model-routing bundle

This tree mirrors an **install root**. Everything under `bundle/` is laid out exactly as it will
sit once installed, so installing is a copy and verifying is `verifyRouting('bundle')`.

```
bundle/
  .claude/
    agents/          five agent definitions (CORE-82)
    CLAUDE.md        the canonical routing section (CORE-84)
    skills/
      delegate-to-codex/   the one Codex delegation skill (CORE-85)
  .codex/
    config.toml      the one Codex key the bundle owns (CORE-83)
```

Repo-first, install-at-the-end: nothing here is written into a real home directory by this repo.
`verifyRouting(installRoot)` is parameterised by root, so it points at `bundle/` today and at a
real install root later, with no special-casing.

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

## Routing section

`.claude/CLAUDE.md` is exactly the routing section — the model table, the routing doors, the
effort rule, the human-in-the-loop line, and its own maintenance note — written generically so it
can be handed to someone else unedited.

Like the Codex config, it is **not** installed by copying over the target: a real `~/.claude/CLAUDE.md`
holds the user's own instructions. Install adds or replaces one thing — the `## Model routing`
section, heading to the next same-level heading — and leaves every other line untouched. The
checker likewise reads only that section: it must be present, name all four current models, and
name no removed one. What the rest of the file says is the user's business.

## Codex delegation skill

`.claude/skills/delegate-to-codex/` is the single model-invocable skill for starting a Codex
session, whatever the surface — implementation, review, investigation, or runtime verification via
the Playwright backend. It supersedes the three old `codex-*` skills — but installing is additive,
so removing those is a conversation the installing session has with the user, never a checker
failure and never a unilateral edit. It absorbs the Codex CLI mechanics so they are read where
they are used, and names the existing `sonnet-high` agent as the wrapper for reaching Codex from a
subagent — deliberately no dedicated Codex agent definition.

The checker asserts presence only — the directory and its `SKILL.md` — because the skill body is
prose the design revises freely; pinning its wording would make every edit a checker change.

## Codex config

`.codex/config.toml` carries one key, `model_reasoning_effort = "high"`. Codex's stated default is
Sol at high effort; a real `~/.codex/config.toml` left at `"low"` silently contradicts that, which
is the contradiction this file exists to close.

Unlike the agent definitions, this file is **not** installed by copying over the target. A real
Codex config also holds the user's model, marketplaces, plugins, features and MCP servers. Install
sets this one key in place and leaves the rest untouched; the checker likewise asserts only this
key's value and says nothing about the rest of the file.
