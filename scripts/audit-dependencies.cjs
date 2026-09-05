const { readFileSync } = require('node:fs')
const { parse } = require('@yarnpkg/lockfile')

async function audit() {
  const lock = parse(readFileSync('yarn.lock', 'utf8'))
  if (lock.type !== 'success') throw new Error('Unable to parse yarn.lock')
  const packages = {}
  for (const [selector, entry] of Object.entries(lock.object)) {
    const name = selector.slice(0, selector.indexOf('@', 1))
    packages[name] = [...new Set([...(packages[name] || []), entry.version])]
  }
  const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packages),
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`Audit failed: HTTP ${response.status}`)
  const advisories = Object.entries(await response.json()).flatMap(([name, entries]) =>
    entries.map((entry) => ({ ...entry, name }))
  )
  const blocking = advisories.filter(({ severity }) => severity === 'high' || severity === 'critical')
  console.log(`Audited ${Object.keys(packages).length} packages from yarn.lock (all workspaces and dev dependencies).`)
  for (const advisory of advisories) console.log(`${advisory.severity}: ${advisory.module_name || advisory.name}: ${advisory.title} (${advisory.url})`)
  console.log(`${blocking.length} high/critical advisories; ${advisories.length} total.`)
  if (blocking.length) process.exitCode = 1
}

audit().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
