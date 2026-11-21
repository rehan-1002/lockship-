import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { scanPackages } from '../src/scanners/packages.js'

const testDir = path.join(process.cwd(), '.test-packages-sandbox')

describe('Hallucinated Package Scanner', () => {
  const originalCwd = process.cwd()

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.chdir(originalCwd)
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('flags packages that return 404 on npm (hallucination)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('fake-hallucinated-package')) {
        return { status: 404 } as Response
      }
      return { status: 200 } as Response
    })

    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          'fake-hallucinated-package': '^1.0.0',
        },
      })
    )

    const issues = await scanPackages()
    expect(issues.length).toBe(1)
    expect(issues[0].type).toBe('hallucinated-package')
    expect(issues[0].message).toContain('does not exist on npm')
  })

  it('passes cleanly for legitimate packages (200 on npm)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 200 } as Response)

    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          'commander': '^12.1.0',
        },
      })
    )

    const issues = await scanPackages()
    expect(issues.length).toBe(0)
  })

  it('ignores workspace, file, and link monorepo dependencies without querying npm', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          'my-workspace-package': 'workspace:*',
          'local-lib': 'file:../local-lib',
          'linked-dep': 'link:./linked-dep',
        },
      })
    )

    const issues = await scanPackages()
    expect(issues.length).toBe(0)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('properly encodes scoped packages when querying npm', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 200 } as Response)

    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@clack/prompts': '^0.9.1',
        },
      })
    )

    await scanPackages()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://registry.npmjs.org/@clack%2Fprompts/latest',
      expect.anything()
    )
  })
})
