import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

const APPLE = /Mac|iPhone|iPad|iPod/

// iPhones and iPads count as Apple devices too. A page rendered on the
// server goes by the browser that asked for it, so it renders the same in
// that browser.
export const isApple = createIsomorphicFn()
  .server(() => APPLE.test(getRequestHeader('user-agent') ?? ''))
  .client(() => APPLE.test(navigator.userAgent))
