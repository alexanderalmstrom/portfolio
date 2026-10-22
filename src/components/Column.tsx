import { useMemo } from 'react'

import { HEADINGS, TEXT, useRiseLines } from '../hooks/useRiseLines'
import { cn } from '../lib/cn'
import { columnClass } from '../lib/grid'
import { markdown } from '../services/markdown'
import type { ColumnEntry } from '../types/contentful'

interface ColumnProps {
  entry?: ColumnEntry
}

// A paragraph that starts with a bold label, as each of the credits beside
// the text of a project does.
const LABELLED = /<p><strong>/

// The headings of the text rise line by line, and the rest of it settles
// (see useRiseLines). All of the credits rise, one after the other.
export default function Column({ entry }: ColumnProps) {
  const { content, size } = entry?.fields ?? {}

  // Kept between renders, so React leaves the split lines alone.
  const html = useMemo(() => markdown(content), [content])
  const isCredits = Boolean(html && LABELLED.test(html.__html))
  const ref = useRiseLines<HTMLDivElement>(isCredits ? TEXT : HEADINGS)

  if (!html) return null

  return (
    <div
      ref={ref}
      className={cn(columnClass(size), 'px-8 text-foreground/60')}
      data-rise-lines=""
      dangerouslySetInnerHTML={html}
    />
  )
}
