import { scanSecrets } from './secrets.js'
import { scanGitIgnore } from './gitignore.js'
import { scanPackages } from './packages.js'
import { scanFrontendKeys } from './patterns.js'
import type { Issue } from '../types.js'

export async function runAllScanners(): Promise<Issue[]> {
  const results = await Promise.all([
    scanSecrets(),
    scanGitIgnore(),
    scanPackages(),
    scanFrontendKeys(),
  ])
  return results.flat()
}
