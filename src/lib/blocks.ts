import type { BlockEntry } from '../types/contentful'
import { isEntryOf } from '../types/contentful'

import { columnImageWidth, columnSizes } from './grid'
import type { ImageRequest } from './image'

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

// The image of that block as it is shown, for loading it ahead of the page
// (see Hero and Image). A hero that plays a video has none.
export function firstImage(
  blocks: (BlockEntry | undefined)[] = [],
): ImageRequest | undefined {
  const entry = blocks[firstImageBlock(blocks)]

  if (!entry) return undefined

  if (isEntryOf(entry, 'hero')) {
    const { asset } = entry.fields
    const isVideo = asset?.fields?.file?.contentType.startsWith('video/')

    return isVideo
      ? undefined
      : { image: asset, width: 1920, sizes: columnSizes() }
  }

  if (isEntryOf(entry, 'content_block')) {
    for (const column of entry.fields.columns ?? []) {
      if (!column || !isEntryOf(column, 'image')) continue

      const { image, size } = column.fields

      return {
        image,
        width: columnImageWidth(size),
        sizes: columnSizes(size),
      }
    }
  }

  return undefined
}
