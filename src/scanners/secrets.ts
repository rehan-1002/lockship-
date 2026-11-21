import fs from 'node:fs/promises'
import path from 'node:path'
import { getTrackedFiles } from '../utils/git.js'
import type { Issue } from '../types.js'

// Common secret patterns with their names
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Generic API key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([A-Za-z0-9_\-]{20,})['"`]/i },
  { name: 'Generic secret', pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"`]([A-Za-z0-9_\-!@#$%^&*]{8,})['"`]/i },
  { name: 'Bearer token', pattern: /bearer\s+['"`]?([A-Za-z0-9\-._~+/]{20,})['"`]?/i },
  { name: 'Supabase anon/service key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]{10,}/},
  { name: 'OpenAI API key', pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'GitHub token', pattern: /gh[ps]_[A-Za-z0-9]{36}/ },
  { name: 'Stripe secret key', pattern: /sk_(?:live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
]

const SKIP_EXTENSIONS = new Set(['.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.woff2','.ttf','.eot','.mp4','.mp3','.pdf','.zip'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage'])

export async function scanSecrets(): Promise<Issue[]> {
  const files = await getTrackedFiles()
  const issues: Issue[] = []

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const parts = file.split(/[\\/]/)
    if (SKIP_EXTENSIONS.has(ext)) continue
    if (parts.some(p => SKIP_DIRS.has(p))) continue
    if (file === '.env' || file.endsWith('.env')) continue

    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            type: 'hardcoded-secret',
            file,
            line: i + 1,
            message: `Hardcoded ${name} detected`,
            fix: `Move to .env and replace with process.env.YOUR_KEY_NAME`,
          })
          break // one issue per line
        }
      }
    }
  }

  return issues
}
