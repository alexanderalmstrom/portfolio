import type { BlockEntry } from '../types/contentful'
import { isEntryOf } from '../types/contentful'

// The index of the first block that shows an image, or -1 without one. That
// image is the one closest to the top of the page, so it loads eagerly.
export function firstImageBlock(blocks: (BlockEntry | undefined)[] = []) {
  return blocks.findIndex((entry) => {
    if (!entry || !entry.fields) return false

    if (isEntryOf(entry, 'hero')) return true

    if (isEntryOf(entry, 'content_block')) {
      return (entry.fields.columns ?? []).some(
        (column) => column && isEntryOf(column, 'image'),
      )
    }

    return false
  })
}
