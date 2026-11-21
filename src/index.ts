#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('lockship')
  .description('🔒 Security guardrail for AI-assisted (vibe-coded) projects')
  .version('0.1.0')

program
  .command('init')
  .description('Create lockship.rules, sync to AI editor files, install pre-push hook')
  .action(async () => {
    const { init } = await import('./commands/init.js')
    await init()
  })

program
  .command('sync')
  .description('Sync lockship.rules to all AI editor config files')
  .action(async () => {
    const { sync } = await import('./commands/sync.js')
    await sync()
  })

program
  .command('scan')
  .description('Scan repo for common AI-generated security mistakes')
  .option('-i, --interactive', 'Show fixes and prompt to auto-apply')
  .action(async (options) => {
    const { scan } = await import('./commands/scan.js')
    await scan(options)
  })

program
  .command('deploy')
  .description('Run security scan then deploy with Vercel')
  .action(async () => {
    const { deploy } = await import('./commands/deploy.js')
    await deploy()
  })

program.parse()
