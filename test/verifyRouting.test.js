/**
 * Behavioural tests for verifyRouting. Every case is a committed fixture directory tree under
 * `test/fixtures/`, readable as a diff against `good-install`. Assertions are on the reported
 * problems only — never on how the checker walks the filesystem or parses a file.
 */

import { describe, expect, it } from 'vitest'
import { readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { verifyRouting } from '../src/verifyRouting.js'

const test_dir = dirname(fileURLToPath(import.meta.url))
const repo_root = join(test_dir, '..')
const bundle_root = join(repo_root, 'bundle')

function fixture(fixture_name) {
  return join(test_dir, 'fixtures', fixture_name)
}

/** Problems as `kind path` pairs — the part of a problem a caller acts on. */
function signatures(problems) {
  return problems.map((found) => `${found.kind} ${found.path}`).sort()
}

describe('a good install', () => {
  it('reports ok with no problems', async () => {
    const report = await verifyRouting(fixture('good-install'))

    expect(report).toEqual({ ok: true, problems: [] })
  })

  it('passes against the repo bundle, which is the real install source', async () => {
    const report = await verifyRouting(bundle_root)

    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
  })
})

describe('each violation in isolation', () => {
  it('reports a missing agent definition', async () => {
    const report = await verifyRouting(fixture('missing-agent-file'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'missing',
      path: '.claude/agents/fable-high.md'
    })
  })

  it('reports a missing agents directory once, not once per agent', async () => {
    const report = await verifyRouting(fixture('missing-agents-dir'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({ kind: 'missing', path: '.claude/agents' })
  })

  it('reports an install root with nothing installed as one missing per assertion', async () => {
    const report = await verifyRouting(fixture('empty-root'))

    expect(signatures(report.problems)).toEqual([
      'missing .claude/agents',
      'missing .codex/config.toml'
    ])
  })

  it('reports a wrong-but-parseable effort as wrong-value, not malformed', async () => {
    const report = await verifyRouting(fixture('wrong-effort'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'wrong-value',
      path: '.claude/agents/opus-medium.md'
    })
    expect(report.problems[0].detail).toContain('medium')
  })

  it('reports a wrong model as wrong-value', async () => {
    const report = await verifyRouting(fixture('wrong-model'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'wrong-value',
      path: '.claude/agents/sonnet-high.md'
    })
    expect(report.problems[0].detail).toContain('sonnet-5')
  })

  it('reports unparseable frontmatter as malformed', async () => {
    const report = await verifyRouting(fixture('malformed-frontmatter'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'malformed',
      path: '.claude/agents/fable-medium.md'
    })
  })

  it('reports a prompt body as wrong-value', async () => {
    const report = await verifyRouting(fixture('prompt-body'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'wrong-value',
      path: '.claude/agents/opus-high.md'
    })
    expect(report.problems[0].detail).toContain('prompt body')
  })

  it('reports an unexpected sixth agent as leftover', async () => {
    const report = await verifyRouting(fixture('extra-agent'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'leftover',
      path: '.claude/agents/fable-low.md'
    })
  })

  it('reports a Codex config left at the wrong effort as wrong-value', async () => {
    const report = await verifyRouting(fixture('codex-wrong-effort'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'wrong-value',
      path: '.codex/config.toml'
    })
    expect(report.problems[0].detail).toContain('model_reasoning_effort')
    expect(report.problems[0].detail).toContain('"low"')
  })

  it('reports an absent Codex config as missing', async () => {
    const report = await verifyRouting(fixture('codex-missing-config'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'missing',
      path: '.codex/config.toml'
    })
  })

  it('reports a Codex config that never sets the effort at the top level as wrong-value', async () => {
    const report = await verifyRouting(fixture('codex-no-effort-key'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'wrong-value',
      path: '.codex/config.toml'
    })
    expect(report.problems[0].detail).toContain('no model_reasoning_effort key')
  })

  it('reports an unreadable Codex config as malformed, not missing', async () => {
    const report = await verifyRouting(fixture('codex-unreadable-config'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({
      kind: 'malformed',
      path: '.codex/config.toml'
    })
  })
})

describe('the Codex config the user hand-maintains', () => {
  it('accepts the effort as a literal string with a trailing comment', async () => {
    const report = await verifyRouting(fixture('codex-alternate-toml-style'))

    expect(report).toEqual({ ok: true, problems: [] })
  })
})

describe('multiple violations at once', () => {
  it('collects every problem in one pass rather than short-circuiting', async () => {
    const report = await verifyRouting(fixture('multiple-violations'))

    expect(report.ok).toBe(false)
    expect(signatures(report.problems)).toEqual([
      'leftover .claude/agents/sol-high.md',
      'malformed .claude/agents/fable-medium.md',
      'missing .claude/agents/opus-medium.md',
      'wrong-value .claude/agents/sonnet-high.md'
    ])
  })

  it('covers all four problem kinds across the fixtures', async () => {
    const reports = await Promise.all(
      ['multiple-violations', 'wrong-effort'].map((fixture_name) => verifyRouting(fixture(fixture_name)))
    )
    const kinds = new Set(reports.flatMap((report) => report.problems).map((found) => found.kind))

    expect([...kinds].sort()).toEqual(['leftover', 'malformed', 'missing', 'wrong-value'])
  })
})

describe('a missing install root', () => {
  it('reports one clear problem rather than crashing', async () => {
    const report = await verifyRouting(fixture('does-not-exist'))

    expect(report.ok).toBe(false)
    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({ kind: 'missing', path: '.' })
  })

  it('reports one clear problem when the root is a file, not a directory', async () => {
    const report = await verifyRouting(join(repo_root, 'package.json'))

    expect(report.problems).toHaveLength(1)
    expect(report.problems[0]).toMatchObject({ kind: 'missing', path: '.' })
  })

  it.each([undefined, null, '', 42])('reports one clear problem for the root %p', async (bad_root) => {
    const report = await verifyRouting(bad_root)

    expect(report.problems).toHaveLength(1)
    expect(report.problems[0].kind).toBe('missing')
  })
})

describe('the checker itself', () => {
  it('reads only — the fixture tree is unchanged after a run', async () => {
    const fixture_root = fixture('multiple-violations')
    const agents_path = join(fixture_root, '.claude', 'agents')
    const before = await readdir(agents_path)
    const before_stats = await Promise.all(before.map(async (file_name) => {
      const file_stat = await stat(join(agents_path, file_name))
      return `${file_name}:${file_stat.size}:${file_stat.mtimeMs}`
    }))

    await verifyRouting(fixture_root)

    const after = await readdir(agents_path)
    const after_stats = await Promise.all(after.map(async (file_name) => {
      const file_stat = await stat(join(agents_path, file_name))
      return `${file_name}:${file_stat.size}:${file_stat.mtimeMs}`
    }))

    expect(after_stats).toEqual(before_stats)
  })

  it('gives every problem a kind, a relative POSIX path, and a human-readable detail', async () => {
    const report = await verifyRouting(fixture('multiple-violations'))

    for (const found of report.problems) {
      expect(['missing', 'leftover', 'malformed', 'wrong-value']).toContain(found.kind)
      expect(found.path.startsWith('/')).toBe(false)
      expect(found.path).not.toContain('\\')
      expect(found.detail.length).toBeGreaterThan(0)
    }
  })
})
