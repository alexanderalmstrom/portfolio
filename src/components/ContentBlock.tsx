import { cn } from '../lib/cn'
import type { ContentBlockEntry } from '../types/contentful'
import { isEntryOf } from '../types/contentful'

import Column from './Column'
import Container from './Container'
import Image from './Image'

interface ContentBlockProps {
  entry?: ContentBlockEntry
  loading?: 'lazy' | 'eager'
  rise?: boolean
  slide?: boolean
}

// For each column, how many images come after it in its row. A row is full
// when the sizes of its columns add up to the 12 of the grid (see lib/grid),
// and a column without a size takes a whole row.
function imagesAfter(columns: ContentBlockEntry['fields']['columns'] = []) {
  const rows: number[] = []
  let filled = 0

  const placed = columns.map((entry) => {
    // Contentful may hand a size over as text.
    const size = Number(entry?.fields?.size) || 12

    if (!rows.length || filled + size > 12) {
      rows.push(0)
      filled = 0
    }

    filled += size

    const row = rows.length - 1
    const isImage = Boolean(entry && isEntryOf(entry, 'image'))

    return { row, before: isImage ? rows[row]++ : rows[row], isImage }
  })

  return placed.map(
    ({ row, before, isImage }) => rows[row] - before - (isImage ? 1 : 0),
  )
}

export default function ContentBlock({
  entry,
  loading,
  rise,
  slide,
}: ContentBlockProps) {
  if (!entry || !entry.fields) return null

  const { columns } = entry.fields

  const firstImage = (columns ?? []).findIndex(
    (entry) => entry && isEntryOf(entry, 'image'),
  )

  // A block can stack several images, so only its first one loads eagerly.
  const eagerColumn = loading == 'eager' ? firstImage : -1

  const hasImage = firstImage != -1

  // The images of a row slide in from right to left, the way they move.
  const after = imagesAfter(columns)

  // The margins of two blocks collapse into one, and the rows of images
  // within a block are kept as far apart as that, so images are evenly
  // spaced whether they share a block or not. On small screens they sit
  // closer together than a block of text does to its neighbours.
  return (
    <div className={cn('my-6 md:my-16', hasImage && 'my-4 sm:my-8')}>
      <Container
        nested
        className={cn(hasImage && 'gap-y-4 sm:gap-y-8 md:gap-y-16')}>
        {columns
          ? columns.map((entry, index) => {
              if (!entry) return null

              if (isEntryOf(entry, 'column')) {
                return <Column key={index} entry={entry} rise={rise} />
              }

              if (isEntryOf(entry, 'image')) {
                return (
                  <Image
                    key={index}
                    entry={entry}
                    loading={index == eagerColumn ? 'eager' : 'lazy'}
                    slide={slide}
                    stagger={after[index]}
                  />
                )
              }

              return null
            })
          : null}
      </Container>
    </div>
  )
}
