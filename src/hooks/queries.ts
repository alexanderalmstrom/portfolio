import { useQuery } from '@tanstack/react-query'

import { getSpace } from '../services/contentful'
import * as entryService from '../services/entry'
import type { PageEntry, ProjectEntry } from '../types/contentful'

export function useSpace() {
  return useQuery({
    queryKey: ['space'],
    queryFn: getSpace,
  })
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => entryService.getEntries<ProjectEntry>('project'),
  })
}

export function usePage(slug?: string) {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => entryService.getEntryBySlug<PageEntry>('page', slug!),
    enabled: Boolean(slug),
  })
}
