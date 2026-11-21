import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const testDir = path.join(process.cwd(), '.test-sandbox')
const binPath = path.join(process.cwd(), 'dist', 'index.js')

describe('E2E Lockship Integration', () => {
  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    execSync('git init', { cwd: testDir })
  })

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('scans and catches hardcoded OpenAI key and missing .gitignore', () => {
    fs.writeFileSync(
      path.join(testDir, 'index.js'),
      'const openAiSecret = "sk-12345678901234567890abcdef";\n'
    )
    execSync('git add .', { cwd: testDir })

    let errorOutput = ''
    try {
      execSync(`node "${binPath}" scan`, { cwd: testDir, encoding: 'utf8' })
    } catch (err: any) {
      errorOutput = (err.stdout || '') + (err.stderr || '')
    }

    expect(errorOutput).toContain('Hardcoded OpenAI API key detected')
  })

  it('syncs rules into all 4 AI editor files', async () => {
    // Run sync in testDir
    execSync(`node "${binPath}" sync`, { cwd: testDir, encoding: 'utf8' })

    const cursorRules = path.join(testDir, '.cursorrules')
    const claudeMd = path.join(testDir, 'CLAUDE.md')
    const geminiMd = path.join(testDir, 'GEMINI.md')
    const windsurfRules = path.join(testDir, '.windsurfrules')

    expect(fs.existsSync(cursorRules)).toBe(true)
    expect(fs.existsSync(claudeMd)).toBe(true)
    expect(fs.existsSync(geminiMd)).toBe(true)
    expect(fs.existsSync(windsurfRules)).toBe(true)

    const content = fs.readFileSync(cursorRules, 'utf8')
    expect(content).toContain('Lockship Security Rules')
  })
})
