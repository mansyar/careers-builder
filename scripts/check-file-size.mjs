#!/usr/bin/env node

/**
 * File size check script for pre-commit hooks.
 * Exits with error if any file exceeds 500 lines.
 *
 * Usage:
 *   node scripts/check-file-size.mjs <file1> [file2] ...
 *   node scripts/check-file-size.mjs (reads from stdin, one file per line)
 */

const MAX_LINES = 500

const EXCLUDED_PATTERNS = [
  /routeTree\.gen\.ts$/,
  /[/\\]dist[/\\]/,
  /[/\\]coverage[/\\]/,
  /[/\\]node_modules[/\\]/,
]

function isExcluded(filePath) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath))
}

async function checkFile(filePath) {
  if (isExcluded(filePath)) {
    return null // Skip excluded files
  }

  const fs = await import('node:fs')
  const content = fs.readFileSync(filePath, 'utf-8')
  const lineCount = content.split('\n').length

  if (lineCount > MAX_LINES) {
    return { filePath, lineCount }
  }

  return null
}

async function main() {
  const args = process.argv.slice(2)
  let files = args

  // If no args, read from stdin (for lint-staged)
  if (files.length === 0 && !process.stdin.isTTY) {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    const stdin = Buffer.concat(chunks).toString('utf-8').trim()
    files = stdin.split('\n').map((f) => f.trim()).filter(Boolean)
  }

  if (files.length === 0) {
    process.exit(0)
  }

  const results = await Promise.all(files.map(checkFile))
  const violations = results.filter(Boolean)

  if (violations.length > 0) {
    for (const { filePath, lineCount } of violations) {
      console.error(
        `ERROR: ${filePath} has ${lineCount} lines (max allowed: ${MAX_LINES}). ` +
          `Refactor to keep files under ${MAX_LINES} lines.`,
      )
    }
    process.exit(1)
  }
}

main()
