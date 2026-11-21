import fs from 'node:fs/promises'
import path from 'node:path'
import { getTrackedFiles } from '../utils/git.js'
import type { Issue } from '../types.js'

// Specific vendor patterns first, generic fallback at the end
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'OpenAI API key', pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'Stripe secret key', pattern: /sk_(?:live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'GitHub token', pattern: /gh[ps]_[A-Za-z0-9]{36}/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Supabase anon/service key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]{10,}/ },
  { name: 'Bearer token', pattern: /bearer\s+['"`]?([A-Za-z0-9\-._~+/]{20,})['"`]?/i },
  { name: 'Generic API key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([A-Za-z0-9_\-]{20,})['"`]/i },
  { name: 'Generic secret', pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"`]([A-Za-z0-9_\-!@#$%^&*]{8,})['"`]/i },
]

const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.pdf', '.zip', '.tar', '.gz', '.tgz',
  '.wasm', '.bin', '.exe', '.dll', '.so', '.dylib',
  '.map', '.min.js', '.min.css',
])

const SKIP_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
])

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', '.next', 'build', 'coverage', '.turbo', '.output'
])

// Maximum file size to scan (1MB) to prevent OOM on giant dumps/logs
const MAX_FILE_SIZE = 1024 * 1024

const PLACEHOLDER_PATTERN = /(?:your[_-]api[_-]key|your[_-]secret|your[_-]token|placeholder|dummy|example[_-]|replace[_-]this)/i

export async function scanSecrets(): Promise<Issue[]> {
  const files = await getTrackedFiles()
  const issues: Issue[] = []

  for (const file of files) {
    const filename = path.basename(file)
    const ext = path.extname(file).toLowerCase()
    const parts = file.split(/[\\/]/)

    if (SKIP_FILES.has(filename)) continue
    if (SKIP_EXTENSIONS.has(ext)) continue
    if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) continue
    if (parts.some(p => SKIP_DIRS.has(p))) continue
    if (file === '.env' || file.endsWith('.env')) continue

    try {
      const stat = await fs.stat(file)
      if (stat.size > MAX_FILE_SIZE) continue
    } catch {
      continue
    }

    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip obvious placeholders / examples
      if (PLACEHOLDER_PATTERN.test(line)) continue

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
