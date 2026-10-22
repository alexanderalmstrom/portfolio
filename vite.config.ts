import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  // Start's plugin has to come before React's. Nitro builds the server for
  // the platform it runs on: Vercel when deployed there, Node otherwise.
  plugins: [
    tanstackStart(),
    // The router and React Query mark their files "use client" for React
    // Server Components, which this site doesn't use. Bundling the server
    // drops the directive to no effect, so the warning about it is muted.
    nitro({
      rolldownConfig: {
        onLog(level, log, handler) {
          if (log.code != 'MODULE_LEVEL_DIRECTIVE') handler(level, log)
        },
      },
    }),
    react(),
    tailwindcss(),
    svgr(),
  ],

  server: {
    host: true,
    port: 3000,
  },

  environments: {
    client: {
      build: {
        // What comes from node_modules changes far less often than the site
        // does, so it gets files of its own that stay cached between
        // deploys. Marked is left out to stay with the pages that are
        // loaded on demand. Start's code imports that of the site, which
        // stays out of the vendor file all the same.
        rolldownOptions: {
          output: {
            codeSplitting: {
              groups: [
                {
                  name: 'react',
                  test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                  priority: 2,
                },
                {
                  name: 'vendor',
                  test: /node_modules[\\/](?!marked[\\/])[^.]/,
                  includeDependenciesRecursively: false,
                  priority: 1,
                },
              ],
            },
          },
        },
      },
    },
  },
})
