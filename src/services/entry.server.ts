import type { Entry } from '../types/contentful'

import * as contentful from './contentful.server'

type AnyEntry = Entry<string, unknown>
type ContentTypeId<Item extends AnyEntry> =
  Item['sys']['contentType']['sys']['id']

export function getEntries<Item extends AnyEntry>(
  content_type: ContentTypeId<Item>,
  preview: boolean,
) {
  return contentful.getEntries<Item>(
    {
      content_type: content_type,
      order: '-fields.date',
      include: 2,
    },
    preview,
  )
}

// The entry with the given slug, or null when there is none.
export function getEntryBySlug<Item extends AnyEntry>(
  content_type: ContentTypeId<Item>,
  slug: string,
  preview: boolean,
) {
  return contentful
    .getEntries<Item>(
      {
        content_type: content_type,
        'fields.slug': slug,
        include: 2,
      },
      preview,
    )
    .then((items) => items[0] ?? null)
}
