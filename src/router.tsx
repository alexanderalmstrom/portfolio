import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import ErrorScreen from './components/ErrorScreen'
import Loading from './components/Loading'
import NotFound from './components/NotFound'
import { routeTree } from './routeTree.gen'

// A router, and a query client of its own, is made for every page the server
// renders, so what one visitor is sent is never cached for another. The
// browser makes one of each when it takes over the page, along with the
// content the server rendered it with.
export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Content is fetched once per visit.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        // Contentful entries hold resolved links, which can make them
        // circular, so results are stored as they are instead of being
        // deeply compared.
        structuralSharing: false,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Scrolls to the top on a new navigation and back to where the visitor
    // was on back and forward.
    scrollRestoration: true,
    // The query client decides whether what a route loads is still fresh.
    defaultPreloadStaleTime: 0,
    // Shown when the next page takes a while to load, which the cover
    // between two pages mostly hides (see PageTransition).
    defaultPendingComponent: Loading,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorScreen,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
