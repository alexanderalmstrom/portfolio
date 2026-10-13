import { useMemo } from 'react'

import {
  HEADINGS,
  SETTLE_REST,
  TEXT,
  useRiseLines,
} from '../hooks/useRiseLines'
import { cn } from '../lib/cn'
import { columnClass } from '../lib/grid'
import { markdown } from '../services/markdown'
import type { ColumnEntry } from '../types/contentful'

interface ColumnProps {
  entry?: ColumnEntry
  // All of the text rises line by line. Without it only the headings do,
  // and the rest settles.
  rise?: boolean
}

export default function Column({ entry, rise = false }: ColumnProps) {
  const { content, size } = entry?.fields ?? {}

  // Kept between renders, so React leaves the split lines alone.
  const html = useMemo(() => markdown(content), [content])
  const ref = useRiseLines<HTMLDivElement>(rise ? TEXT : HEADINGS)

  if (!html) return null

  return (
    <div
      ref={ref}
      className={cn(
        columnClass(size),
        'px-8 text-foreground/60',
        !rise && SETTLE_REST,
      )}
      dangerouslySetInnerHTML={html}
    />
  )
}
