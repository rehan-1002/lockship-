import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { scanFrontendKeys } from '../src/scanners/patterns.js'

const testDir = path.join(process.cwd(), '.test-frontend-sandbox')

describe('Frontend Exposed Secret Patterns Scanner', () => {
  const originalCwd = process.cwd()

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(path.join(testDir, 'src', 'components'), { recursive: true })
    fs.mkdirSync(path.join(testDir, 'src', 'server'), { recursive: true })
    execSync('git init', { cwd: testDir })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('flags Supabase service-role keys in frontend files', async () => {
    const frontendFile = path.join(testDir, 'src', 'components', 'Auth.tsx')
    fs.writeFileSync(
      frontendFile,
      'const supabase = createClient(URL, supabase_service_role_key);\n'
    )
    execSync('git add .', { cwd: testDir })

    const issues = await scanFrontendKeys()
    expect(issues.length).toBe(1)
    expect(issues[0].type).toBe('frontend-secret')
    expect(issues[0].message).toContain('Supabase service-role key found in a frontend file')
  })

  it('does not flag secrets in backend/server files', async () => {
    const serverFile = path.join(testDir, 'src', 'server', 'db.ts')
    fs.writeFileSync(
      serverFile,
      'const supabase = createClient(URL, supabase_service_role_key);\n'
    )
    execSync('git add .', { cwd: testDir })

    const issues = await scanFrontendKeys()
    expect(issues.length).toBe(0)
  })
})
