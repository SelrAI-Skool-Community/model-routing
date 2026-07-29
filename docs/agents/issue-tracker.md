# Issue tracker: Linear

Issues and PRDs for this repo live in **Linear**, not GitHub Issues. The GitHub remote (`Mr-heka/model-routing`) is for code only — never open a GitHub issue for this repo.

- **Team:** Core Builds (key `CORE`, so issue identifiers look like `CORE-123`)
- **Project:** the internal tracker project — everything from this repo lands in this project unless the maintainer says otherwise.

## Access

Skills reach Linear through the **Linear MCP** (`mcp__linear__*` tools).

Two caveats that come up in practice:

- **The server may be unauthenticated.** When only `mcp__linear__authenticate` and `mcp__linear__complete_authentication` are exposed, run the authenticate flow before attempting any read or write. Don't fall back to `gh issue` — a GitHub issue is the wrong destination, not a degraded one.
- **Headless and cron runs may not have Linear at all**, since the auth is interactive. If a background run needs to file an issue and the MCP is unreachable, report the intended issue body back to the maintainer rather than routing it elsewhere.

There is no Linear CLI configured for this repo.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the Core Builds team, in the `Skool Community Week 1 Drop` project. Put the skill's document body in the issue description, and use the document's own title as the issue title.

## When a skill says "fetch the relevant ticket"

Fetch the Linear issue by its identifier (e.g. `CORE-123`) or URL, including its comments.

## Conventions

- **Create**: a Linear issue with team = Core Builds, project = `Skool Community Week 1 Drop`, plus the triage label the skill asks for.
- **Read**: fetch the issue with its comments and labels.
- **List for triage**: query the project's issues, filtered by triage label and state.
- **Comment**: add a Linear comment on the issue.
- **Labels**: apply and remove Linear labels — see `triage-labels.md`.
- **Close**: move the issue to a completed/cancelled state, with a comment explaining why.

## Pull requests as a request surface

**No.** GitHub PRs on this repo are not part of the triage queue. `/triage` reads Linear only.
