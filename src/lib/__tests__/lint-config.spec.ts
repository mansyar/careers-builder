import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()

describe('ESLint configuration', () => {
  it('should have an eslint.config.js file at project root', () => {
    const configPath = resolve(projectRoot, 'eslint.config.js')
    expect(existsSync(configPath)).toBe(true)
  })
})

describe('Prettier configuration', () => {
  it('should have a valid .prettierrc JSON file', () => {
    const configPath = resolve(projectRoot, '.prettierrc')
    expect(existsSync(configPath)).toBe(true)

    const content = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)

    expect(config).toHaveProperty('singleQuote', true)
    expect(config).toHaveProperty('trailingComma', 'all')
    expect(config).toHaveProperty('printWidth', 100)
    expect(config).toHaveProperty('semi', true)
  })

  it('should have a .prettierignore file excluding generated files', () => {
    const ignorePath = resolve(projectRoot, '.prettierignore')
    expect(existsSync(ignorePath)).toBe(true)

    const content = readFileSync(ignorePath, 'utf-8')
    expect(content).toContain('routeTree.gen.ts')
    expect(content).toContain('dist/')
    expect(content).toContain('node_modules/')
  })
})
