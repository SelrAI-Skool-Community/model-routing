# model-routing

Design record and implementation for the Claude/Codex model-routing methodology — which model handles which kind of work, at what reasoning effort, and how that gets enforced.

- [research.md](./research.md) — the full design record: model table, routing rules, effort mechanism, file layout, implementation checklist.
- [bundle/](./bundle/README.md) — the bundle itself, laid out exactly as it sits once installed. Repo-first: nothing here writes into a home directory.
- `src/verifyRouting.js` — `verifyRouting(installRoot)`, the read-only checker that reports what is missing, malformed, left over, or set to the wrong value.

```bash
npm install
npm test                 # vitest run
npm run verify           # node bin/verify-routing.mjs bundle
```

`verifyRouting` is parameterised by install root, so the same checker runs against `bundle/` here, against fixture trees under `test/fixtures/`, and against a real install root later.

Status: design settled 2026-07-28. Implemented so far: the checker foundation and the five agent definitions.
