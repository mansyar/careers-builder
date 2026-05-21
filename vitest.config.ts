import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'scripts/**/*.spec.mjs',
    ],
    coverage: {
      enabled: true,
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/routeTree.gen.ts',
        'src/router.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
    },
  },
})
