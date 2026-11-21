import * as p from '@clack/prompts'
import pc from 'picocolors'
import { sync } from './sync.js'
import { installGitHook } from '../utils/git.js'
import { createDefaultRules } from '../utils/rules.js'

export async function init() {
  p.intro(pc.bgCyan(pc.black(' 🔒 Lockship — Init ')))

  const spinner = p.spinner()

  spinner.start('Creating lockship.rules...')
  await createDefaultRules()
  spinner.stop(pc.green('lockship.rules created'))

  spinner.start('Syncing rules to AI editor files...')
  await sync({ silent: true })
  spinner.stop(pc.green('Rules synced to AI editor files'))

  spinner.start('Installing pre-push git hook...')
  await installGitHook()
  spinner.stop(pc.green('Pre-push hook installed'))

  p.outro(
    pc.green('✅ Lockship initialized!') +
    '\n\n' +
    pc.dim('  Every git push is now protected.\n') +
    pc.dim(`  ☕ Lockship is free & open source → ${pc.underline('https://buymeacoffee.com/rehan1002')}`)
  )
}
