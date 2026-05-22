import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Prevent native Node.js modules from being served to the client.
    // The route tree imports all route files, including API routes that
    // statically import DatabaseManager → better-sqlite3 (native module).
    // This plugin returns an empty stub for client-side resolves only.
    {
      name: 'strip-native-modules',
      resolveId(source, _importer, options) {
        if (options?.ssr) return undefined
        if (source === 'better-sqlite3' || source === 'sqlite-vec') {
          return '\0strip:' + source
        }
        return undefined
      },
      load(id) {
        if (id.startsWith('\0strip:')) {
          return 'export default {};'
        }
        return undefined
      },
    },
  ],
})

export default config
