import { createFileRoute, notFound } from '@tanstack/react-router'

import Page from '../components/Page'
import { pageQuery, spaceQuery } from '../hooks/queries'
import { firstImage } from '../lib/blocks'
import { pageHead } from '../lib/head'
import { PAGE_IMAGE } from '../lib/grid'
import { preloadImage } from '../lib/image'
import { prefetchSky } from '../lib/prefetch'

export const Route = createFileRoute('/page/$slug')({
  // The first image of a page loads along with it: that of the first block
  // that has one, or else the one in its header (see Page). A slug that is
  // not a page leads to the not found page, whose sky starts loading as
  // well.
  loader: async ({ context: { queryClient, preview }, params: { slug } }) => {
    const [space, entry] = await Promise.all([
      queryClient.ensureQueryData(spaceQuery),
      queryClient.ensureQueryData(pageQuery(slug, preview)),
    ])

    if (!entry?.fields) {
      prefetchSky()
      throw notFound()
    }

    preloadImage(
      firstImage(entry.fields.blocks) ?? {
        image: entry.fields.image,
        ...PAGE_IMAGE,
      },
    )

    return {
      title: `${entry.fields.name} - ${space.name}`,
      description: entry.fields.description,
    }
  },
  head: ({ loaderData }) => pageHead(loaderData),
  component: Page,
})
