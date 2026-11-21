import fs from 'node:fs/promises'
import path from 'node:path'

export async function fixEnvNotGitignored(): Promise<void> {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  let existing = ''

  try {
    existing = await fs.readFile(gitignorePath, 'utf8')
  } catch {
    // doesn't exist yet
  }

  if (!existing.includes('.env')) {
    const updated = existing
      ? `${existing.trimEnd()}\n.env\n`
      : '.env\n'
    await fs.writeFile(gitignorePath, updated, 'utf8')
  }
}
