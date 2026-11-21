import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

export async function installGitHook(): Promise<void> {
  const cwd = process.cwd()
  const hooksDir = path.join(cwd, '.git', 'hooks')
  const hookPath = path.join(hooksDir, 'pre-push')

  const hookContent = [
    '#!/bin/sh',
    '# Installed by Lockship — https://github.com/rehan-1002/lockship-',
    'npx lockship scan --interactive',
    'exit $?',
  ].join('\n') + '\n'

  try {
    await fs.mkdir(hooksDir, { recursive: true })
    await fs.writeFile(hookPath, hookContent, 'utf8')
    // Make it executable on Unix/Mac
    try {
      execSync(`chmod +x "${hookPath}"`)
    } catch {
      // Windows — chmod not needed
    }
  } catch (err) {
    throw new Error(`Failed to install git hook: ${err}`)
  }
}

export function getTrackedFiles(): string[] {
  try {
    const output = execSync('git ls-files', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}
