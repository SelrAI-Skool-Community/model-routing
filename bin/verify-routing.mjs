#!/usr/bin/env node
/**
 * Run the checker against an install root and print the report.
 *
 *   node bin/verify-routing.mjs [installRoot]   (default: bundle)
 *
 * Exits 0 when the install is clean, 1 when any problem is reported.
 */

import { verifyRouting } from '../src/verifyRouting.js'

const install_root = process.argv[2] ?? 'bundle'
const report = await verifyRouting(install_root)

if (report.ok) {
  console.log(`ok — ${install_root} passes every registered assertion`)
  process.exit(0)
}

console.log(`${report.problems.length} problem(s) in ${install_root}:`)

for (const found of report.problems) {
  console.log(`  [${found.kind}] ${found.path} — ${found.detail}`)
}

process.exit(1)
