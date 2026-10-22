// What a page tells about itself in the head of the document: its title,
// and its description where it has one, which then takes the place of that
// of the site (see the root route). A page that was not found has neither.
export interface PageMeta {
  title: string
  description?: string
}

export function pageHead(meta?: PageMeta) {
  if (!meta) return {}

  return {
    meta: [
      { title: meta.title },
      ...(meta.description
        ? [{ name: 'description', content: meta.description }]
        : []),
    ],
  }
}
