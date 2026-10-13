import { queryOptions, useQuery } from '@tanstack/react-query'

import { getSpace } from '../services/contentful'
import * as entryService from '../services/entry'
import type { PageEntry, ProjectEntry } from '../types/contentful'

export function useSpace() {
  return useQuery({
    queryKey: ['space'],
    queryFn: getSpace,
  })
}

// The queries are also run ahead of the page that uses them (see
// lib/prefetch), which has to ask for them in the same way.
export const projectsQuery = queryOptions({
  queryKey: ['projects'],
  queryFn: () => entryService.getEntries<ProjectEntry>('project'),
})

export const pageQuery = (slug?: string) =>
  queryOptions({
    queryKey: ['page', slug],
    queryFn: () => entryService.getEntryBySlug<PageEntry>('page', slug!),
    enabled: Boolean(slug),
  })

export function useProjects() {
  return useQuery(projectsQuery)
}

export function usePage(slug?: string) {
  return useQuery(pageQuery(slug))
}
