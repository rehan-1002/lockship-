import fs from 'node:fs/promises'
import path from 'node:path'
import { getTrackedFiles } from '../utils/git.js'
import type { Issue } from '../types.js'

// Files that are served to the browser
const FRONTEND_PATTERNS = ['src/app/', 'src/pages/', 'src/components/', 'src/lib/', 'src/utils/', 'public/']
const DANGEROUS_KEY_PATTERNS = [
  { name: 'Supabase service-role key', pattern: /supabase.*service[_-]?role/i },
  { name: 'Stripe secret key', pattern: /sk_(?:live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'Firebase admin credential', pattern: /firebase[_-]?admin|serviceAccountKey/i },
  { name: 'Admin/root password', pattern: /(?:admin|root)[_-]?(?:password|passwd|pwd)\s*[:=]/i },
]

export async function scanFrontendKeys(): Promise<Issue[]> {
  const files = await getTrackedFiles()
  const issues: Issue[] = []

  const frontendFiles = files.filter(f =>
    FRONTEND_PATTERNS.some(prefix => f.replace(/\\/g, '/').includes(prefix))
  )

  for (const file of frontendFiles) {
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const { name, pattern } of DANGEROUS_KEY_PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            type: 'frontend-secret',
            file,
            line: i + 1,
            message: `${name} found in a frontend file — this is exposed to the browser!`,
            fix: 'Move to a server-side route or API handler, never expose admin keys to the client',
          })
          break
        }
      }
    }
  }

  return issues
}
