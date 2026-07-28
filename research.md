# Model routing — design record

**Date:** 2026-07-28
**Status:** design settled, not yet implemented.

A rework of the model-picking methodology that lives in `~/.claude/CLAUDE.md`, prompted by Opus 5's arrival and by the model table having grown too many rows to be useful. The routing block plus its agent definitions is intended to be **distributable** — written generically, with nothing business-specific in it.

---

## 1. The model set

| model | cost | intelligence | taste |
|---|---|---|---|
| gpt-5.6-sol | 9 | 7 | 5 |
| sonnet-5 | 5 | 4 | 6 |
| opus-5 | 4 | 8 | 9 |
| fable-5 | 2 | 9 | 9 |

Scores are 1–10, higher is better. **Cost reflects plan headroom, not list price**, and needs retuning whenever plan limits change — that is the one durable caveat about this table.

### What changed and why

**Opus-5 added at 4 / 8 / 9.** Usage limits go roughly 8x further than Fable, so cost doubles from Fable's 2 to 4. Intelligence sits one point below Fable: coding and terminal skill are equal or better, but being a much smaller model it lacks Fable's knack for problems in genuinely uncharted territory — the vast majority of work is solvable, but the last 1–5% is meaningfully easier for Fable. Taste is held equal to Fable until a difference is actually observed.

**Sol dropped 9 → 7.** The old table oversold it. Opus is more intelligent in several regards; the real and only reason Sol earns a row is that it **spends a different budget**. Its plan headroom is effectively free relative to the Claude pool.

**Sonnet dropped a peg on both axes** (was 5/5/7, now 5/4/6) — hands-on it performs below what the old table claimed.

**Removed entirely:** `opus-4.8` (superseded), `gpt-5.5`, `gpt-5.6-terra`, `gpt-5.6-luna` (reachable only via the same Codex plan where Sol costs identical headroom and is smarter — no niche), `haiku`. No "never use" list is kept; they simply vanish. Benchmark-provenance footnotes are dropped too — these scores are hands-on judgment now, not derived from published indices.

---

## 2. Routing

**Opus-5 is the default for everything.** The other three models are named exceptions that have to justify themselves. The system would function acceptably on Opus alone; the exceptions exist to save headroom or to reach past Opus's ceiling.

### Sol — the throwaway test

The point of Sol is budget separation, not intelligence. The test is:

> Would you be happy for this to be thrown away and rewritten?

If yes → Sol. That covers prototypes, spikes, throwaway code written to verify something, clear-spec mechanical implementation, and read-only investigation. Expensive tokens should never go to temporary or unimportant work.

Two guardrails:

- **Sol-authored code never merges without an Opus review pass.** Sol's taste is 5; on design-ambiguous work it bakes in structure that then has to be ripped out, which costs more than writing it once. Sol-first is right where the spec is already tight, wrong where the design is not settled.
- Sol is **not** the global default implementer — only the default where the spec is tight and mechanical.

### Sonnet — a fenced whitelist

Allowed: exploration and search fan-out; high-input-context gathering (logs, transcripts, long documents); step-by-step instruction execution (deployment, merges, smoke tests); acting as the Codex wrapper.

Forbidden: anything that decides, designs, reviews, or debugs. Sonnet goes around in circles on hard problems, so it ends up cheaper to use Opus or Sol.

On research specifically: **Sonnet gathers, Opus synthesises.** Never Sonnet end-to-end on a research question.

### Fable — two doors only

1. **Stuck loops.** A review knocking the same implementation back repeatedly; a bug failing the same way over and over in one session. The signal is *repetition of the same failure*, not a count of failures — one failed attempt is not an escalation.
2. **Pre-emptive, on high-stakes domains** where the last 1–5% bites: auth, billing, security, concurrency. Routed to Fable from the start rather than escalated into.

Plus manual selection at any time. Implementation sessions do not run on Fable outside those doors. Agents escalate themselves and say that they have done so; escalation can also be triggered by hand.

### Prototypes

Sol owns them — they are the purest throwaway case. Opus takes over where there is a visual aspect, since it has the taste. This rule lives in the routing block rather than in the prototype skill, because that skill is third-party and stays unmodified.

### Cross-model review — scrapped

The old rule paired families: Codex implements → Claude reviews; Claude implements → Codex reviews, so no model was its own independent reviewer. **Removed entirely.** A fresh context window is the independent review. Having one model review another sacrifices intelligence exactly where it is most needed — on reviewing Opus-authored work — and caused more problems than it solved. The `codex-review` skill is deleted along with the rule.

---

## 3. Reasoning effort

Blanket "high" for every model was unnecessary. Per-model defaults:

| model | default effort |
|---|---|
| opus-5 | medium |
| fable-5 | low |
| gpt-5.6-sol | high |
| sonnet-5 | high |

Ceiling stays **high, never above**. `xhigh`/`max` cause second-guessing loops and bloated output at roughly double the cost; effort raises thinking per step, not the number of steps, so it does not buy more capability on long tasks.

