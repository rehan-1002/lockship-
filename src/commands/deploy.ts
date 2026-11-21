import * as p from '@clack/prompts'
import pc from 'picocolors'
import { execSync } from 'node:child_process'
import { scan } from './scan.js'

export async function deploy() {
  p.intro(pc.bgCyan(pc.black(' 🔒 Lockship — Deploy ')))

  console.log(pc.dim('Running security scan before deploy...\n'))
  const result = await scan({ interactive: true })

  if (!result.passed) {
    p.cancel('Deploy blocked — fix security issues first.')
    process.exit(1)
  }

  const spinner = p.spinner()
  spinner.start('Deploying with Vercel...')

  try {
    execSync('vercel --prod', { stdio: 'inherit' })
    spinner.stop(pc.green('Deployed successfully!'))
  } catch {
    spinner.stop(pc.red('Vercel deploy failed.'))
    process.exit(1)
  }

  p.outro(pc.green('🚀 Ship secured and deployed!'))
}
