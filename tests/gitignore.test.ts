import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { scanGitIgnore } from '../src/scanners/gitignore.js'
import { fixEnvNotGitignored } from '../src/fixers/gitignore.js'

const testDir = path.join(process.cwd(), '.test-gitignore-sandbox')

describe('Gitignore & .env Tracking Scanner', () => {
  const originalCwd = process.cwd()

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    execSync('git init', { cwd: testDir })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('detects when no .gitignore exists at all', async () => {
    const issues = await scanGitIgnore()
    expect(issues.some(i => i.type === 'env-not-gitignored')).toBe(true)
  })

  it('detects when .gitignore exists but does not contain .env', async () => {
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules/\ndist/\n')
    const issues = await scanGitIgnore()
    expect(issues.some(i => i.type === 'env-not-gitignored')).toBe(true)
  })

  it('passes cleanly when .gitignore contains .env', async () => {
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules/\n.env\ndist/\n')
    const issues = await scanGitIgnore()
    expect(issues.some(i => i.type === 'env-not-gitignored')).toBe(false)
  })

  it('detects when .env is accidentally tracked by Git', async () => {
    fs.writeFileSync(path.join(testDir, '.env'), 'SECRET_KEY=12345\n')
    execSync('git add .env', { cwd: testDir })
    const issues = await scanGitIgnore()
    expect(issues.some(i => i.type === 'env-tracked')).toBe(true)
  })

  it('auto-fixes missing .env by appending it to .gitignore', async () => {
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules/\n')
    await fixEnvNotGitignored()
    const content = fs.readFileSync(path.join(testDir, '.gitignore'), 'utf8')
    expect(content).toContain('.env')

    // Re-scan should now pass for gitignore
    const issues = await scanGitIgnore()
    expect(issues.some(i => i.type === 'env-not-gitignored')).toBe(false)
  })
})
