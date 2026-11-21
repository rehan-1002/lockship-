import * as p from '@clack/prompts'
import pc from 'picocolors'
import { runAllScanners } from '../scanners/index.js'
import { applyFix } from '../fixers/index.js'
import type { Issue } from '../types.js'

interface ScanOptions {
  interactive?: boolean
}

export async function scan(opts: ScanOptions = {}) {
  p.intro(pc.bgCyan(pc.black(' 🔒 Lockship — Scan ')))

  const spinner = p.spinner()
  spinner.start('Scanning your project...')
  const issues = await runAllScanners()
  spinner.stop()

  if (issues.length === 0) {
    p.outro(
      pc.green('✅ All clear — no security issues found.\n') +
      pc.dim(`  ☕ Lockship is free & open source → ${pc.underline('https://buymeacoffee.com/rehan1002')}`)
    )
    return { passed: true, issues: [] }
  }

  // Print issues
  console.log(pc.red(`\n🔴 Lockship found ${issues.length} issue${issues.length > 1 ? 's' : ''}:\n`))
  issues.forEach((issue, i) => printIssue(issue, i + 1))

  if (!opts.interactive) {
    p.outro(pc.yellow('Run with --interactive to auto-fix issues.'))
    process.exitCode = 1
    return { passed: false, issues }
  }

  // Interactive fix loop
  for (const issue of issues) {
    console.log()
    printIssue(issue)

    const confirm = await p.confirm({
      message: `Apply auto-fix?`,
    })

    if (p.isCancel(confirm)) {
      p.cancel('Scan cancelled.')
      process.exit(1)
    }

    if (confirm) {
      const fixSpinner = p.spinner()
      fixSpinner.start('Applying fix...')
      await applyFix(issue)
      fixSpinner.stop(pc.green('Fix applied'))
    }
  }

  p.outro(pc.green('✅ Scan complete.'))
  return { passed: true, issues }
}

function printIssue(issue: Issue, index?: number) {
  const prefix = index ? `  ${pc.bold(String(index))}.` : '  •'
  console.log(`${prefix} ${pc.cyan(issue.file)}${issue.line ? pc.dim(`:${issue.line}`) : ''}`)
  console.log(`     ${pc.yellow(issue.message)}`)
  if (issue.fix) {
    console.log(`     ${pc.dim('Fix:')} ${issue.fix}`)
  }
}
