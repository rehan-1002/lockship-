import { fixEnvNotGitignored } from './gitignore.js'
import { fixEnvTracked } from './untrackEnv.js'
import type { Issue } from '../types.js'

export async function applyFix(issue: Issue): Promise<void> {
  switch (issue.type) {
    case 'env-not-gitignored':
      await fixEnvNotGitignored()
      break
    case 'env-tracked':
      await fixEnvTracked()
      break
    case 'hardcoded-secret':
    case 'frontend-secret':
    case 'hallucinated-package':
      // These require manual intervention or future LLM-assisted fix
      console.log('  ℹ️  This fix requires manual review — please address it directly.')
      break
  }
}
