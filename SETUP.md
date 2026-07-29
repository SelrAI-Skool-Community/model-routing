# Set up the model-routing bundle

You are installing the model-routing bundle into this user's Claude Code setup. It assumes no model routing is installed yet — every step is additive. If any file below already exists, do not overwrite it; tell the user instead.

If you find model-routing guidance already in place that contradicts what you are installing — an older model table, routing rules naming models the new section doesn't, a rules file the new section supersedes, or older Codex skills that `delegate-to-codex` replaces — raise the conflict with the user and settle it together; replace or remove their existing rules only once they have said to, never on your own initiative.

1. **Clone the repo**, unless you are already inside a checkout of it:

   ```sh
   git clone https://github.com/Mr-heka/model-routing.git
   cd model-routing
   ```

   Every path below that isn't under `~` is relative to this repo root.

2. **Routing section.** Install the `## Model routing` section from `bundle/.claude/CLAUDE.md` into `~/.claude/CLAUDE.md` (create the file if it doesn't exist). Skip the HTML comment at the top of the bundle file — it's install guidance, not content.

   If that file has no `## Model routing` section, append it. If it already has one, do **not** append a second: two sections leave a half-installed state where the older one can win, and nothing downstream will flag it. Raise the conflict with the user as above, and once they have said to, replace that section in place — from its heading to the next same-level heading — leaving every other line untouched.

3. **Agent definitions.** Copy the five files from `bundle/.claude/agents/` into `~/.claude/agents/`:
   `opus-medium.md`, `opus-high.md`, `fable-medium.md`, `fable-high.md`, `sonnet-high.md`.
   These pin model + reasoning effort for subagents; the routing section refers to them by name.

4. **Delegation skill.** Copy `bundle/.claude/skills/delegate-to-codex/` into `~/.claude/skills/`.
   If this machine symlinks Claude skills into `~/.codex/skills/` for Codex-side discovery, link this one the same way.

5. **Codex config.** In `~/.codex/config.toml`, set `model = "gpt-5.6-sol"` and `model_reasoning_effort = "high"` — those two keys only, leaving every other key alone. Together they are the "Sol at high" default the routing section's Sol door depends on; set the effort without the model and Codex runs whatever its CLI default is, so that door reaches the wrong model.

   If either key is already set to something else, treat it as a conflict rather than overwriting it: a `model` pointing at another Codex model may well be deliberate. Raise it with the user as above, and change it only once they have said to. If the file doesn't exist, create it from `bundle/.codex/config.toml`. (No Codex CLI on this machine? Create the file anyway; it's inert until Codex is installed.)

6. **Verify.** From the repo root:

   ```sh
   npm install
   node bin/verify-routing.mjs "$HOME"
   ```

   Fix anything it reports and re-run until it prints ok. It checks the five agent definitions, the routing section, the delegation skill, and the Codex reasoning-effort key. It does not check the Codex `model` key, so confirm that one by eye.

Finish by listing exactly what you added and where, and anything you skipped because it already existed. Tell the user to start a fresh Claude Code session so the routing section loads.
