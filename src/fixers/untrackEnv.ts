import { execSync } from 'node:child_process'
import { fixEnvNotGitignored } from './gitignore.js'

export async function fixEnvTracked(): Promise<void> {
  // First make sure .env is in .gitignore
  await fixEnvNotGitignored()

  // Remove .env from git tracking (keep the file locally)
  execSync('git rm --cached .env', { stdio: 'pipe', cwd: process.cwd() })
}
