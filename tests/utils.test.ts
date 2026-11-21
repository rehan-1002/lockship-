import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createDefaultRules, readRules } from '../src/utils/rules.js'
import { installGitHook } from '../src/utils/git.js'

const testDir = path.join(process.cwd(), '.test-utils-sandbox')

describe('Lockship Utils (Rules & Git Hook)', () => {
  const originalCwd = process.cwd()

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('creates lockship.rules YAML file with correct default content and funding link', async () => {
    await createDefaultRules()
    const rulesPath = path.join(testDir, 'lockship.rules')
    expect(fs.existsSync(rulesPath)).toBe(true)

    const content = fs.readFileSync(rulesPath, 'utf8')
    expect(content).toContain('Lockship Security Rules')
    expect(content).toContain('buymeacoffee.com/rehan1002')
  })

  it('reads rules from lockship.rules YAML', async () => {
    fs.writeFileSync(
      path.join(testDir, 'lockship.rules'),
      'rules:\n  - "Custom rule 1"\n  - "Custom rule 2"\n'
    )
    const rules = await readRules()
    expect(rules).toEqual(['Custom rule 1', 'Custom rule 2'])
  })

  it('installs pre-push git hook correctly', async () => {
    fs.mkdirSync(path.join(testDir, '.git'), { recursive: true })
    await installGitHook()

    const hookPath = path.join(testDir, '.git', 'hooks', 'pre-push')
    expect(fs.existsSync(hookPath)).toBe(true)

    const hookContent = fs.readFileSync(hookPath, 'utf8')
    expect(hookContent).toContain('npx lockship scan --interactive')
  })
})
