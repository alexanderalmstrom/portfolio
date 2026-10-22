import { useCallback, useEffect, useRef, useState } from 'react'

// Flags content as loaded shortly after its image has loaded, which triggers
// the fade-in transition (see lib/animate). Being told more than once, as an
// image can be (see ImageContentful), changes nothing.
export function useLoaded() {
  const [isLoaded, setIsLoaded] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(
    () => () => {
      clearTimeout(timeout.current)
      timeout.current = undefined
    },
    [],
  )

  const handleLoaded = useCallback(() => {
    if (timeout.current) return

    timeout.current = setTimeout(() => setIsLoaded(true), 100)
  }, [])

  return [isLoaded, handleLoaded] as const
}
