import { useMemo } from 'react'

import { useRiseLines } from '../hooks/useRiseLines'
import { cn } from '../lib/cn'
import { columnClass } from '../lib/grid'
import { markdown } from '../services/markdown'
import type { ColumnEntry } from '../types/contentful'

interface ColumnProps {
  entry?: ColumnEntry
  // The text rises line by line instead of settling as a whole.
  rise?: boolean
}

const TEXT = 'p, li, h1, h2, h3, h4, h5, h6, blockquote'

export default function Column({ entry, rise = false }: ColumnProps) {
  const { content, size } = entry?.fields ?? {}

  // Kept between renders, so React leaves the split lines alone.
  const html = useMemo(() => markdown(content), [content])
  const ref = useRiseLines<HTMLDivElement>(rise && TEXT)

  if (!html) return null

  return (
    <div
      ref={ref}
      className={cn(
        columnClass(size),
        'px-8 text-foreground/60',
        !rise && 'motion-safe:animate-settle',
      )}
      dangerouslySetInnerHTML={html}
    />
  )
}
