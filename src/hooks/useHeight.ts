import { useLayoutEffect, useRef } from 'react'

// Keeps the height of the element the returned ref is set on in its --height
// custom property, for styles that have to know it.
export function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  // A layout effect, so the property is there before the first paint.
  useLayoutEffect(() => {
    const element = ref.current

    if (!element) return

    const measure = () => {
      element.style.setProperty('--height', `${element.offsetHeight}px`)
    }

    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return ref
}
