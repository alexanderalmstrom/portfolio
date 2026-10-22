import { env } from '../env.server'
import type { Space } from '../types/contentful'

import { resolveLinks } from './links'
import type { Collection } from './links'

type Query = Record<string, string | number>

// How long a request may take, in milliseconds. Retries are handled by the
// query client.
const TIMEOUT = 10000

// Whether to show drafts: always in development, and otherwise when the
// server is set up to, or when the page asks for them with ?preview. Either
// way only with a preview token to read them with.
function isPreview(requested: boolean) {
  if (!env.CONTENTFUL_PREVIEW_ACCESS_TOKEN) return false

  if (import.meta.env.DEV) return true

  return env.CONTENTFUL_PREVIEW || requested
}

// The site only reads published content, or drafts in preview, so it talks
// to the delivery API directly instead of through the Contentful SDK. This
// only ever runs on the server, so the tokens never reach the browser.
function getConfig(preview: boolean) {
  const previewToken = isPreview(preview)
    ? env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
    : undefined

  return {
    space: `https://${previewToken ? 'preview' : 'cdn'}.contentful.com/spaces/${env.CONTENTFUL_SPACE_ID}`,
    environment: env.CONTENTFUL_ENVIRONMENT,
    accessToken: previewToken ?? env.CONTENTFUL_ACCESS_TOKEN,
  }
}

async function request<Payload>(
  url: string,
  accessToken: string,
  query: Query = {},
) {
  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  )

  const response = await fetch(`${url}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`Contentful responded with ${response.status}`)
  }

  return response.json() as Promise<Payload>
}

export function getSpace() {
  const { space, accessToken } = getConfig(false)

  return request<Space>(space, accessToken)
}

// The entries that match a query, with what they link to in place.
export async function getEntries<Item>(query: Query, preview: boolean) {
  const { space, environment, accessToken } = getConfig(preview)

  const collection = await request<Collection>(
    `${space}/environments/${environment}/entries`,
    accessToken,
    query,
  )

  return resolveLinks<Item>(collection)
}
