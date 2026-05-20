import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

const scriptPath = resolve(import.meta.dirname, '..', 'check-file-size.mjs')

function createTempDir() {
  return mkdtempSync(join(tmpdir(), 'file-size-test-'))
}

function runCheck(...files) {
  // Quote each path to handle spaces
  const quoted = files.map((f) => `"${f}"`).join(' ')
  try {
    const stdout = execSync(`node "${scriptPath}" ${quoted}`, {
      encoding: 'utf-8',
    })
    return { exitCode: 0, stdout }
  } catch (e) {
    return {
      exitCode: e.status,
      stdout: e.stdout || '',
      stderr: e.stderr || '',
    }
  }
}

describe('check-file-size.mjs', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('should exit with code 0 when file is under 500 lines', () => {
    const filePath = join(tempDir, 'small-file.ts')
    writeFileSync(filePath, '// small file\n'.repeat(10))

    const result = runCheck(filePath)
    expect(result.exitCode).toBe(0)
  })

  it('should exit with code 1 and print error when file exceeds 500 lines', () => {
    const filePath = join(tempDir, 'large-file.ts')
    writeFileSync(filePath, '// large file\n'.repeat(501))

    const result = runCheck(filePath)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('ERROR')
    expect(result.stderr).toContain('lines (max allowed: 500)')
  })

  it('should skip excluded files (routeTree.gen.ts)', () => {
    const filePath = join(tempDir, 'routeTree.gen.ts')
    writeFileSync(filePath, '// generated\n'.repeat(501))

    const result = runCheck(filePath)
    expect(result.exitCode).toBe(0)
  })

  it('should skip excluded files (dist/)', () => {
    const distDir = join(tempDir, 'dist')
    mkdirSync(distDir, { recursive: true })
    const filePath = join(distDir, 'output.js')
    writeFileSync(filePath, '// bundled\n'.repeat(501))

    const result = runCheck(filePath)
    expect(result.exitCode).toBe(0)
  })

  it('should handle multiple files — fail if any exceeds 500 lines', () => {
    const smallFile = join(tempDir, 'small.ts')
    const largeFile = join(tempDir, 'large.ts')
    writeFileSync(smallFile, '// ok\n'.repeat(10))
    writeFileSync(largeFile, '// too big\n'.repeat(501))

    const result = runCheck(smallFile, largeFile)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('large.ts')
  })
})
