import { useEffect, useRef, useState } from 'react'

// How much of an element has to be in the viewport for it to count as in
// view, so what it triggers is not over before anyone can see it.
const THRESHOLD = 0.15

// Whether the element the returned ref is set on has come into view. It
// stays true from then on.
export function useInView<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element || !enabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        setInView(true)
        observer.disconnect()
      },
      { threshold: THRESHOLD },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [enabled])

  return [ref, inView] as const
}
