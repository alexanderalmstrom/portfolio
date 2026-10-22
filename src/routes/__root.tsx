/// <reference types="vite/client" />
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  retainSearchParams,
  Scripts,
} from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'

import Grain from '../components/Grain'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import { spaceQuery } from '../hooks/queries'
import { DESCRIPTION, ROLE } from '../lib/contact'
import { isApple } from '../services/helpers'

import appCss from '../styles/index.css?url'

interface RouterContext {
  queryClient: QueryClient
}

// A page opened with ?preview shows drafts, if the server allows it (see
// isPreview), and so does every page it links on to.
interface Search {
  preview?: true
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: (search: Record<string, unknown>): Search =>
    search.preview ? { preview: true } : {},
  search: { middlewares: [retainSearchParams(['preview'])] },
  beforeLoad: ({ search }) => ({ preview: Boolean(search.preview) }),
  // The name of the site is that of the space, which every page shows.
  loader: ({ context }) => context.queryClient.ensureQueryData(spaceQuery),
  // What a page does not set itself. A page that is not found or failed to
  // load says so in its title.
  head: ({ matches, loaderData: space }) => {
    const failed = matches.some((match) => match.status == 'error')
    const missing = matches.some(
      (match) => match.status == 'notFound' || match._notFound,
    )

    return {
      meta: [
        { charSet: 'utf-8' },
        {
          title: failed
            ? isApple()
              ? 'x_x'
              : ':('
            : missing
              ? 'Page not found'
              : space
                ? `${space.name} - ${ROLE}`
                : ROLE,
        },
        { name: 'description', content: DESCRIPTION },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'msapplication-TileColor', content: '#000000' },
        { name: 'color-scheme', content: 'dark light' },
      ],
      links: [
        { rel: 'preconnect', href: 'https://images.ctfassets.net' },
        {
          rel: 'preload',
          href: '/fonts/CircularStd-Book.woff2',
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          href: '/fonts/CircularStd-Medium.woff2',
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous',
        },
        { rel: 'stylesheet', href: appCss },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#000000' },
      ],
    }
  },
  shellComponent: RootDocument,
  component: Root,
})

// The document every page is rendered in, which an error screen is shown in
// as well (see ErrorScreen).
function RootDocument({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Text that comes in line by line is hidden until the page can split it
    // into lines (see useRiseLines), as is the cover of a page that is held
    // up by it (see PageTransition).
    document.documentElement.dataset.hydrated = ''

    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function () {
        console.log('Service Worker Registered')
      })
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* The colour the browser gives its own bars, which the not found
            page changes on the light theme (see NotFound). The head of a
            route keeps one tag per name, so these two are written out. */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <div>
          {children}
          <Grain />
        </div>
        <noscript>
          You need to activate JavaScript in your browser to view this site.
        </noscript>
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}

// The cover between two pages is not part of the page it covers.
function Root() {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <PageTransition />
    </>
  )
}
