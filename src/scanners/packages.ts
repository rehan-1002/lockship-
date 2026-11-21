import fs from 'node:fs/promises'
import path from 'node:path'
import type { Issue } from '../types.js'

export async function scanPackages(): Promise<Issue[]> {
  const issues: Issue[] = []
  const cwd = process.cwd()

  let pkgJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }

  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    pkgJson = JSON.parse(raw)
  } catch {
    return []
  }

  const allDeps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  }

  const checks = Object.keys(allDeps).map(async (pkg) => {
    try {
      const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.status === 404) {
        issues.push({
          type: 'hallucinated-package',
          file: 'package.json',
          message: `Package "${pkg}" does not exist on npm — possible AI hallucination`,
          fix: `Remove "${pkg}" from dependencies and find the correct package name`,
        })
      }
    } catch {
      // network error — skip, don't false-positive
    }
  })

  await Promise.all(checks)
  return issues
}
