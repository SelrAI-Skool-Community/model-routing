<!--
  Model-routing bundle: this file is exactly the routing section, not a whole CLAUDE.md.
  Like .codex/config.toml, it is never copied over the target wholesale. Install adds or
  replaces one thing in the target CLAUDE.md — the "## Model routing" section, from its
  heading to the next same-level heading — and leaves every other line untouched. This
  comment sits above the heading and is not part of what gets merged.
-->
## Model routing

Scores are 1–10, higher is better. Cost reflects plan headroom, not list price — the one value to retune when plan limits change.

| model       | cost | intelligence | taste | default effort |
|-------------|------|--------------|-------|----------------|
| gpt-5.6-sol | 9    | 7            | 5     | high           |
| opus-5      | 4    | 8            | 9     | medium         |
| fable-5     | 2    | 9            | 9     | low            |

**Opus-5 is the default for everything.** The other three are named exceptions that must justify themselves.

- **Sol — the throwaway test.** Budget separation, not intelligence: would you be happy for this to be thrown away and rewritten? If yes, Sol — prototypes, spikes, throwaway verification code, clear-spec mechanical implementation, read-only investigation. Sol-authored code never merges without an Opus review pass, and Sol is not the global default implementer — only where the spec is tight and mechanical.
- **Sonnet — a fenced whitelist.** Allowed: exploration and search fan-out; high-input-context gathering; step-by-step instruction execution; acting as the Codex wrapper. Forbidden anything that decides, designs, reviews, or debugs. On research: Sonnet gathers, Opus synthesises — never Sonnet end-to-end.
- **Fable — two doors, plus manual selection.** Stuck loops, where the signal is repetition of the same failure, not a count of failures; and pre-emptive on high-stakes domains where the last 1–5% bites — auth, billing, security, concurrency. An agent that escalates itself says so.
- **Prototypes.** Sol owns them as the purest throwaway case; Opus takes over where there is a visual aspect.

**Effort.** Per-model defaults as tabled; the ceiling is `high`, never above — `xhigh`/`max` cause second-guessing loops at roughly double the cost, and effort raises thinking per step, not the number of steps. No automatic bump rule: effort is only ever raised by hand, and an agent must not compensate by reaching for a smarter model instead.

Production deploys and outbound client communications stay human-in-the-loop, regardless of what autonomy a task grants.

Maintenance: a routing misjudgment appends one condensed line here; past roughly 20 lines this section is pruned, not extended.
