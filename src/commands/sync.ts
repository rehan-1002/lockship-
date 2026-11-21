import * as p from '@clack/prompts'
import pc from 'picocolors'
import fs from 'node:fs/promises'
import path from 'node:path'
import { readRules } from '../utils/rules.js'

const AI_EDITOR_FILES = [
  { file: '.cursorrules', label: 'Cursor' },
  { file: 'CLAUDE.md', label: 'Claude' },
  { file: 'GEMINI.md', label: 'Gemini' },
  { file: '.windsurfrules', label: 'Windsurf' },
]

const LOCKSHIP_BLOCK_START = '<!-- lockship:start -->'
const LOCKSHIP_BLOCK_END = '<!-- lockship:end -->'

export async function sync(opts?: { silent?: boolean }) {
  if (!opts?.silent) {
    p.intro(pc.bgCyan(pc.black(' 🔒 Lockship — Sync ')))
  }

  const rules = await readRules()
  const block = buildRulesBlock(rules)
  const synced: string[] = []
  const cwd = process.cwd()

  for (const { file, label } of AI_EDITOR_FILES) {
    const filePath = path.join(cwd, file)
    let existing = ''

    try {
      existing = await fs.readFile(filePath, 'utf8')
    } catch {
      // file doesn't exist yet — create it
    }

    const updated = injectBlock(existing, block)
    await fs.writeFile(filePath, updated, 'utf8')
    synced.push(label)
  }

  if (!opts?.silent) {
    p.outro(pc.green(`✅ Synced rules to: ${synced.join(', ')}`))
  }
}

function buildRulesBlock(rules: string[]): string {
  const lines = rules.map(r => `- ${r}`).join('\n')
  return `${LOCKSHIP_BLOCK_START}\n## Lockship Security Rules\n\n${lines}\n${LOCKSHIP_BLOCK_END}`
}

function injectBlock(existing: string, block: string): string {
  if (existing.includes(LOCKSHIP_BLOCK_START)) {
    // Replace existing block
    const regex = new RegExp(`${LOCKSHIP_BLOCK_START}[\\s\\S]*?${LOCKSHIP_BLOCK_END}`, 'g')
    return existing.replace(regex, block)
  }
  // Append block
  return existing ? `${existing}\n\n${block}\n` : `${block}\n`
}
