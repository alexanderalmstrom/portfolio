import { useLayoutEffect, useRef } from 'react'

import { riseLines } from '../lib/riseLines'

// Every kind of text that can rise, and the headings among them.
export const TEXT = 'p, li, h1, h2, h3, h4, h5, h6, blockquote'
export const HEADINGS = 'h1, h2, h3, h4, h5, h6'

// For the element that holds text of which only the headings rise: the rest
// of what is in it fades in and settles instead. It is not set on the
// element as a whole, as a heading would then fade in while it rises.
export const SETTLE_REST =
  'motion-safe:[&>:not(h1,h2,h3,h4,h5,h6)]:animate-settle'

// Lets the text of the elements matching the selector, within the element
// the returned ref is set on, rise line by line when it mounts (see
// lib/riseLines). The lines are staggered from one element to the next.
export function useRiseLines<T extends HTMLElement>(selector: string | false) {
  const ref = useRef<T>(null)

  // A layout effect, so the text is never painted before it is split.
  useLayoutEffect(() => {
    const root = ref.current

    if (!root || !selector) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const restores: (() => void)[] = []
    let first = 0

    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      // Only the innermost match, such as the paragraph of a list item.
      if (element.querySelector(selector)) continue

      const risen = riseLines(element, first)

      if (!risen) continue

      first += risen.count
      restores.push(risen.restore)
    }

    return () => restores.forEach((restore) => restore())
  }, [selector])

  return ref
}
