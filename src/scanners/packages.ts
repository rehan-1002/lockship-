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

  const checks = Object.entries(allDeps).map(async ([pkg, version]) => {
    // Ignore local, workspace, or VCS dependencies
    if (typeof version === 'string') {
      const v = version.trim().toLowerCase()
      if (
        v.startsWith('workspace:') ||
        v.startsWith('file:') ||
        v.startsWith('link:') ||
        v.startsWith('portal:') ||
        v.startsWith('git:') ||
        v.startsWith('git+') ||
        v.startsWith('http:') ||
        v.startsWith('https:')
      ) {
        return
      }
    }

    // Scoped packages like @clack/prompts -> @clack%2Fprompts
    const encodedPkg = pkg.startsWith('@')
      ? pkg.replace('/', '%2F')
      : encodeURIComponent(pkg)

    try {
      const res = await fetch(`https://registry.npmjs.org/${encodedPkg}/latest`, {
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
      // network error or offline — skip, don't false-positive
    }
  })

  await Promise.all(checks)
  return issues
}
