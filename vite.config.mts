import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// Emits sw.js with the hashed bundle files filled into its precache list.
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle)
        .filter((fileName) => /\.(js|css)$/.test(fileName))
        .map((fileName) => `/${fileName}`)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: readFileSync('src/sw.js', 'utf8').replace(
          '__PRECACHE__',
          JSON.stringify(['/', '/index.html', ...assets]),
        ),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr(), serviceWorker()],

  // Expose the Contentful variables under their existing names, so .env and
  // the Vercel environment do not need a VITE_ prefix.
  envPrefix: ['VITE_', 'CONTENTFUL_'],

  server: {
    host: true,
    port: 3000,
  },

  build: {
    outDir: 'build',
  },
})
