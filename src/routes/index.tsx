import { createFileRoute } from '@tanstack/react-router'

import { CARD_IMAGE } from '../components/Card.variants'
import Home from '../components/Home'
import { projectsQuery } from '../hooks/queries'
import { preloadImage } from '../lib/image'

export const Route = createFileRoute('/')({
  // The first row of cards is above the fold, so their images load along
  // with the projects (see Home).
  loader: async ({ context: { queryClient, preview } }) => {
    const projects = await queryClient.ensureQueryData(projectsQuery(preview))

    for (const entry of projects.slice(0, 2)) {
      preloadImage({ image: entry.fields.image, ...CARD_IMAGE.half })
    }
  },
  component: Home,
})
