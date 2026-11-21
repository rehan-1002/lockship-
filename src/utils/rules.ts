import fs from 'node:fs/promises'
import path from 'node:path'

const RULES_FILE = 'lockship.rules'

const DEFAULT_RULES = [
  'Never hardcode API keys, tokens, or secrets directly in source files',
  'Always store secrets in .env files and reference them via process.env',
  'Always add .env to .gitignore before creating it',
  'Never commit .env files to version control',
  'Never put service-role keys, admin credentials, or secret keys in frontend files',
  'Always verify npm package names before installing — AI can hallucinate package names',
  'Use environment variables for all third-party service credentials',
  'Supabase: use anon key on the client, service-role key only on the server',
  'Stripe: use publishable key on the client, secret key only on the server',
  'Firebase: never include serviceAccountKey.json in frontend code',
]

export async function createDefaultRules(): Promise<void> {
  const rulesPath = path.join(process.cwd(), RULES_FILE)

  try {
    await fs.access(rulesPath)
    // Already exists — don't overwrite
    return
  } catch {
    // Create it
  }

  const content = [
    '# Lockship Security Rules',
    '# These rules are automatically synced to your AI editor config files.',
    '# Edit this file and run `lockship sync` to update all editor files.',
    '',
    'rules:',
    ...DEFAULT_RULES.map(r => `  - "${r}"`),
    '',
    '# Your Buy Me a Coffee link (shown on clean pushes)',
    'funding: "https://buymeacoffee.com/rehan1002"',
    '',
  ].join('\n')

  await fs.writeFile(rulesPath, content, 'utf8')
}

export async function readRules(): Promise<string[]> {
  const rulesPath = path.join(process.cwd(), RULES_FILE)

  try {
    const { load } = await import('js-yaml')
    const content = await fs.readFile(rulesPath, 'utf8')
    const parsed = load(content) as { rules?: string[] }
    return parsed?.rules ?? []
  } catch {
    return DEFAULT_RULES
  }
}
