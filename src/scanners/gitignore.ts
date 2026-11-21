import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import type { Issue } from '../types.js'

export async function scanGitIgnore(): Promise<Issue[]> {
  const issues: Issue[] = []
  const cwd = process.cwd()

  // Check if .env is tracked by git
  try {
    const tracked = execSync('git ls-files .env', { encoding: 'utf8', cwd }).trim()
    if (tracked) {
      issues.push({
        type: 'env-tracked',
        file: '.env',
        message: '.env is tracked by Git — your secrets are exposed!',
        fix: 'Remove from Git tracking and add to .gitignore',
      })
    }
  } catch {
    // not a git repo or no .env
  }

  // Check if .gitignore contains .env
  try {
    const gitignorePath = path.join(cwd, '.gitignore')
    const content = await fs.readFile(gitignorePath, 'utf8')
    const lines = content.split('\n').map(l => l.trim())
    const hasEnv = lines.some(l => l === '.env' || l === '*.env' || l === '.env*')

    if (!hasEnv) {
      issues.push({
        type: 'env-not-gitignored',
        file: '.gitignore',
        message: '.env is not in .gitignore',
        fix: 'Add .env to .gitignore',
      })
    }
  } catch {
    // no .gitignore at all
    issues.push({
      type: 'env-not-gitignored',
      file: '.gitignore',
      message: 'No .gitignore found — .env could be accidentally committed',
      fix: 'Create .gitignore and add .env to it',
    })
  }

  return issues
}
