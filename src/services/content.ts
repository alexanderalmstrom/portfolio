import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import type { PageEntry, ProjectEntry } from '../types/contentful'

import * as contentful from './contentful.server'
import * as entryService from './entry.server'

// The content of the site, fetched from Contentful on the server. Rendering
// a page on the server calls these directly, and the browser calls them over
// the network when it goes to another page, so the Contentful tokens stay on
// the server either way. Whether drafts are shown is decided there as well
// (see isPreview).
export const getSpace = createServerFn({ method: 'GET' }).handler(() =>
  contentful.getSpace(),
)

export const getProjects = createServerFn({ method: 'GET' })
  .validator(z.object({ preview: z.boolean() }))
  .handler(({ data }) =>
    entryService.getEntries<ProjectEntry>('project', data.preview),
  )

// The page with the given slug, or null when there is none.
export const getPage = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string(), preview: z.boolean() }))
  .handler(({ data }) =>
    entryService.getEntryBySlug<PageEntry>('page', data.slug, data.preview),
  )
