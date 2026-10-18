import type { BlockEntry } from '../types/contentful'
import { isEntryOf } from '../types/contentful'

import ContentBlock from './ContentBlock'
import Hero from './Hero'

interface BlockProps {
  entry?: BlockEntry
  loading?: 'lazy' | 'eager'
  // Whether images slide in from the right (see Image).
  slide?: boolean
}

export default function Block({ entry, loading, slide }: BlockProps) {
  if (!entry || !entry.fields) return null

  if (isEntryOf(entry, 'content_block')) {
    return <ContentBlock entry={entry} loading={loading} slide={slide} />
  }

  if (isEntryOf(entry, 'hero')) return <Hero entry={entry} />

  return null
}
