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
}

export default function ContentBlock({
  entry,
  loading,
  rise,
}: ContentBlockProps) {
  if (!entry || !entry.fields) return null

  const { columns } = entry.fields

  const firstImage = (columns ?? []).findIndex(
    (entry) => entry && isEntryOf(entry, 'image'),
  )

  // A block can stack several images, so only its first one loads eagerly.
  const eagerColumn = loading == 'eager' ? firstImage : -1

  const hasImage = firstImage != -1

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
