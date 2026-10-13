import type { QueryClient } from '@tanstack/react-query'

import { CARD_IMAGE } from '../components/Card.variants'
import { pageQuery, projectsQuery } from '../hooks/queries'

import { firstImage } from './blocks'
import { PAGE_IMAGE } from './grid'
import { preloadImage } from './image'

// The sky of the not found page: its code and the maps it is drawn from.
function prefetchSky() {
  import('../components/Starfield').then(({ preloadMaps }) => preloadMaps())
}

// Gets what the page at a path needs to show its top ready ahead of going
// there: its code, its content and the images it loads eagerly. Each page
// decides for itself what those are, which this has to follow (see Home,
// Project and Page). A path that leads nowhere gets the not found page.
export async function prefetchPage(pathname: string, queryClient: QueryClient) {
  const [, section, slug] = pathname.split('/')

  if (!section) {
    const projects = await queryClient.ensureQueryData(projectsQuery)

    for (const entry of projects.slice(0, 2)) {
      preloadImage({ image: entry.fields.image, ...CARD_IMAGE.half })
    }
  }

  if (section == 'project' && slug) {
    import('../components/Project')

    const projects = await queryClient.ensureQueryData(projectsQuery)
    const entry = projects.find((entry) => entry.fields.slug === slug)
    const image = firstImage(entry?.fields.blocks)

    if (image) preloadImage(image)
    if (!entry) prefetchSky()
  }

  if (section == 'page' && slug) {
    import('../components/Page')

    const entry = await queryClient.ensureQueryData(pageQuery(slug))
    const image = firstImage(entry.fields?.blocks)

    preloadImage(image ?? { image: entry.fields?.image, ...PAGE_IMAGE })
  }

  if (section && !(slug && (section == 'project' || section == 'page'))) {
    prefetchSky()
  }
}
