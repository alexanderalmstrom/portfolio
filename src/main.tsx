import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'

import App from './components/App'
import { EntryNotFoundError } from './services/entry'

import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Content is fetched once per visit.
      staleTime: Infinity,
      // Retries are handled here rather than by the Contentful client. An
      // unknown page slug is reported straight away instead of retried.
      retry: (failureCount, error) =>
        !(error instanceof EntryNotFoundError) && failureCount < 3,
      refetchOnWindowFocus: false,
      // Contentful entries hold resolved links, which can make them circular,
      // so results are stored as they are instead of being deeply compared.
      structuralSharing: false,
    },
  },
})

createRoot(document.getElementById('app')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Analytics />
  </QueryClientProvider>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function () {
    console.log('Service Worker Registered')
  })
}