**No automatic bump rule.** "Hard" cannot be defined well enough to trigger on, so per-model defaults are fixed and effort is only ever raised by hand. Agents do not talk themselves into more effort, and must not compensate by reaching for a smarter model instead.

### How effort actually binds — the mechanism

Verified against the Claude Code 2.1.220 binary:

- The `Agent` tool's inline call **cannot** set effort. It overrides `model` only.
- Agent definitions (`.claude/agents/*.md` frontmatter) **can**: the schema accepts `effort: low | medium | high | xhigh | max` ("Reasoning effort level for this agent. Either a named level or an integer") alongside `model`, `tools`, `skills`, `maxTurns`, and `background`.

So a subagent does **not** inherit the parent session's effort — but only if the work goes through a *named* agent rather than an ad-hoc `Agent` call. This is what lets an orchestrator run on Fable-low while every worker runs at its own pinned effort.

### The agent definitions

Five files in `~/.claude/agents/`, each pinning **only** `model` and `effort`, with no custom prompt or role framing — they behave exactly like the default general-purpose agent:

```
opus-medium
opus-high
fable-medium
fable-high
sonnet-high
```

Names are model + effort deliberately, never roles. Roles would bake routing into agent files and go stale; model+effort names are self-describing, so "spawn the `opus-high` agent" reads correctly even to someone who has never seen the definitions.

No `fable-low` — Fable at low is the main interactive session, never a subagent. No Sol agent — Sol is reached by `sonnet-high` running the Codex delegation skill.

`~/.codex/config.toml` flips `model_reasoning_effort` from `low` to `high`, which had silently contradicted the stated Sol default.

**Distribution:** the routing block ships together with the five agent files as one bundle. The agents are what make the effort column real, so they are part of the system rather than an extra. No graceful-degradation fallback clause — that is overengineering.

---

## 4. File layout

### Consolidation

`~/.claude/rules/model-picking.md` is **deleted**, along with its pointer. Its contents split three ways:

- **Table, routing rules, effort defaults** → a tight section in `~/.claude/CLAUDE.md`. One canonical copy, no duplication between the hot file and a rules file.
- **Codex CLI mechanics** (`--skip-git-repo-check`, `-c 'mcp_servers={}'`, timeouts, prompting style) → into the Codex delegation skill body, where they are actually read.
- **Human-in-the-loop constraint** (production deploys, outbound client communications) → its own line in `CLAUDE.md`; it was never model picking.

Maintenance: routing misjudgments append one condensed line to the `CLAUDE.md` section. Past roughly 20 lines it gets pruned rather than extended.

### Codex delegation

The three skills `codex-implementation`, `codex-review`, and `codex-computer-use` collapse into **one model-invocable skill, `delegate-to-codex`**. Starting a Codex session is a skill in itself; it should not be concerned with implementation versus review as separate surfaces. Computer-use folds in as a line about the Playwright backend rather than a standalone skill.

The wrapper role is filled by the existing `sonnet-high` agent — no dedicated Codex agent definition, keeping bloat down.

**Codex has real skills support.** `~/.codex/skills/` uses the identical `SKILL.md` format and auto-discovers by description, exactly like Claude. Claude skills are therefore symlinked into it as one-time setup, so Codex loads `/implement` (and everything else) itself rather than being told to read a file path. Note that `codex exec` is non-interactive and does no slash-command or `?` processing at all — invocation there is discovery-based.

### Skill rewrites

`/ship`, `/batch-review`, `/parallel-implement`, and `/deploy` update to the new model set.

**No skill pins the orchestrator's model.** Which model orchestrates a session is a session-start decision, not the skill's concern. `/ship` and `/batch-review` therefore drop their Fable-orchestrator pins.

- `/parallel-implement`: default worker becomes Opus-5 (was Fable). The Fable restriction is a global routing rule, not something the skill restates.
- `/deploy`: says "delegate to a sonnet agent" — deployment never happens in the orchestration session, whatever that session is running on. It drops any claim about what model it "runs on".

Third-party skills and the historical pipeline research documents stay untouched. The two stale model-picking memory files are deleted rather than rewritten, to avoid the risk of stale memory.

---

## 5. Implementation checklist

- [ ] Rewrite the routing section in `~/.claude/CLAUDE.md` — generic, distributable, no business specifics
- [ ] Delete `~/.claude/rules/model-picking.md` and its pointer
- [ ] Create the five agent definitions in `~/.claude/agents/`
- [ ] Replace the three `codex-*` skills with `delegate-to-codex`
- [x] Symlink Claude skills into `~/.codex/skills/` (done 2026-07-28 — all 32)
- [ ] Flip `~/.codex/config.toml` to `model_reasoning_effort = "high"`
- [ ] Rewrite `/ship`, `/batch-review`, `/parallel-implement`, `/deploy`
- [ ] Delete the two stale model-picking memory files
