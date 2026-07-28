# Set up the model-routing bundle

You are installing the model-routing bundle into this user's Claude Code setup. It assumes no model routing is installed yet — every step is additive. If any file below already exists, do not overwrite it; tell the user instead.

If you find model-routing guidance already in place that contradicts what you are installing — an older model table, routing rules naming models the new section doesn't, a rules file the new section supersedes, or older Codex skills that `delegate-to-codex` replaces — raise the conflict with the user and settle it together; replace or remove their existing rules only once they have said to, never on your own initiative.

1. **Clone the repo**, unless you are already inside a checkout of it:

   ```sh
   git clone https://github.com/lukeselr/model-routing.git
   cd model-routing
   ```

   Every path below that isn't under `~` is relative to this repo root.

2. **Routing section.** Append the `## Model routing` section from `bundle/.claude/CLAUDE.md` to `~/.claude/CLAUDE.md` (create the file if it doesn't exist). Skip the HTML comment at the top of the bundle file — it's install guidance, not content.

3. **Agent definitions.** Copy the five files from `bundle/.claude/agents/` into `~/.claude/agents/`:
   `opus-medium.md`, `opus-high.md`, `fable-medium.md`, `fable-high.md`, `sonnet-high.md`.
   These pin model + reasoning effort for subagents; the routing section refers to them by name.

4. **Delegation skill.** Copy `bundle/.claude/skills/delegate-to-codex/` into `~/.claude/skills/`.
   If this machine symlinks Claude skills into `~/.codex/skills/` for Codex-side discovery, link this one the same way.

5. **Codex config.** In `~/.codex/config.toml`, set `model_reasoning_effort = "high"` — set or replace that one key, leave every other key alone. If the file doesn't exist, create it from `bundle/.codex/config.toml`. (No Codex CLI on this machine? Create the file anyway; it's inert until Codex is installed.)

6. **Verify.** From the repo root:

   ```sh
   npm install
   node bin/verify-routing.mjs "$HOME"
   ```

   Fix anything it reports and re-run until it prints ok. It checks that everything above is present and correctly valued.

Finish by listing exactly what you added and where, and anything you skipped because it already existed. Tell the user to start a fresh Claude Code session so the routing section loads.
