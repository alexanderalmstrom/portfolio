import type { Entry } from '../types/contentful'

import * as contentful from './contentful'

type AnyEntry = Entry<string, unknown>
type ContentTypeId<Item extends AnyEntry> =
  Item['sys']['contentType']['sys']['id']

export class EntryNotFoundError extends Error {
  constructor() {
    super('Entry not found')
  }
}

export function getEntries<Item extends AnyEntry>(
  content_type: ContentTypeId<Item>,
) {
  return contentful.getEntries<Item>({
    content_type: content_type,
    order: '-fields.date',
    include: 2,
  })
}

export function getEntryBySlug<Item extends AnyEntry>(
  content_type: ContentTypeId<Item>,
  slug: string,
) {
  return contentful
    .getEntries<Item>({
      content_type: content_type,
      'fields.slug': slug,
      include: 2,
    })
    .then((items) => {
      if (!items.length) {
        throw new EntryNotFoundError()
      }

      return items[0]
    })
}
