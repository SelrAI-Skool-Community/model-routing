/**
 * verifyRouting — the single seam for "is the model-routing bundle correctly installed?".
 *
 * Read-only. It never writes, creates, or repairs anything. It collects every problem it finds in
 * one pass and never short-circuits, so a caller fixes an install in one go rather than one error
 * at a time.
 *
 * Extending it: add an assertion function to the `assertions` array below. An assertion takes the
 * install root and resolves to an array of problems (empty when satisfied). It must never throw —
 * an unreadable or absent file is a problem to report, not an exception to raise.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

/** The four problem kinds, as named in the spec. */
export const PROBLEM_KINDS = Object.freeze({
  MISSING: 'missing',
  LEFTOVER: 'leftover',
  MALFORMED: 'malformed',
  WRONG_VALUE: 'wrong-value'
})

/** The five agent definitions, and the model/effort pair each one pins. */
export const EXPECTED_AGENTS = Object.freeze({
  'opus-medium': { model: 'opus-5', effort: 'medium' },
  'opus-high': { model: 'opus-5', effort: 'high' },
  'fable-medium': { model: 'fable-5', effort: 'medium' },
  'fable-high': { model: 'fable-5', effort: 'high' },
  'sonnet-high': { model: 'sonnet-5', effort: 'high' }
})

/**
 * Keys an agent definition may carry. `model` and `effort` are the pinned pair; `name` is how
 * Claude Code keys the agent; `description` is the neutral one-liner. Anything else is role
 * framing or configuration the design says these agents must not carry.
 */
const ALLOWED_AGENT_KEYS = Object.freeze(['name', 'description', 'model', 'effort'])

const AGENTS_DIR = '.claude/agents'
const FRONTMATTER_FENCE = '---'
const FRONTMATTER_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):[ \t]*(.*)$/

/**
 * The Codex config, and the one key the bundle owns in it. Codex's stated default is Sol at high;
 * a config left at anything else silently contradicts it. Every other key in that file belongs to
 * the user and is none of the checker's business — see bundle/README.md.
 *
 * The assignment pattern accepts both TOML string forms and a trailing comment, because this key
 * lives in a config the user hand-maintains: `effort = 'high'  # the ceiling` is a correct config,
 * and reporting it as wrong would be a false alarm on exactly the file we asked them to keep.
 */
const CODEX_CONFIG = '.codex/config.toml'
const CODEX_EFFORT_KEY = 'model_reasoning_effort'
const CODEX_EFFORT_VALUE = 'high'
const TOML_TABLE_HEADER = /^[ \t]*\[/
const TOML_STRING_ASSIGNMENT = /^[ \t]*([A-Za-z0-9_-]+)[ \t]*=[ \t]*(?:"([^"]*)"|'([^']*)')[ \t]*(?:#.*)?$/

function problem(kind, path, detail) {
  return { kind, path, detail }
}

async function isDirectory(candidate_path) {
  try {
    const entry_stat = await stat(candidate_path)
    return entry_stat.isDirectory()
  } catch {
    return false
  }
}

/**
 * Parse a strict, minimal frontmatter block: an opening `---`, a closing `---`, and simple
 * `key: value` lines in between. Deliberately not a YAML parser — agent definitions are a fixed
 * handful of scalar keys, and anything richer is malformed for this purpose.
 *
 * Returns `{ error }` when the block cannot be parsed, otherwise `{ values, body }`.
 */
function parseFrontmatter(file_text) {
  const lines = file_text.split(/\r?\n/)

  if (lines[0] !== FRONTMATTER_FENCE) {
    return { error: 'file does not open with a --- frontmatter fence' }
  }

  const closing_index = lines.indexOf(FRONTMATTER_FENCE, 1)

  if (closing_index === -1) {
    return { error: 'frontmatter is never closed by a --- fence' }
  }

  const values = new Map()

  for (const line of lines.slice(1, closing_index)) {
    const match = line.match(FRONTMATTER_LINE)

    if (!match) {
      return { error: `frontmatter line is not a "key: value" pair: ${JSON.stringify(line)}` }
    }

    const [, key, value] = match

    if (values.has(key)) {
      return { error: `frontmatter repeats the key "${key}"` }
    }

    values.set(key, value.trim())
  }

  return { values, body: lines.slice(closing_index + 1).join('\n') }
}

function checkAgentFile(agent_name, agent_path, file_text) {
  const expected = EXPECTED_AGENTS[agent_name]
  const parsed = parseFrontmatter(file_text)

  if (parsed.error) {
    return [problem(PROBLEM_KINDS.MALFORMED, agent_path, `frontmatter is unparseable: ${parsed.error}`)]
  }

  const problems = []
  const { values, body } = parsed

  const actual_model = values.get('model')

  if (actual_model !== expected.model) {
    problems.push(problem(
      PROBLEM_KINDS.WRONG_VALUE,
      agent_path,
      `model should be "${expected.model}", found ${actual_model === undefined ? 'no model key' : `"${actual_model}"`}`
    ))
  }

  const actual_effort = values.get('effort')

  if (actual_effort !== expected.effort) {
    problems.push(problem(
      PROBLEM_KINDS.WRONG_VALUE,
      agent_path,
      `effort should be "${expected.effort}", found ${actual_effort === undefined ? 'no effort key' : `"${actual_effort}"`}`
    ))
  }

  const actual_name = values.get('name')

  if (actual_name !== agent_name) {
    problems.push(problem(
      PROBLEM_KINDS.WRONG_VALUE,
      agent_path,
      `name should be "${agent_name}", found ${actual_name === undefined ? 'no name key' : `"${actual_name}"`}`
    ))
  }

  for (const key of values.keys()) {
    if (!ALLOWED_AGENT_KEYS.includes(key)) {
      problems.push(problem(
        PROBLEM_KINDS.WRONG_VALUE,
        agent_path,
        `frontmatter key "${key}" is not allowed; agents pin only model and effort`
      ))
    }
  }

  if (body.trim() !== '') {
    problems.push(problem(
      PROBLEM_KINDS.WRONG_VALUE,
      agent_path,
      'agent has a prompt body; these agents must carry no prompt or role framing'
    ))
  }

  return problems
}

