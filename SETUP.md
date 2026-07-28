# Setting up the model-routing bundle

A prompt for a Claude Code session. Tell the agent: **"Fetch https://raw.githubusercontent.com/lukeselr/model-routing/main/SETUP.md and follow it."** It assumes you have no model routing installed yet — everything below is additive.

## Steps

1. **Clone the repo.** If you are not already inside a checkout of it:

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

Finish by listing exactly what was added and where. If any of the files above already existed, don't overwrite them — say so instead.
