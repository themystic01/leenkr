import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Hashed asset names are only known after bundling, so the service worker's
// precache list is written into dist/sw.js at the end of the build.
function precacheServiceWorker(): Plugin {
  return {
    name: 'leenkr-precache-service-worker',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir ?? 'dist'
      const assets = Object.keys(bundle)
        .filter((file) => /\.(js|css)$/.test(file))
        .map((file) => `/${file}`)
      const precache = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        ...assets,
      ]
      const template = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8')
      writeFileSync(
        join(outDir, 'sw.js'),
        `self.__LEENKR_PRECACHE__ = ${JSON.stringify(precache, null, 2)}\n` + template,
      )
      console.log(`[sw] precached ${precache.length} entries`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheServiceWorker()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Agent skill directories live in this folder; keep them out of the dev scan.
    watch: {
      ignored: [
        '**/agent/**',
        '**/.agent/**',
        '**/.agents/**',
        '**/.claude/**',
        '**/.codex/**',
        '**/.cursor/**',
        '**/.gemini/**',
        '**/.opencode/**',
      ],
    },
  },
  optimizeDeps: { entries: ['index.html'] },
})
