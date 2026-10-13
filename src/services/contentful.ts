import type { Space } from '../types/contentful'

import { resolveLinks } from './links'
import type { Collection } from './links'

type Query = Record<string, string | number>

// How long a request may take, in milliseconds. Retries are handled by the
// query client.
const TIMEOUT = 10000

// The site only reads published content, or drafts in preview, so it talks
// to the delivery API directly instead of through the Contentful SDK.
function getConfig() {
  const {
    CONTENTFUL_SPACE_ID,
    CONTENTFUL_ACCESS_TOKEN,
    CONTENTFUL_PREVIEW_ACCESS_TOKEN,
    CONTENTFUL_ENVIRONMENT,
  } = import.meta.env

  if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_ACCESS_TOKEN) {
    throw new Error('Contentful space id and access token is required in .env')
  }

  const preview = CONTENTFUL_PREVIEW_ACCESS_TOKEN && isPreview()

  return {
    space: `https://${preview ? 'preview' : 'cdn'}.contentful.com/spaces/${CONTENTFUL_SPACE_ID}`,
    environment: CONTENTFUL_ENVIRONMENT || 'master',
    accessToken: preview
      ? CONTENTFUL_PREVIEW_ACCESS_TOKEN
      : CONTENTFUL_ACCESS_TOKEN,
  }
}

// The token goes in the query instead of a header, which saves the browser
// from asking the API for permission before every request.
async function request<Payload>(url: string, query: Query = {}) {
  const params = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    ),
    access_token: getConfig().accessToken,
  })

  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`Contentful responded with ${response.status}`)
  }

  return response.json() as Promise<Payload>
}

export function getSpace() {
  return request<Space>(getConfig().space)
}

// The entries that match a query, with what they link to in place.
export async function getEntries<Item>(query: Query) {
  const { space, environment } = getConfig()

  const collection = await request<Collection>(
    `${space}/environments/${environment}/entries`,
    query,
  )

  return resolveLinks<Item>(collection)
}

export function isPreview() {
  if (!import.meta.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN) return false

  if (import.meta.env.DEV) return true

  if (import.meta.env.CONTENTFUL_PREVIEW == 'true') return true

  return Boolean(new URLSearchParams(location.search).get('preview'))
}
