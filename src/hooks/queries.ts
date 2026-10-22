import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'

import { getPage, getProjects, getSpace } from '../services/content'

// The queries are run by the loader of the route that shows them, which
// renders on the server with them in place, and read here by the components
// of the route. Both have to ask for them in the same way.
export const spaceQuery = queryOptions({
  queryKey: ['space'],
  queryFn: () => getSpace(),
})

export const projectsQuery = (preview: boolean) =>
  queryOptions({
    queryKey: ['projects', preview],
    queryFn: () => getProjects({ data: { preview } }),
  })

export const pageQuery = (slug: string, preview: boolean) =>
  queryOptions({
    queryKey: ['page', slug, preview],
    queryFn: () => getPage({ data: { slug, preview } }),
  })

// Whether the page was opened with ?preview, which asks for drafts (see the
// root route).
export function usePreview() {
  return useSearch({
    from: '__root__',
    select: (search) => Boolean(search.preview),
  })
}

export function useSpace() {
  return useSuspenseQuery(spaceQuery)
}

export function useProjects() {
  return useSuspenseQuery(projectsQuery(usePreview()))
}

export function usePage(slug: string) {
  return useSuspenseQuery(pageQuery(slug, usePreview()))
}
