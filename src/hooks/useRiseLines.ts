import { useLayoutEffect, useRef } from 'react'

import { riseLines } from '../lib/riseLines'

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
