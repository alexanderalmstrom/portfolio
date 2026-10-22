import { createFileRoute, notFound } from '@tanstack/react-router'

import Project from '../components/Project'
import { projectsQuery, spaceQuery } from '../hooks/queries'
import { firstImage } from '../lib/blocks'
import { pageHead } from '../lib/head'
import { preloadImage } from '../lib/image'
import { prefetchSky } from '../lib/prefetch'

export const Route = createFileRoute('/project/$slug')({
  // A project is one of the projects, and its first image loads along with
  // them (see Project). A slug that is not one of them leads to the not
  // found page, whose sky starts loading as well.
  loader: async ({ context: { queryClient, preview }, params: { slug } }) => {
    const [space, projects] = await Promise.all([
      queryClient.ensureQueryData(spaceQuery),
      queryClient.ensureQueryData(projectsQuery(preview)),
    ])

    const entry = projects.find((entry) => entry.fields.slug === slug)

    if (!entry) {
      prefetchSky()
      throw notFound()
    }

    const image = firstImage(entry.fields.blocks)

    if (image) preloadImage(image)

    return {
      title: `${entry.fields.name} - ${space.name}`,
      description: entry.fields.description,
    }
  },
  head: ({ loaderData }) => pageHead(loaderData),
  component: Project,
})
