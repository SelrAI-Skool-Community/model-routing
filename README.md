# model-routing

Implementation of the Claude/Codex model-routing methodology — which model handles which kind of work, at what reasoning effort, and how that gets enforced.

- [SETUP.md](./SETUP.md) — install prompt: hand it to a Claude Code session to set the bundle up on a machine with no model routing installed.
- [bundle/](./bundle/README.md) — the bundle itself, laid out exactly as it sits once installed, and the record of why each part is shaped the way it is. Repo-first: nothing here writes into a home directory.
- `src/verifyRouting.js` — `verifyRouting(installRoot)`, the read-only checker that reports what is missing, malformed, left over, or set to the wrong value.

```bash
npm install
npm test                 # vitest run
npm run verify           # node bin/verify-routing.mjs bundle
```

`verifyRouting` is parameterised by install root, so the same checker runs against `bundle/` here, against fixture trees under `test/fixtures/`, and against a real install root later.

Status: design settled 2026-07-28, bundle complete. The checker (agents, routing section, delegation skill, Codex config assertions), the five agent definitions, the routing section, and `delegate-to-codex` all ship here; the orchestration-skill rewrites landed in the skills themselves.

Installing is **additive**: the checker reads only what the bundle owns — the five agent files, the routing section, the delegation skill, the Codex reasoning-effort key — and asserts each is present and correctly valued. Agents, skills and CLAUDE.md sections of the user's own are none of its business. (It does report a *leftover* for a removed model still named inside the routing section — that section is the bundle's own.) Files the bundle supersedes are removed in conversation with the user (see SETUP.md), never by the checker.
