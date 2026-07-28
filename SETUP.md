# Setting up the model-routing bundle

A prompt for a Claude Code session. From this repo's root, tell the agent: **"Read SETUP.md and follow it."** It assumes you have no model routing installed yet — everything below is additive.

## Steps

1. **Routing section.** Append the `## Model routing` section from `bundle/.claude/CLAUDE.md` to `~/.claude/CLAUDE.md` (create the file if it doesn't exist). Skip the HTML comment at the top of the bundle file — it's install guidance, not content.

2. **Agent definitions.** Copy the five files from `bundle/.claude/agents/` into `~/.claude/agents/`:
   `opus-medium.md`, `opus-high.md`, `fable-medium.md`, `fable-high.md`, `sonnet-high.md`.
   These pin model + reasoning effort for subagents; the routing section refers to them by name.

3. **Delegation skill.** Copy `bundle/.claude/skills/delegate-to-codex/` into `~/.claude/skills/`.
   If this machine symlinks Claude skills into `~/.codex/skills/` for Codex-side discovery, link this one the same way.

4. **Codex config.** In `~/.codex/config.toml`, set `model_reasoning_effort = "high"` — set or replace that one key, leave every other key alone. If the file doesn't exist, create it from `bundle/.codex/config.toml`.

5. **Verify.** From this repo (after `npm install`):

   ```sh
   node bin/verify-routing.mjs "$HOME"
   ```

   Fix anything it reports and re-run until it prints ok. It checks that everything above is present and correctly valued.
