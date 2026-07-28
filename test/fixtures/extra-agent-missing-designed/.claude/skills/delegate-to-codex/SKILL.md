---
name: delegate-to-codex
description: Delegate a task to Codex (gpt-5.6-sol) via the Codex CLI. Use to start any Codex session — implementing a spec'd change, reviewing a diff, read-only investigation or bulk data digging, or verifying a running app through browser drives and screenshots — and when another skill routes work to Sol.
---

Starting a Codex session is a skill in itself. Implementation, review, investigation, and runtime verification are the same act — start a session, hand it a tight prompt, verify what comes back — differing only in the prompt. Whether to delegate at all is the routing section's call; this skill is how.

## Starting a session

`codex exec "<prompt>"` — one-shot and non-interactive. Model and reasoning effort come from `~/.codex/config.toml`; leave both to the config.

- Work that must not write (reviews, investigation, data digging): add `-s read-only`.
- Outside a git repo: add `--skip-git-repo-check`, or the run refuses to start ("Not inside a trusted directory").
- A configured MCP server with expired auth kills the run silently (`worker quit ... Auth(AuthorizationRequired)`). When the task needs no MCP, pass `-c 'mcp_servers={}'`.
- Runs are often slow: give the shell call a generous timeout, or run it in the background.

## Prompting Codex

Much shorter and simpler than a Claude subagent prompt: one tight, self-contained task statement — what to do, where, and what to report back. Codex takes no unsolicited action, so role preambles and guardrail padding are noise; spend the words on the task.

Every prompt ends with: "If you find nothing, say so explicitly and state exactly what you inspected." Silence otherwise reads as failure and triggers wasteful reruns.

Prompt shapes:

- **Implement** — "Implement <spec, with the agreed interfaces stated>. Write tests covering the new behaviour. Summarise what changed, list files touched, state how you verified it."
- **Review** — "Review the diff from `git diff <ref>...HEAD` in this repo. Report real defects — correctness, edge cases, design, missing test coverage — not style." (`codex review <ref>` covers the branch-diff case directly.)
- **Verify** — "Verify <flow> at <URL> by writing and running a Playwright CLI script. Screenshot each acceptance checkpoint; keep the script as a rerunnable artifact. Report observed vs expected." Runtime and UI verification runs on the Playwright backend — no desktop needed, and the script remains a rerunnable test. Start the app yourself and hand Codex the URL; its job is exercising the flow, not guessing the launch procedure.

`codex exec` does no slash-command or `?` processing. Skills fire by description matching against `~/.codex/skills/`, so word the prompt in a skill's trigger language rather than naming it as a command.

## Reaching Codex from a subagent

The Agent tool's `model` parameter takes Claude models only. To reach Codex from a workflow or fan-out, spawn the existing `sonnet-high` agent with instructions to run the `codex exec` call and relay the result verbatim, prefixed `[codex/<model>]`. On a timeout or tool failure the wrapper retries once in the background before reporting failure.

## After the run

Read Codex's report and check every claim you intend to act on against the actual evidence — diffs, files, screenshots, command output. A finding becomes yours the moment you pass it upward: relay only what you have verified, and carry Codex's "nothing found + what was inspected" statement verbatim when that was the result.