/**
 * Assertion: `.claude/agents/` holds exactly the five expected agent definitions, each with valid
 * frontmatter pinning the designed model/effort pair and no prompt body.
 */
async function assertAgents(install_root) {
  const agents_path = join(install_root, '.claude', 'agents')

  if (!(await isDirectory(agents_path))) {
    return [problem(PROBLEM_KINDS.MISSING, AGENTS_DIR, 'the agents directory is missing')]
  }

  let dir_entries

  try {
    dir_entries = await readdir(agents_path, { withFileTypes: true })
  } catch (error) {
    return [problem(PROBLEM_KINDS.MISSING, AGENTS_DIR, `the agents directory could not be read: ${error.code ?? error.message}`)]
  }

  const problems = []
  const present_files = new Set(dir_entries.filter((entry) => entry.isFile()).map((entry) => entry.name))

  for (const file_name of [...present_files].sort()) {
    const agent_name = file_name.endsWith('.md') ? file_name.slice(0, -'.md'.length) : null

    if (agent_name === null || Object.hasOwn(EXPECTED_AGENTS, agent_name)) {
      continue
    }

    problems.push(problem(
      PROBLEM_KINDS.LEFTOVER,
      `${AGENTS_DIR}/${file_name}`,
      'unexpected file in the agents directory; exactly the five designed agents belong here'
    ))
  }

  for (const agent_name of Object.keys(EXPECTED_AGENTS)) {
    const file_name = `${agent_name}.md`
    const agent_path = `${AGENTS_DIR}/${file_name}`

    if (!present_files.has(file_name)) {
      problems.push(problem(PROBLEM_KINDS.MISSING, agent_path, 'agent definition is missing'))
      continue
    }

    let file_text

    try {
      file_text = await readFile(join(agents_path, file_name), 'utf8')
    } catch (error) {
      problems.push(problem(PROBLEM_KINDS.MALFORMED, agent_path, `agent definition could not be read: ${error.code ?? error.message}`))
      continue
    }

    problems.push(...checkAgentFile(agent_name, agent_path, file_text))
  }

  return problems
}

/**
 * Read a top-level string assignment out of a TOML file. Deliberately not a TOML parser — the
 * checker owns exactly one scalar key, and reading it is a line scan that stops at the first table
 * header so a same-named key under `[profiles.fast]` is never mistaken for the top-level one.
 *
 * Returns the value, or `undefined` when the key is not set at the top level.
 */
function readTopLevelTomlString(file_text, wanted_key) {
  for (const line of file_text.split(/\r?\n/)) {
    if (TOML_TABLE_HEADER.test(line)) {
      return undefined
    }

    const match = line.match(TOML_STRING_ASSIGNMENT)

    if (match && match[1] === wanted_key) {
      const [, , double_quoted, single_quoted] = match
      return double_quoted ?? single_quoted
    }
  }

  return undefined
}

/**
 * Assertion: `.codex/config.toml` exists and sets `model_reasoning_effort = "high"`.
 */
async function assertCodexConfig(install_root) {
  let file_text

  try {
    file_text = await readFile(join(install_root, '.codex', 'config.toml'), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return [problem(PROBLEM_KINDS.MISSING, CODEX_CONFIG, 'the Codex config is missing')]
    }

    return [problem(PROBLEM_KINDS.MALFORMED, CODEX_CONFIG, `the Codex config could not be read: ${error.code ?? error.message}`)]
  }

  const actual_effort = readTopLevelTomlString(file_text, CODEX_EFFORT_KEY)

  if (actual_effort === CODEX_EFFORT_VALUE) {
    return []
  }

  return [problem(
    PROBLEM_KINDS.WRONG_VALUE,
    CODEX_CONFIG,
    `${CODEX_EFFORT_KEY} should be "${CODEX_EFFORT_VALUE}", found ${actual_effort === undefined ? `no ${CODEX_EFFORT_KEY} key` : `"${actual_effort}"`}`
  )]
}

/**
 * The registered assertions. Later tickets append here: the CLAUDE.md routing section, the
 * delegate-to-codex skill, and the leftover/deletion checks.
 */
const assertions = [
  assertAgents,
  assertCodexConfig
]

/**
 * Inspect an installed model-routing bundle.
 *
 * @param {string} install_root Directory the bundle is installed under — `bundle/` in this repo,
 *   a fixture directory under test, a real install root in anger.
 * @returns {Promise<{ ok: boolean, problems: Array<{ kind: string, path: string, detail: string }>}>}
 *   `path` is relative to the install root and always POSIX-style.
 */
export async function verifyRouting(install_root) {
  if (typeof install_root !== 'string' || install_root === '' || !(await isDirectory(install_root))) {
    return {
      ok: false,
      problems: [problem(PROBLEM_KINDS.MISSING, '.', `install root does not exist or is not a directory: ${String(install_root)}`)]
    }
  }

  const collected = await Promise.all(assertions.map((assertion) => assertion(install_root)))
  const problems = collected.flat()

  return { ok: problems.length === 0, problems }
}

export default verifyRouting
