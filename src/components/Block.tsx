import type { BlockEntry } from '../types/contentful'
import { isEntryOf } from '../types/contentful'

import ContentBlock from './ContentBlock'
import Hero from './Hero'

interface BlockProps {
  entry?: BlockEntry
  loading?: 'lazy' | 'eager'
  // Whether text rises line by line (see Column).
  rise?: boolean
}

export default function Block({ entry, loading, rise }: BlockProps) {
  if (!entry || !entry.fields) return null

  if (isEntryOf(entry, 'content_block')) {
    return <ContentBlock entry={entry} loading={loading} rise={rise} />
  }

  if (isEntryOf(entry, 'hero')) return <Hero entry={entry} />

  return null
}
