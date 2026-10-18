import { useLayoutEffect, useRef } from 'react'

import { riseLines, settle } from '../lib/riseLines'

// Every kind of text that comes in, and the headings among them.
export const TEXT = 'p, li, h1, h2, h3, h4, h5, h6, blockquote'
export const HEADINGS = 'h1, h2, h3, h4, h5, h6'

// Lets the text within the element the returned ref is set on come in when
// it mounts (see lib/riseLines). The elements matching the selector rise
// line by line, each a step after the one before it, and the rest of the
// text fades in and settles as a whole, all at once.
export function useRiseLines<T extends HTMLElement>(rise: string) {
  const ref = useRef<T>(null)

  // A layout effect, so the text is never painted before it is split.
  useLayoutEffect(() => {
    const root = ref.current

    if (!root) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const restores: (() => void)[] = []
    let first = 0

    for (const element of root.querySelectorAll<HTMLElement>(TEXT)) {
      // Only the innermost match, such as the paragraph of a list item.
      if (element.querySelector(TEXT)) continue

      if (!element.matches(rise)) {
        restores.push(settle(element))
        continue
      }

      const restore = riseLines(element, first)

      if (!restore) continue

      first++
      restores.push(restore)
    }

    return () => restores.forEach((restore) => restore())
  }, [rise])

  return ref
}
